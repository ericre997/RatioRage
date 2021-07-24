import { Scene } from "@babylonjs/core/scene";
import { Mesh, GroundMesh, InstancedMesh } from "@babylonjs/core/Meshes";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TerrainMaterial, WaterMaterial } from "@babylonjs/materials";
import { Color3, Vector2 } from "@babylonjs/core/Maths/math";
import { PhysicsImpostor } from "@babylonjs/core/Physics";
import "@babylonjs/core/Physics/physicsEngineComponent";
import { MeshBuilder } from "@babylonjs/core/Meshes";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { ColorMap } from "./ColorMap";

// TODO:  
// mist in background


export class Environment
{
    public readonly minHeightForTreePlacment : number = 1;
    public skybox : Mesh;
    public groundMesh : GroundMesh;
    public waterMesh : Mesh;
    public colorMap : ColorMap;
    public tree_instances : InstancedMesh[];

    
    public setup(scene: Scene, onBuildComplete: () => void) {
        this.skybox = this.createSkybox(scene);

        this.waterMesh = this.createWater(this.skybox, scene);

        this.groundMesh = this.createGround(scene);

        this.colorMap = new ColorMap(this.groundMesh.subdivisionsX, 
            this.groundMesh.subdivisionsY, 
            this.groundMesh._width, 
            this.groundMesh._height);

        this.colorMap.buildColorMap(scene, 
            (this.groundMesh.material as TerrainMaterial).mixTexture.name, 
            () => { this.tree_instances = this.placeTrees(scene); 
            if(onBuildComplete) { onBuildComplete(); }});      
    }

    private shuffle(array : any[]) : any[] {
        let currentIndex = array.length;
        while(0 != currentIndex) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    private createSkybox(scene: Scene) : Mesh {
        let skybox = MeshBuilder.CreateBox("skyBox", {size:2000.0}, scene);
        let skyboxMaterial = new StandardMaterial("skyBoxMat", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new CubeTexture("textures/skybox/TropicalSunnyDay", scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        skyboxMaterial.disableLighting = true;
        skybox.material = skyboxMaterial;
    
        return skybox;
    }    
    
    private createWater(skybox: Mesh, scene: Scene) : Mesh{
        let waterMesh = Mesh.CreateGround("watermesh", 2048, 2048, 16, scene, false);
        let water = new WaterMaterial("water", scene, new Vector2(512, 512));
        water.backFaceCulling = true;
        water.bumpTexture = new Texture("textures/water/waterbump.png", scene);
        water.windForce = -10;
        water.waveHeight = .1; //1.7;
        water.bumpHeight = .1;
        water.windDirection = new Vector2(1,1);
        water.waterColor = new Color3(0, 0, 221/225);
        water.colorBlendFactor = 0.0;
        water.addToRenderList(skybox);
        
        waterMesh.material = water;
        return waterMesh;
    }

    private createGround(scene : Scene) : GroundMesh {
    
        var ground = MeshBuilder.CreateGroundFromHeightMap(
            "terrain", 
            "textures/ground/heightMap2.png", 
            {width:100,height:100,subdivisions:100,minHeight:0,maxHeight:10,
            onReady: (mesh) => {
                ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.HeightmapImpostor, {mass:0});
            }}
            ,scene);
    
        var groundMaterial = new TerrainMaterial("terrainMaterial", scene);
        groundMaterial.specularColor = new Color3(0.5,0.5,0.5);
        groundMaterial.specularPower = 64;
    
        // 1,2,3 => red, green, blue
        groundMaterial.mixTexture = new Texture("textures/ground/mixMap.png", scene);        
        groundMaterial.diffuseTexture1 = new Texture("textures/ground/floor.png", scene); 
        groundMaterial.diffuseTexture2 = new Texture("textures/ground/rock.png", scene);  
        groundMaterial.diffuseTexture3 = new Texture("textures/ground/grass.png", scene); 
    
        groundMaterial.bumpTexture1 = new Texture("textures/ground/floor_bump.png", scene); 
        groundMaterial.bumpTexture2 = new Texture("textures/ground/rockn.png", scene); 
        groundMaterial.bumpTexture3 = new Texture("textures/ground/grassn.png", scene); 
    
        groundMaterial.diffuseTexture1.uScale = groundMaterial.diffuseTexture1.vScale=10;
        groundMaterial.diffuseTexture2.uScale = groundMaterial.diffuseTexture2.vScale=10;
        groundMaterial.diffuseTexture3.uScale = groundMaterial.diffuseTexture3.vScale=10;
        
        ground.position.y = 0; 
        ground.material = groundMaterial;
        ground.isPickable = true;
    
        return ground;
    }
    
    private placeTrees(scene : Scene) : InstancedMesh[] {
    
        let numTrees = 50;    
        let instances = new Array<InstancedMesh>();

        let positions = this.colorMap.getPositions((color: Color3) => { return color.b == 1 && !color.r && !color.g; })    
        for(let i = positions.length - 1; i >= 0; i--) {
            if(this.groundMesh.getHeightAtCoordinates(positions[i].x, positions[i].z) < this.minHeightForTreePlacment ) {
                positions.splice(i, 1);
            }
        }
        positions = this.shuffle(positions).slice(0,numTrees);
    
        let promises = [];
    
        promises.push(SceneLoader.ImportMeshAsync("PalmTree", "Blender\\Tree\\","Tree2.glb", scene)
            .then((result) => {
                let trunk = <Mesh>result.meshes[1];
                trunk.isVisible = false;
                trunk.isPickable = false;
                trunk.parent = null;
        
                let foilage = <Mesh>result.meshes[2];
                foilage.isVisible = false;
                foilage.isPickable = false;
                foilage.parent = null;
                    
                for(let i = 0; i < numTrees; i++) {
                    let newTrunk = trunk.createInstance("trunk_" + i);
                    newTrunk.isPickable = false;
                    let newFoilage = foilage.createInstance("foilage_" + i);
                    newFoilage.isPickable = false;
                    newFoilage.parent = newTrunk;
                    newTrunk.position = positions[i];
                    newTrunk.position.y = this.groundMesh.getHeightAtCoordinates(newTrunk.position.x, newTrunk.position.z);
                    
                    instances.push(newTrunk);
                }
            }));
    
        Promise.all(promises);
        
        return instances;
    };    
}