import { Scene } from "@babylonjs/core/scene";
import { Node } from "@babylonjs/core/node";
import { Mesh, InstancedMesh, InstancedLinesMesh } from "@babylonjs/core/Meshes";
import { Vector3, Quaternion } from "@babylonjs/core/Maths/math";
import { PhysicsImpostor } from "@babylonjs/core/Physics";

export class ExplodableMeshInstance {
    private explosionTTL;
    private explodeTime : number
    private root : Mesh;
    private solids : Array<InstancedMesh>;
    private fragments : Array<InstancedMesh>;

    public constructor(explosionTTL : number, root : Mesh, solids : Array<InstancedMesh>, fragments: Array<InstancedMesh>) {
        this.explosionTTL = explosionTTL;
        this.explodeTime = null;
        this.root = root;
        this.solids = solids;
        this.fragments = fragments;

        this.solids.forEach(element => {
            element.isVisible = true;
            element.parent = root;
        });
        this.fragments.forEach(element => {
            element.isVisible = false;
            element.parent = root;
        });
    }

    public get position() : Vector3 {
        return this.root.position;
    }

    public set position(pos : Vector3) {
        this.root.position.x = pos.x;
        this.root.position.y = pos.y;
        this.root.position.z = pos.z;
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

        let scale = new Vector3();
        let rotation = new Quaternion();
        let position = new Vector3();
        this.root.getWorldMatrix().decompose(scale, rotation, position);

        for(let i = 0; i < this.fragments.length; i++) {
            let instance = this.fragments[i];
            instance.parent = null;
 
            instance.scaling = scale.clone();
            instance.position = position.clone();
            instance.rotationQuaternion = rotation.clone();
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

        this.solids.forEach(element => {
            element.isVisible = false;
        });

        this.explodeTime = Date.now();
    }        

    public dispose() {
        this.solids.forEach(element =>  {
            element.isVisible = false;
            element.dispose();
        });
        this.solids = null;

        this.fragments.forEach(element => {
            element.isVisible = false;
            element.dispose();
        });
        this.fragments = null;
    }
}
