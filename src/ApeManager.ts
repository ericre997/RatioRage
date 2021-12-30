import { Scene } from "@babylonjs/core/scene";
import { AbstractMesh } from "@babylonjs/core/Meshes";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { Bone, AnimationGroup, Skeleton, TransformNode, Quaternion } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Constants } from "./Constants";

// NOTE: enum member names are the names of the Mixamo animations.
export class ApeAnimations {
    public static readonly BREATHING_IDLE : number = 0 ;
    public static readonly CHEERING : number = 1;
    public static readonly IDLE : number = 2;           // use for default idle
    public static readonly JUMP_ATTACK : number = 3;
    public static readonly PUNCH : number = 4;          // use for picking up barrel
    public static readonly ROARING : number = 5;
    public static readonly RUNNING : number = 6;        // use for movement
    public static readonly SWIPING : number = 7;        // use for throwing
    public static readonly WALKING : number = 8;
    public static readonly NUM_ANIMATIONS : number = 9;
}


export class ApeManager {
    private animationGroups : AnimationGroup[];
    private meshes : AbstractMesh[];
    private skeletons : Skeleton[];
    private transformNodes : TransformNode[];
    private isLoaded : boolean = false;    

    public root : AbstractMesh;

    private defaultAnimation = ApeAnimations.IDLE;

    private currentAnimation : number = this.defaultAnimation;
    private nextAnimation: number = this.defaultAnimation;
    
    public onThrowCpltCallback : () => void = null;
    public onThrowStartedCallback: () => void = null;

    public getRightHand() : Bone {
        let bones = this.skeletons[0].bones;
        for(let i = 0; i < bones.length; i++ ) {
            if(bones[i].id === "mixamorig:LeftHand"){
                return bones[i];
            }
        }
    }

    private isLoopingAnimation(animationId: number) : boolean {
        switch (animationId) {
            case ApeAnimations.BREATHING_IDLE:
            case ApeAnimations.IDLE:    
            case ApeAnimations.RUNNING:
            case ApeAnimations.WALKING:
                return true;
            default:
                return false;                                            
        }
    }

    private getAnimationStartFrame(animationId: number) : number {
        switch (animationId) {
            case ApeAnimations.PUNCH:
            case ApeAnimations.JUMP_ATTACK:
            case ApeAnimations.SWIPING:                
            {
                let animationGroup = this.animationGroups[animationId];
                return (animationGroup.to - animationGroup.from) * .4;
            }
            default:
                return this.animationGroups[animationId].from;
        }
    }

    private getAnimationEndFrame(animationId: number) : number {
        switch (animationId) {
            case ApeAnimations.PUNCH:
            case ApeAnimations.JUMP_ATTACK:
            case ApeAnimations.SWIPING:                
            {
                let animationGroup = this.animationGroups[animationId];
                return (animationGroup.to - animationGroup.from) * .7;
            }
            default:
                return this.animationGroups[animationId].to;
        }
    }


    public load(scene: Scene) : Promise<any> {
    
        return SceneLoader.ImportMeshAsync("", "Blender\\BigApe\\","BigApeExport2.glb", scene )
            .then((result) => {
                this.animationGroups = result.animationGroups;
                this.meshes = result.meshes;
                this.skeletons = result.skeletons;
                this.transformNodes = result.transformNodes;
                this.isLoaded = true;

                this.root = this.meshes[0];
                
                // Initialize animations, create onEnd callback for non-looping animations

                for(let i = 0; i < this.animationGroups.length; i++) {
                    if (!this.isLoopingAnimation(i)) {
                        this.animationGroups[i].onAnimationGroupEndObservable.add( () => {
                            this.playAnimationInternal(this.nextAnimation);
                            this.nextAnimation = this.defaultAnimation; 
                        });
                    }        
                    if(i == ApeAnimations.SWIPING) {
                        this.animationGroups[i].onAnimationGroupPlayObservable.add( () => {
                            this.onThrowStarted();
                        });

                        this.animationGroups[i].onAnimationGroupEndObservable.add( () => {
                            this.onThrowComplete();
                        });
                    }    
                }

                scene.onBeforeAnimationsObservable.add(() => this.onBeforeAnimation());

                // start up default animation
                this.playAnimationInternal(this.defaultAnimation);

                // scale root.
                this.root.scaling.x = Constants.APE_SCALING;
                this.root.scaling.y = Constants.APE_SCALING;
                this.root.scaling.z = Constants.APE_SCALING;
            });
    }            


    public playThrowAnimation( callback : () => void) {
        this.onThrowStartedCallback = callback;
        this.playAnimation(ApeAnimations.SWIPING);
    }

    public onThrowStarted() {
        //if(this.onThrowStartedCallback){
        //    this.onThrowStartedCallback();
        //    this.onThrowStartedCallback = null;
        //}
    }
    public onThrowComplete() {
        if(this.onThrowCpltCallback) {
            this.onThrowCpltCallback();
        }
    }

    public playAnimation(animationToStart: number){

        if(this.currentAnimation === animationToStart) {
            // ignore
        }
        else if(!this.isLoopingAnimation(this.currentAnimation)) {
            // if the current animation is not loopable, queue up the successor.  It will
            // play once the current animation finishes.
            this.nextAnimation = animationToStart;
        }
        else {
            this.playAnimationInternal(animationToStart);
        }

        return;
    }


    public playAnimationInternal(animationToStart: number) {

        this.animationGroups[this.currentAnimation].setWeightForAllAnimatables(0);
        this.currentAnimation = animationToStart;
        //this.animationGroups[animationToStart].reset();
        this.animationGroups[animationToStart].start(this.isLoopingAnimation(animationToStart), 
                                                     1, 
                                                     this.getAnimationStartFrame(animationToStart),
                                                     this.getAnimationEndFrame(animationToStart));

        this.animationGroups[this.currentAnimation].setWeightForAllAnimatables(0);
        this.animationGroups[animationToStart].setWeightForAllAnimatables(1);
    }

    private onBeforeAnimation() {
        if (this.currentAnimation == ApeAnimations.SWIPING &&
            this.onThrowStartedCallback) {
            // currently, we are running this one from .4 to .7
            let animationGroup = this.animationGroups[this.currentAnimation];
            let targetFrame = (animationGroup.to - animationGroup.from) * .4;  
            if (animationGroup.animatables[0].masterFrame >= targetFrame) {
                this.onThrowStartedCallback();
                this.onThrowStartedCallback = null;
            }                
        }
    }
}

