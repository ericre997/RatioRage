import { Scene } from "@babylonjs/core/scene";
import { Mesh, InstancedMesh } from "@babylonjs/core/Meshes";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { ParticleHelper } from "@babylonjs/core/Particles";
import { Ratio } from "./Ratio";
import { ExplodableMeshInstance } from "./ExplodableMeshInstance";
import { BarrelInstance } from "./BarrelInstance";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";


export class BarrelFactory {
    public readonly explosionTTL : number = 3000;
    public readonly barrelHeight : number = 3.1196;

    public numCreated : number = 0;
    public wholeMeshes : Array<Mesh> = new Array<Mesh>();
    public fragmentMeshes : Array<Mesh> = new Array<Mesh>();

    public static create(scene: Scene) : Promise<BarrelFactory> {
        let barrelFactory = new BarrelFactory();
        return barrelFactory.loadMeshes(scene).then( () => {return barrelFactory;} );
    }

    private constructor() {
    }

    private loadMeshes(scene: Scene) : Promise<any>
    {
        return SceneLoader.ImportMeshAsync("", "Blender\\Barrel\\","BarrelWholeAndPieces.glb", scene)
            .then((result) => {
                for(let i = 0; i < result.meshes.length; i++){
                    let thisMesh = <Mesh>result.meshes[i];
                    thisMesh.isVisible = false;
                    thisMesh.isPickable = false;
                    thisMesh.parent = null;
                 //   let mat = new StandardMaterial("test", scene);
                 //   mat.diffuseColor.r = 1;
                 //   thisMesh.material = mat;
                    if(thisMesh.name.startsWith("BarrelWhole")) {
                        this.wholeMeshes.push(thisMesh);
                    } else if (thisMesh.name.startsWith("BarrelPiece")) {
                        this.fragmentMeshes.push(thisMesh);
                    }
                }
            });
    }


    public createBarrelInstanceAsync(scene : Scene) : Promise<BarrelInstance> {

        let barrelId = this.numCreated++;
        let root = new Mesh("barrel_root_" + barrelId, scene);
        root.position.y = this.barrelHeight / 2;

        // create the whole number instance
        let solids = new Array<InstancedMesh>();
        for(let i = 0; i < this.wholeMeshes.length; i++) {
            let thisSolid = this.wholeMeshes[i].createInstance("barrel_whole_" + barrelId);
            solids.push(thisSolid);
        }

        // create set of fragments
        let fragments = new Array<InstancedMesh>();

        for(let i = 0; i < this.fragmentMeshes.length; i++){
            let thisFragment = this.fragmentMeshes[i].createInstance("barrel_fragment_" + barrelId);
            fragments.push(thisFragment);
        }

        // create explodable instance            
        let explodableInstance = new ExplodableMeshInstance(this.explosionTTL, root, solids, fragments);

        ParticleHelper.BaseAssetsUrl = "particles";
        return ParticleHelper.CreateAsync("explosion", scene).then((set)=> {
            let barrelInstance = new BarrelInstance(this.explosionTTL, root, explodableInstance, set);
            barrelInstance.scale = barrelInstance.scaling.multiplyByFloats(.6, .6, .6);
            return barrelInstance;
        });

    }
}                        
