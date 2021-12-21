import { Scene } from "@babylonjs/core/scene";
import { AbstractMesh } from "@babylonjs/core/Meshes";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { Scalar, AnimationGroup, Skeleton, TransformNode, TimerState } from "@babylonjs/core";
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

// TODO:  add in shadows:
/*
    var light2 = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -0.5, -1.0), scene);
    light2.position = new BABYLON.Vector3(0, 5, 5);

    // Shadows
    var shadowGenerator = new BABYLON.ShadowGenerator(1024, light2);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;
3
*/


// use movement of root node instead.

// TODO:  position with player4

export class ApeManager {
    private animationGroups : AnimationGroup[];
    private meshes : AbstractMesh[];
    private skeletons : Skeleton[];
    private transformNodes : TransformNode[];
    private isLoaded : boolean = false;    

    private root : AbstractMesh;

    private scene : Scene;

    private currentAnimation : number = ApeAnimations.IDLE;
    private nextAnimation: number = ApeAnimations.IDLE;
    private animationWeights : number[] = [];

    private observer;

    public get position() : Vector3 {
        return this.root.position;
    }

    public set position(pos : Vector3) {
        this.root.position.x = pos.x;
        this.root.position.y = pos.y;
        this.root.position.z = pos.z;
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
                
                // Initialize override animations, turn on idle by default

                for(let i = 0; i < this.animationGroups.length; i++) {
                    let weight = (i === this.currentAnimation) ? 1 : 0;

                    this.animationWeights.push(weight);
                    this.animationGroups[i].play(this.isLoopingAnimation(i));
                    this.animationGroups[i].setWeightForAllAnimatables(weight);
                    if (!this.isLoopingAnimation(i)) {
                        this.animationGroups[i].normalize(null,null);
                        this.animationGroups[i].onAnimationGroupEndObservable.add( () => {
                            this.playAnimationInternal(this.nextAnimation);
                            this.nextAnimation = ApeAnimations.IDLE; 
                        });
                    }            
                }

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
        // if the current animation is not loopable, queue up the successor.  It will
        // play once the current animation finishes.
        else if(!this.isLoopingAnimation(this.currentAnimation)) {
            this.nextAnimation = animationToStart;
        }
        else {
            this.playAnimationInternal(animationToStart);
        }

        return;
    }


    public playAnimationInternal(animationToStart: number) {

        this.animationGroups[animationToStart].reset()
        this.animationGroups[animationToStart].restart();
        this.animationGroups[animationToStart].play(this.isLoopingAnimation(animationToStart));

        // synchronize animations
        this.animationGroups[animationToStart].syncAllAnimationsWith(null);
        this.animationGroups[this.currentAnimation].syncAllAnimationsWith(this.animationGroups[animationToStart].animatables[0]);

        // restart observer with new animation set to current.
        this.scene.onBeforeAnimationsObservable.removeCallback(this.observer);
        this.currentAnimation = animationToStart;
        this.observer = this.scene.onBeforeAnimationsObservable.add( () => this.onBeforeAnimation());
    }

    // TODO:  if we are getting close to the end of our animation, then begin transitioning to 
    // the next animation.
//    this.animationGroups[i].animatables[0].masterFrame
//    this.animationGroups[animationToStart].from  // first frame
//    this.animationGroups[i].to  // last frame

    private onBeforeAnimation() {
        
        for(let i = 0; i < this.animationGroups.length; i++){
            let delta = (i === this.currentAnimation) ? .01 : -.01;
            this.animationWeights[i] = Scalar.Clamp(this.animationWeights[i] + delta, 0, 1);
            this.animationGroups[i].setWeightForAllAnimatables(this.animationWeights[i]);
        }

        
        // remove callback when the current animation weight reaches 1 or when all of the
        // override animations reach 0 when current is undefined.
        if (this.animationWeights[this.currentAnimation] === 1) {
       //     this.scene.onBeforeAnimationsObservable.removeCallback(this.observer);
        }
    }
}

