import { Scene } from "@babylonjs/core/scene";
import { AbstractMesh } from "@babylonjs/core/Meshes";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { Scalar, AnimationGroup, Skeleton, TransformNode, Quaternion, TimerState } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths/math";

export class ApeAnimations {
    public static readonly BREATHING_IDLE : number = 0 ;
    public static readonly CHEERING : number = 1;
    public static readonly IDLE : number = 2;
    public static readonly JUMP_ATTACK : number = 3;
    public static readonly PUNCH : number = 4;
    public static readonly ROARING : number = 5;
    public static readonly RUNNING : number = 6;
    public static readonly SWIPING : number = 7;
    public static readonly WALKING : number = 8;
    public static readonly NUM_ANIMATIONS : number = 9;
}



// TODO:  instead of cloning rotation and postion properties, it might
// be easier to just share the same vector/quaternion between the player root and the ape mesh.
// consider adding 'bind()' method to do this.  

export class ApeManager {
    private animationGroups : AnimationGroup[];
    private meshes : AbstractMesh[];
    private skeletons : Skeleton[];
    private transformNodes : TransformNode[];
    private isLoaded : boolean = false;    

    private root : AbstractMesh;

    private scene : Scene;

    private defaultAnimation = ApeAnimations.IDLE;

    private currentAnimation : number = this.defaultAnimation;
    private nextAnimation: number = this.defaultAnimation;
    //private animationWeights : number[] = [];

    private observer;

    public get position() : Vector3 {
        return this.root.position;
    }

    public set position(pos : Vector3) {
        this.root.position.x = pos.x;
        this.root.position.y = pos.y;
        this.root.position.z = pos.z;
    }

    public set rotationQuaternion(rot : Quaternion) {
        if(rot) {
            this.root.rotationQuaternion = rot.clone();
        }            
    }

    public set rotation(rot : Vector3) {
        this.root.rotation = rot.clone();
    }

    public rotate(axis : Vector3, radians : number) {
        this.root.rotate(axis, radians)
    }

    public get scaling() : Vector3 {
        return this.root.scaling;
    }
    
    public set scale(scale : Vector3) {
        this.root.scaling.x = scale.x;
        this.root.scaling.y = scale.y;
        this.root.scaling.z = scale.z;
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

    private getAnimationPlaybackSpeed(animationId: number) : number {
        return 1;
    }

    private getAnimationStartFrame(animationId: number) : number {
        switch (animationId) {
            case ApeAnimations.PUNCH:
            case ApeAnimations.JUMP_ATTACK:
            case ApeAnimations.SWIPING:                
            {
                let animationGroup = this.animationGroups[animationId];
                return (animationGroup.to - animationGroup.from) * .4
            }
            default:
                return 0;
        }
    }

    public load(scene: Scene) : Promise<any> {
        this.scene = scene;

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
                }

                // start up default animation
                this.playAnimationInternal(this.defaultAnimation);

                // position and scale root.
                this.root.position.y = 20;
                this.root.scaling.x = 2;
                this.root.scaling.y = 2;
                this.root.scaling.z = 2;
            });
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
        this.animationGroups[animationToStart].reset();
        this.animationGroups[animationToStart].start(this.isLoopingAnimation(animationToStart), 
                                                     1, 
                                                     this.getAnimationStartFrame(animationToStart));
        //this.animationGroups[animationToStart].speedRatio = this.getAnimationPlaybackSpeed(animationToStart);
        //this.animationGroups[animationToStart].play(this.isLoopingAnimation(animationToStart));
       //this.animationGroups[animationToStart].goToFrame(this.getAnimationStartFrame(animationToStart));

        // synchronize animations
        //this.animationGroups[animationToStart].syncAllAnimationsWith(null);
        //this.animationGroups[this.currentAnimation].syncAllAnimationsWith(this.animationGroups[animationToStart].animatables[0]);

        this.animationGroups[this.currentAnimation].setWeightForAllAnimatables(0);
        this.animationGroups[animationToStart].setWeightForAllAnimatables(1);

        // restart observer with new animation set to current.
        //this.scene.onBeforeAnimationsObservable.removeCallback(this.observer);
        this.currentAnimation = animationToStart;
        //this.observer = this.scene.onBeforeAnimationsObservable.add( () => this.onBeforeAnimation());
    }

    // TODO:  if we are getting close to the end of our animation, then begin transitioning to 
    // the next animation.
//    this.animationGroups[i].animatables[0].masterFrame
//    this.animationGroups[animationToStart].from  // first frame
//    this.animationGroups[i].to  // last frame
/*
    private onBeforeAnimation() {
        
        for(let i = 0; i < this.animationGroups.length; i++){
            let delta = (i === this.currentAnimation) ? .01 : -.01;
            this.animationWeights[i] = Scalar.Clamp(this.animationWeights[i] + delta, 0, 1);
            this.animationGroups[i].setWeightForAllAnimatables(this.animationWeights[i]);
        }

        
        // remove callback when the current animation weight reaches 1 or when all of the
        // override animations reach 0 when current is undefined.
        if (this.animationWeights[this.currentAnimation] === 1) {
            this.scene.onBeforeAnimationsObservable.removeCallback(this.observer);
        }
    }
    */
}

