import { Scene } from "@babylonjs/core/scene";
import { Mesh, InstancedMesh } from "@babylonjs/core/Meshes";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { ParticleHelper } from "@babylonjs/core/Particles";
import { Ratio } from "./Ratio";
import { ExplodableMeshInstance } from "./ExplodableMeshInstance";
import { RatioInstance } from "./RatioInstance";


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


    public createRatioInstanceAsync(scene : Scene, ratio : Ratio) : Promise<void | RatioInstance> {

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

        ParticleHelper.BaseAssetsUrl = "particles";
        return ParticleHelper.CreateAsync("explosion", scene).then((set)=> {
            return new RatioInstance(this.explosionTTL, root, numerator, denominator, bar, set);
        });

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
