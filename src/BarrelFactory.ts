import { Scene } from "@babylonjs/core/scene";
import { Mesh, InstancedMesh } from "@babylonjs/core/Meshes";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { ParticleHelper } from "@babylonjs/core/Particles";
import { ExplodableMeshInstance } from "./ExplodableMeshInstance";
import { BarrelInstance } from "./BarrelInstance";
import { Constants } from "./Constants";

export class BarrelFactory {
    public readonly explosionTTL = 3000;
    public readonly barrelHeight = 3.1196;
    public readonly scaling = .6;

    public numCreated : number = 0;
    public wholeMeshes : Array<Mesh> = new Array<Mesh>();
    public fragmentMeshes : Array<Mesh> = new Array<Mesh>();

    public static create(scene: Scene) : Promise<BarrelFactory> {
        
        let barrelFactory = new BarrelFactory();
        return barrelFactory.loadMeshes(scene).then( () => {return barrelFactory;} );
    }

    private constructor() {
    }

    private loadMeshes(scene: Scene) : Promise<any> {

        return SceneLoader.ImportMeshAsync("", "Blender\\Barrel\\","BarrelWholeAndPieces.glb", scene)
            .then((result) => {
                for(let i = 0; i < result.meshes.length; i++){
                    let thisMesh = <Mesh>result.meshes[i];
                    thisMesh.isVisible = false;
                    thisMesh.isPickable = false;
                    thisMesh.parent = null;
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
        let barrelRoot = new Mesh(Constants.BARREL_ROOT_PREFIX + barrelId, scene);

        // create the whole barrel instances
        let solids = new Array<InstancedMesh>();
        for(let i = 0; i < this.wholeMeshes.length; i++) {
            let thisSolid = this.wholeMeshes[i].createInstance(Constants.BARREL_WHOLE_PREFIX + barrelId);
            solids.push(thisSolid);
        }

        // create set of fragments
        let fragments = new Array<InstancedMesh>();

        for(let i = 0; i < this.fragmentMeshes.length; i++){
            let thisFragment = this.fragmentMeshes[i].createInstance(Constants.BARREL_FRAGMENT_PREFIX + barrelId);
            fragments.push(thisFragment);
        }

        // create explodable instance
        let xmroot =  new Mesh(Constants.BARREL_EXP_ROOT_PREFIX + barrelId, scene);    
        xmroot.position.y -= this.barrelHeight/2;
        xmroot.parent = barrelRoot;        
        let explodableInstance = new ExplodableMeshInstance(this.explosionTTL, xmroot, solids, fragments);

        ParticleHelper.BaseAssetsUrl = "particles";
        return ParticleHelper.CreateAsync("explosion", scene).then((set)=> {
            let barrelInstance = new BarrelInstance(this.explosionTTL, barrelRoot, explodableInstance, set);
            barrelInstance.scale = barrelInstance.scaling.multiplyByFloats(this.scaling, this.scaling, this.scaling);
            barrelInstance.position.y += (this.barrelHeight * this.scaling)/2;
            return barrelInstance;
        });
    }
}                        
