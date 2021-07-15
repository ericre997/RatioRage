import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

export class NumberFactory {

    public numberMeshes = new Array<Mesh>(10);

    constructor(scene : Scene) {
        //this.loadNumberMeshes(scene);
    }

    public loadNumberMeshes(scene: Scene) : Promise<any[]>
    {
        let promises = [];
    
        for(let i = 0; i < 10; i++)
        {
            let meshName = "Num_" + i.toString();
            let idx = i;
            /*
            let p1 = SceneLoader.ImportMeshAsync(meshName, "Blender\\Numbers\\","Numbers.glb", scene);
            let p2 = p1.then((result) => {
                this.numberMeshes[idx] = <Mesh>result.meshes[1];
                this.numberMeshes[idx].isVisible = false;
                this.numberMeshes[idx].isPickable = false;
                this.numberMeshes[idx].parent = null;
                }
            );
            promises.push(p2);
            */
            promises.push(SceneLoader.ImportMeshAsync(meshName, "Blender\\Numbers\\","Numbers2.glb", scene)
                .then((result) => {
                    this.numberMeshes[idx] = <Mesh>result.meshes[1];
                    this.numberMeshes[idx].isVisible = false;
                    this.numberMeshes[idx].isPickable = false;
                    this.numberMeshes[idx].parent = null;
                    }
                ));
            
        }                        
        return Promise.all(promises);
    }
}                        
