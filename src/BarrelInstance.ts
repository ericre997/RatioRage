import { Scene } from "@babylonjs/core/scene";
import { Mesh, } from "@babylonjs/core/Meshes";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { ParticleSystemSet } from "@babylonjs/core/Particles";
import { ExplodableMeshInstance } from "./ExplodableMeshInstance";


export class BarrelInstance {
    private explosionTTL : number;
    private explodeTime: number;

    public root : Mesh;
    private explodableInstance : ExplodableMeshInstance;
    private particleSystemSet : ParticleSystemSet;

    public isPickUpable = true;

    constructor(explosionTTL: number, 
                root: Mesh, 
                explodableInstance: ExplodableMeshInstance, 
                particleSystemSet : ParticleSystemSet) {
        
        this.explosionTTL = explosionTTL;
        this.explodeTime = null;
        this.root = root;
        this.explodableInstance = explodableInstance;
        this.particleSystemSet = particleSystemSet;
    }

    public get position() : Vector3 {
        return this.root.position;
    }

    public set position(pos : Vector3) {
        this.root.position.x = pos.x;
        this.root.position.y = pos.y;
        this.root.position.z = pos.z;
    }

    public set parent(mesh : Mesh) {
        this.root.parent = mesh;
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

    public get isExploded() : boolean { 
        return this.explodeTime !== null;
    }

    public shouldDispose() : boolean {
        return (this.isExploded && Date.now() > this.explodeTime + this.explosionTTL);
    }

    public explode(scene : Scene) : void {
        if(this.isExploded) {
            throw "Object is already exploded";
        }

        this.explodableInstance.explode(scene);

        let pos = this.root.position.clone();
        this.particleSystemSet.systems.forEach( s=> {
            s.disposeOnStop = true;
            s.emitter = pos;
            s.maxEmitPower = s.maxEmitPower * .1;

        });
        this.particleSystemSet.start();
    
        this.explodeTime = Date.now();        
    }

    public dispose() : void {
        this.root.dispose();
        this.root = null;
        this.explodableInstance.dispose();
        this.explodableInstance = null;
    }
}
