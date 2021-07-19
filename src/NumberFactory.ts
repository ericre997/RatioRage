import { Scene } from "@babylonjs/core/scene";
import { Mesh, InstancedMesh } from "@babylonjs/core/Meshes";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Ratio } from "./Ratio";
import { PhysicsImpostor } from "@babylonjs/core/Physics";
import { PhysicsHelper } from "@babylonjs/core/Physics";


export class RatioInstance {
    public isExploded : boolean;
    public fragmentTTL : number;    
    public root : Mesh;
    public numerator : Array<InstancedMesh>;
    public numeratorFragments : Array<Array<InstancedMesh>>; 
    public denominator: Array<InstancedMesh>;
    public denominatorFragments : Array<Array<InstancedMesh>>;
    public bar : InstancedMesh;
    public barFragments : Array<InstancedMesh>;

    public getPosition() : Vector3 {
        return this.root.position;
    }

    public cleanupFragments() {
        let now = Date.now();

        if (now > this.fragmentTTL ) {
            if(this.numeratorFragments) {
                this.visitArrays(this.numeratorFragments, (instance) => this.disposeMesh(instance));
                this.numeratorFragments = null;
            }
            if(this.denominatorFragments) {
                this.visitArrays(this.denominatorFragments, (instance) => this.disposeMesh(instance));
                this.denominatorFragments = null;
            }
            if(this.barFragments) {
                this.visitArray(this.barFragments, (instance) => this.disposeMesh(instance));
                this.barFragments = null;
            }
        }
    }

    public disposeMesh(instance : InstancedMesh) {
        instance.isVisible = false;
        instance.dispose();
    }

    public explode(physicsHelper : PhysicsHelper, scene : Scene) : void {

        this.isExploded = true;
        this.fragmentTTL =  Date.now() + 2000;


        // set fragment meshes visible
        // enable physics proxies
        this.visitArrays(this.numeratorFragments, (instance) => {
            //instance.parent = null;
            //instance.position = 
            //instance.isVisible = true;
            //instance.physicsImpostor = new PhysicsImpostor(instance, PhysicsImpostor.MeshImpostor, {mass: 100, friction:0.5, restitution:0}, scene);
        });
        /*
        this.visitArrays(this.denominatorFragments, (instance) => {
            instance.isVisible = true;
            instance.physicsImpostor = new PhysicsImpostor(instance, PhysicsImpostor.MeshImpostor, {mass: 100, friction:0.5, restitution:0}, scene);
        });
        */
        this.visitArray(this.barFragments, (instance) => {
            instance.parent = null;
            instance.position = this.bar.getAbsolutePosition().clone();
            let euler = this.root.rotationQuaternion.toEulerAngles();
            instance.rotationQuaternion = this.root.rotationQuaternion.clone();
            instance.isVisible = true;
    
            instance.physicsImpostor = new PhysicsImpostor(
                instance, 
                PhysicsImpostor.ParticleImpostor, 
                {mass: 10, friction:0.5, restitution:.5, disableBidirectionalTransformation:true}, 
                scene);
                
            instance.physicsImpostor.setLinearVelocity(instance.position.subtract(this.root.getAbsolutePosition())
                .multiplyByFloats(1 * Math.random(), 6 * Math.random(), 1 * Math.random()));                
        });

        // get rid of the whole meshes
        this.visitArray(this.numerator, (instance) => this.disposeMesh(instance));
        this.numerator = null;
        this.visitArray(this.denominator, (instance) => this.disposeMesh(instance));
        this.denominator = null;
        this.disposeMesh(this.bar);
        this.bar = null;

    }

    public visitArray(instances: Array<InstancedMesh>, callback: (instance : InstancedMesh) => any) : void {
        for(let i = 0; i < instances.length; i++) {
            callback(instances[i]);
        }
    }

    public visitArrays(instanceArrays : Array<Array<InstancedMesh>>, callback: (instance : InstancedMesh) => any) : void {
        for(let i = 0; i < instanceArrays.length; i++) {
            for(let j = 0; j < instanceArrays[i].length; j++) {
                callback(instanceArrays[i][j]);
            }
        }
    }        

}

