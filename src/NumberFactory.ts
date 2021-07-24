import { Scene } from "@babylonjs/core/scene";
import { Node } from "@babylonjs/core/node";
import { Mesh, InstancedMesh, TransformNode } from "@babylonjs/core/Meshes";
import { AbstractMesh } from "@babylonjs/core/Meshes";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { Vector3, Quaternion, Axis } from "@babylonjs/core/Maths/math";
import { Ratio } from "./Ratio";
import { PhysicsImpostor } from "@babylonjs/core/Physics";
import { ParticleHelper, ParticleSystem, ParticleSystemSet, SubEmitter } from "@babylonjs/core/Particles";
//import "@babylonjs/core/Particles/ParticleSystemSupport";
//import "@babylonjs/core/Particles/webgl2ParticleSystem";
//import "@babylonjs/core/Particles/computeShaderParticleSystem";

export class ExplodableMeshInstance {
    private explosionTTL;
    private explodeTime : number
    private solidMesh : InstancedMesh;
    private fragments : Array<InstancedMesh>;

    public constructor(explosionTTL : number, parent : Node, solidMesh : InstancedMesh, fragments: Array<InstancedMesh>) {
        this.explosionTTL = explosionTTL;
        this.explodeTime = null;
        this.solidMesh = solidMesh;
        this.fragments = fragments;

        this.solidMesh.isVisible = true;
        this.solidMesh.parent = parent;
        for(let i = 0; i < this.fragments.length; i++) {
            this.fragments[i].isVisible = false;
            this.fragments[i].parent = this.solidMesh;
        }
    }

    public get position() : Vector3 {
        return this.solidMesh.position;
    }

    public set position(pos : Vector3) {
        this.solidMesh.position.x = pos.x;
        this.solidMesh.position.y = pos.y;
        this.solidMesh.position.z = pos.z;
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
        
        for(let i = 0; i < this.fragments.length; i++) {
            let instance = this.fragments[i];
            instance.parent = null;
 
            let scale = new Vector3();
            let rotation = new Quaternion();
            let position = new Vector3();
            this.solidMesh.getWorldMatrix().decompose(scale, rotation, position);
 
            instance.position = position;
            instance.rotationQuaternion = rotation;
            instance.isVisible = true;

            instance.physicsImpostor = new PhysicsImpostor(
                instance, 
                PhysicsImpostor.ParticleImpostor, 
                {mass: 10, friction:0.5, restitution:.5, disableBidirectionalTransformation:true}, 
                scene);
            
            let direction = new Vector3( Math.random() - .5, .5, Math.random() - .5).normalize();
            let linearVelocity = direction.multiplyByFloats(2 + 4 * Math.random(), 8 + 12* Math.random(), 2 + 4 * Math.random());
            instance.physicsImpostor.setLinearVelocity(linearVelocity);
            const ROT = 4;
            let angularVelocity = new Vector3( ROT * (Math.random() - .5), ROT * (Math.random() - .5), ROT * (Math.random() - .5) )        
            instance.physicsImpostor.setAngularVelocity(angularVelocity);
        }

        this.explodeTime = Date.now();
        this.solidMesh.isVisible = false;
    }        

    public dispose() {
        this.solidMesh.isVisible = false;
        this.solidMesh.dispose();
        this.solidMesh = null;
        for(let i = 0; i < this.fragments.length; i++) {
            let fragment = this.fragments[i];
            fragment.isVisible = false;
            fragment.dispose();
        }
        this.fragments = null;
    }
}


export class RatioInstance {
    private explosionTTL : number;
    private explodeTime: number;

    private root : Mesh;
    private numerator : Array<ExplodableMeshInstance>;
    private denominator : Array<ExplodableMeshInstance>;
    private bar : ExplodableMeshInstance;

    
    constructor(explosionTTL: number, 
                root: Mesh, 
                numerator: Array<ExplodableMeshInstance>, 
                denominator: Array<ExplodableMeshInstance>, 
                bar: ExplodableMeshInstance) {
        
        this.explosionTTL = explosionTTL;
        this.explodeTime = null;
        this.root = root;
        this.numerator = numerator;
        this.denominator = denominator;
        this.bar = bar;
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

        // TODO:  preload the explosion particle system.
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

export class NumberFactory {
    public readonly explosionTTL : number = 3000;

    public numCreated : number = 0;
    public numberMeshes : Array<Mesh>;
    public numberFragmentMeshes : Array<Array<Mesh>>;
    public barMeshes : Array<Mesh>;
    public barFragmentMeshes : Array<Array<Mesh>>;

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


    public createRatioInstance(scene : Scene, ratio : Ratio) : RatioInstance {

        let root = new Mesh("R_" + this.numCreated++, scene);

        // create instances
        let numerator = this.createExplodableNumberInstances(ratio.numerator, root);
        let denominator = this.createExplodableNumberInstances(ratio.numerator, root);
        let numDigits = Math.max(numerator.length, denominator.length);
        let bar = this.createExplodableBarInstance(numDigits, root);

        // TODO:  move positioning stuff into RatioInstance constructor.
        const widthPerChar = .9;
        
        // position instances:

        let start = -(numerator.length - 1) * widthPerChar/2;
        for(let i = 0; i < numerator.length; i++) {
            numerator[i].position.x = start + i * widthPerChar;
            numerator[i].position.y = 2;
        }

        bar.position.x = 0;
        bar.position.y = 1.5;

        start = -(denominator.length - 1) * widthPerChar/2;
        for(let i = 0; i < denominator.length; i++) {
            denominator[i].position.x = start + i * widthPerChar;
            denominator[i].position.y = 0;
        }

        let ratioInstance = new RatioInstance(this.explosionTTL, root, numerator, denominator, bar);

        return ratioInstance;
    }

    private createExplodableNumberInstances(num : number, root : Mesh) : Array<ExplodableMeshInstance> {
        let instances = Array<ExplodableMeshInstance>();

        do {
            let thisDigit = Math.trunc(num % 10);

            // create the whole number instance
            let solid = this.numberMeshes[thisDigit].createInstance("NI_" + this.numCreated++);

            // create set of fragments
            let fragmentMeshes = this.numberFragmentMeshes[thisDigit];
            let fragments = new Array<InstancedMesh>();

            for(let i = 0; i < fragmentMeshes.length; i++){
                let thisFragment = fragmentMeshes[i].createInstance("NFI_" + this.numCreated++);
                fragments.push(thisFragment);
            }

            // create explodable instance            
            let thisInstance = new ExplodableMeshInstance(this.explosionTTL, root, solid, fragments);

            // push
            instances.push(thisInstance);

            // next digit
            num = Math.trunc(num / 10);
        } while(num > 0)

        // digits were pushed smallest to biggest, so reverse to make ordering more intuitive
        return instances.reverse();
    }

    private createExplodableBarInstance(numDigits: number, root : Mesh) : ExplodableMeshInstance {

        // note:  we have four sizes of bars at indices 0-3
        let idx = Math.min(numDigits, 3);

        // solid
        let solid = this.barMeshes[idx].createInstance("BI_" + this.numCreated);

        // fragments
        let fragmentMeshes = this.barFragmentMeshes[idx];
        let fragments = new Array<InstancedMesh>();

        for(let i = 0; i < fragmentMeshes.length; i++){
            let thisFragment = fragmentMeshes[i].createInstance("BFI_" + this.numCreated++);
            fragments.push(thisFragment);
        }

        // explodable instance
        let thisInstance = new ExplodableMeshInstance(this.explosionTTL, root, solid, fragments);

        return thisInstance;
    }

}                        
