import { Scene } from "@babylonjs/core/scene";
import { Node } from "@babylonjs/core/node";
import { InstancedMesh } from "@babylonjs/core/Meshes";
import { Vector3, Quaternion } from "@babylonjs/core/Maths/math";
import { PhysicsImpostor } from "@babylonjs/core/Physics";

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