export class NumberFactory {

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

        let ratioInstance = new RatioInstance();

        ratioInstance.isExploded = false;
        ratioInstance.root = new Mesh("dummy", scene);

        // create instances
        ratioInstance.numerator = this.createNumberInstances(ratio.numerator, ratioInstance.root, true);
        ratioInstance.numeratorFragments = this.createNumberFragmentInstances(ratio.numerator, ratioInstance.numerator, false);
        ratioInstance.denominator = this.createNumberInstances(ratio.denominator, ratioInstance.root, true);
        ratioInstance.denominatorFragments = this.createNumberFragmentInstances(ratio.denominator, ratioInstance.denominator, false);

        let numDigits = Math.max(ratioInstance.numerator.length, ratioInstance.denominator.length);
        ratioInstance.bar = this.createBarInstance(numDigits, ratioInstance.root, true);
        ratioInstance.barFragments = this.createBarFragmentInstances(numDigits, ratioInstance.bar, false);
        

        const widthPerChar = .9;
        
        // position instances:

        let start = -(ratioInstance.numerator.length - 1) * widthPerChar/2;
        for(let i = 0; i < ratioInstance.numerator.length; i++) {
            ratioInstance.numerator[i].position.x = start + i * widthPerChar;
            ratioInstance.numerator[i].position.y = 2;
        }

        ratioInstance.bar.position.x = 0;
        ratioInstance.bar.position.y = 1.5;

        start = -(ratioInstance.denominator.length - 1) * widthPerChar/2;
        for(let i = 0; i < ratioInstance.denominator.length; i++) {
            ratioInstance.denominator[i].position.x = start + i * widthPerChar;
            ratioInstance.denominator[i].position.y = 0;
        }


        return ratioInstance;
    }


    private createNumberInstances(num : number, root : Mesh, isVisible : boolean) : Array<InstancedMesh> {
        let meshInstances = Array<InstancedMesh>();
        do {
            let thisDigit = Math.trunc(num % 10);
            let thisInstance = this.numberMeshes[thisDigit].createInstance("NI_" + this.numCreated++);
            thisInstance.parent = root;
            thisInstance.isVisible = isVisible;
            meshInstances.push(thisInstance);
            num = Math.trunc(num / 10);
        } while(num > 0)

        return meshInstances.reverse();
    }

    private createNumberFragmentInstances(num : number, rootInstances: InstancedMesh[], isVisible: boolean) : Array<Array<InstancedMesh>> {
        let meshInstances = Array<Array<InstancedMesh>>();
        do {
            let thisDigit = Math.trunc(num % 10);
            let thisMeshSet = this.numberFragmentMeshes[thisDigit];
            let thisInstanceSet = new Array<InstancedMesh>();

            for(let i = 0; i < thisMeshSet.length; i++){
                let thisInstance = thisMeshSet[i].createInstance("NFI_" + this.numCreated++);
                thisInstance.parent = rootInstances[i];
                thisInstance.isVisible = isVisible;
                thisInstanceSet.push(thisInstance);
            }
            meshInstances.push(thisInstanceSet);

            num = Math.trunc(num / 10);
        } while(num > 0)

        return meshInstances.reverse();
    }

    private createBarInstance(numDigits: number, root : Mesh, isVisible : boolean) : InstancedMesh {
        let idx = Math.min(numDigits, 3);
        let instance = this.barMeshes[idx].createInstance("BI_" + this.numCreated);
        instance.parent = root;
        instance.isVisible = isVisible;
        return instance;
    }

    private createBarFragmentInstances(numDigits: number, root: InstancedMesh, isVisible : boolean) : Array<InstancedMesh> {
        let meshInstances = Array<InstancedMesh>();
        let idx = Math.min(numDigits, 3);
        let meshSet = this.barFragmentMeshes[idx];
        for(let i = 0; i < meshSet.length; i++){
            let instance = meshSet[i].createInstance("BFI_" + this.numCreated++);
            instance.parent = root;
            instance.isVisible = isVisible;
            meshInstances.push(instance);
        }
        return meshInstances;
    }
}                        
