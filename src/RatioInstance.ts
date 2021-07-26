import { Scene } from "@babylonjs/core/scene";
import { Mesh, } from "@babylonjs/core/Meshes";
import { Vector3, Axis } from "@babylonjs/core/Maths/math";
import { ParticleSystemSet } from "@babylonjs/core/Particles";
import { ExplodableMeshInstance } from "./ExplodableMeshInstance";


export class RatioInstance {
    private explosionTTL : number;
    private explodeTime: number;

    private root : Mesh;
    private numerator : Array<ExplodableMeshInstance>;
    private denominator : Array<ExplodableMeshInstance>;
    private bar : ExplodableMeshInstance;
    private particleSystemSet : ParticleSystemSet;

    constructor(explosionTTL: number, 
                root: Mesh, 
                numerator: Array<ExplodableMeshInstance>, 
                denominator: Array<ExplodableMeshInstance>, 
                bar: ExplodableMeshInstance,
                particleSystemSet : ParticleSystemSet) {
        
        this.explosionTTL = explosionTTL;
        this.explodeTime = null;
        this.root = root;
        this.numerator = numerator;
        this.denominator = denominator;
        this.bar = bar;
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

    public rotate(radians : number) {
        this.root.rotate(Axis.Y, radians)
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

        this.visitArray(this.numerator, (instance) => { instance.explode(scene); });
        this.visitArray(this.denominator, (instance) => { instance.explode(scene); });
        this.bar.explode(scene);

        let pos = this.root.position.clone();
        this.particleSystemSet.systems.forEach( s=> {
            s.disposeOnStop = true;
            s.emitter = pos;
            s.maxEmitPower = s.maxEmitPower * .1;

        });
        this.particleSystemSet.start();
    
        // TODO:  preload the explosion particle system.
        /*
        ParticleHelper.BaseAssetsUrl = "particles";
        ParticleHelper.CreateAsync("explosion", scene).then((set)=> {
            let pos = this.root.position.clone();
            set.systems.forEach( s=> {
                s.disposeOnStop = true;
                s.emitter = pos;
                s.maxEmitPower = s.maxEmitPower * .1;

            });
            set.start();
        });
        */
        this.explodeTime = Date.now();        
    }

    public dispose() : void {
        this.root.dispose();
        this.root = null;
        this.visitArray(this.numerator, (instance) => { instance.dispose(); });
        this.numerator = null;
        this.visitArray(this.denominator, (instance) => { instance.dispose(); });
        this.denominator = null;
        this.bar.dispose();
        this.bar = null;
    }

    public visitArray(instances: Array<ExplodableMeshInstance>, callback: (instance : ExplodableMeshInstance) => any) : void {
        for(let i = 0; i < instances.length; i++) {
            callback(instances[i]);
        }
    }
}
