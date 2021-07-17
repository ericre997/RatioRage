import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

export class NumberFactory {

    public numberMeshes;
    public numberFragmentMeshes;
    public barMeshes;
    public barFragmentMeshes;

    public static create(scene: Scene) : Promise<NumberFactory> {
        let numberFactory = new NumberFactory();
        return numberFactory.loadMeshes(scene).then( () => {return numberFactory;} );
    }

    private constructor() {
        this.numberMeshes = new Array<Mesh>(10);

        this.numberFragmentMeshes = new Array<Array<Mesh>>(10);
        for(let i = 0; i < 10; i++) {
            this.numberFragmentMeshes[i] = new Array<Mesh>();
        }

        this.barMeshes = new Array<Mesh>(4);

        this.barFragmentMeshes = new Array<Array<Mesh>>(4);
        for(let i = 0; i < 4; i++) {
            this.barFragmentMeshes[i] = new Array<Mesh>();
        }
    }

    private loadMeshes(scene: Scene) : Promise<any[]>
    {
        let promises = [];
    
        promises.push(SceneLoader.ImportMeshAsync("", "Blender\\Numbers\\","Numbers.glb", scene)
            .then((result) => {
                for(let i = 0; i < result.meshes.length; i++){
                    let tokens = result.meshes[i].name.split('_');
                    let thisMesh = <Mesh>result.meshes[i];
                    thisMesh.isVisible = false;
                    thisMesh.isPickable = false;
                    thisMesh.parent = null;

                    let idx = parseInt(tokens[1]);
                    if(tokens[0] === "Bar") {
                        idx -= 1;
                        if(tokens.length === 2) {
                            this.barMeshes[idx] = thisMesh;
                        } else {
                            this.barFragmentMeshes[idx].push(thisMesh);
                        }   
                    } else if (tokens[0] === "Num") {
                        if(tokens.length === 2) {
                            this.numberMeshes[idx] = thisMesh;
                        } else {
                            this.numberFragmentMeshes[idx].push(thisMesh);
                        }
                    }                        
                }
            }));
        return Promise.all(promises);
    }
}                        
