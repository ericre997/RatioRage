import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";


export class Shockwave {
    public readonly position : Vector3;
    public readonly startRadius : number
    public readonly changeInValue : number;
    public readonly duration : number;
    public readonly startTime : number;

    public debugMesh : Mesh;

    constructor(position : Vector3, maxSize : number, duration : number, startTime : number ) {
        this.position = position;
        this.startRadius = 0;
        this.changeInValue = this.startRadius + maxSize;
        this.duration = duration;
        this.startTime = startTime;
    }


    // return -1 if past duration, else size.
    public getCurrentSize(currentTime : number) {
        let elapsedTime = currentTime - this.startTime;
        if(elapsedTime > this.duration) {
            return -1;
        }

        return this.easeOutQuad(elapsedTime, this.startRadius, this.changeInValue, this.duration);
    }

    public createDebugMesh(material : StandardMaterial, scene : Scene) {
        this.debugMesh = Mesh.CreateTorus("debug", this.startRadius + this.changeInValue, 1, 32, scene, true)
        this.debugMesh.material = material;
        this.debugMesh.scaling = new Vector3(0,0,0);
        this.debugMesh.position = this.position.clone();
    }

    public updateDebugMesh(currentSize : number) {
        let scale = currentSize / (this.startRadius + this.changeInValue);
        this.debugMesh.scaling.x = scale;
        this.debugMesh.scaling.y = scale;
        this.debugMesh.scaling.z = scale;
    }
    
    // easing functions from http://gizma.com/easing... many more are available
    private easeOutQuad(elapsedTime, startValue, changeInValue, duration) : number {
        elapsedTime /= duration;
        return -changeInValue * elapsedTime * (elapsedTime-2) + startValue;
    }

    // for reference
    private linear(elapsedTime, startValue, changeInValue, duration) : number {
        return changeInValue * elapsedTime / duration + startValue;
    }

}