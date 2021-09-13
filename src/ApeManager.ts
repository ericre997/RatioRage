import { Scene } from "@babylonjs/core/scene";
import { AbstractMesh } from "@babylonjs/core/Meshes";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { AnimationGroup, Skeleton, TransformNode } from "@babylonjs/core";


export class ApeManager {
    public animationGroups : AnimationGroup[];
    public meshes : AbstractMesh[];
    public skeletons : Skeleton[];
    public transformNodes : TransformNode[];
    public isLoaded : boolean = false;    

    public currentAnimationIndex = 0;

    public load(scene: Scene) : Promise<any> {
        return SceneLoader.ImportMeshAsync("", "Blender\\BigApe\\","BigApeExport.glb", scene )
            .then((result) => {
                this.animationGroups = result.animationGroups;
                this.meshes = result.meshes;
                this.skeletons = result.skeletons;
                this.transformNodes = result.transformNodes;
                this.isLoaded = true;
            });
    }            

    public playAnimation(animationToStart : number) {
        if(this.isLoaded && animationToStart < this.animationGroups.length) {
            this.animationGroups[this.currentAnimationIndex].stop();
            this.animationGroups[animationToStart].start(true);
            this.currentAnimationIndex = animationToStart;
        }            
    }
}

