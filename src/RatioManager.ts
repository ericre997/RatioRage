import { Scene } from "@babylonjs/core/scene";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { Constants } from "./Constants";
import { Environment } from "./Environment";
import { Ratio } from "./Ratio";
import { RatioFactory } from "./RatioFactory";
import { RatioInstance } from "./RatioInstance";
import { Utils } from "./Utils";


export class RatioManager {

    public equivalentRatios = new Array<Ratio>();
    public nonEquivalentRatios = new Array<Ratio>();
    
    private ratioFactory : RatioFactory; 
    public ratioInstances = new Array<RatioInstance>();
    public explodedRatioInstances = new Array<RatioInstance>();

    public get targetRatio() : Ratio {
        return this.equivalentRatios[this.equivalentRatios.length - 1];
    }

    public initialize(env : Environment, scene : Scene) : Promise<any> {
        let promise = RatioFactory.create(scene)
            .then( (result) => {
                this.ratioFactory = result;
                this.generateRatios();
                return this.createRatioInstancesAsync(env, scene);
            });                

        return promise;
    }
/*
    public spinRatios(deltaTime : number) : void {
        let amount = Constants.RATIO_SPIN_RADIANS_PER_MS * deltaTime;
        for(let i = 0; i < this.ratioInstances.length; i++) {
            let ratioInstance = this.ratioInstances[i];
            if(!ratioInstance.isExploded) {
                ratioInstance.rotate(amount);
            }
        }
    }
*/
    public checkForCollisions(position : Vector3, d2 : number): RatioInstance[] {
        let ret = new Array<RatioInstance>();
        for(let i = 0; i < this.ratioInstances.length; i++) {
            let ratioInstance = this.ratioInstances[i];
            if(!ratioInstance.isExploded && Vector3.DistanceSquared(position, ratioInstance.position) <= d2 ) {
                ret.push(ratioInstance);
            }
        }

        return ret;
    }
/*
    public updateRatioFragments() {
        for(let i = this.ratioInstances.length - 1; i >= 0; i--) {
            if(this.ratioInstances[i].shouldDispose()) {
                this.ratioInstances[i].dispose();
                this.ratioInstances.splice(i, 1);
            }
        }
    }
*/
    public updateRatios(deltaTime : number) : void {
        for(let i = this.ratioInstances.length - 1; i >= 0; i--) {
            let thisInstance = this.ratioInstances[i];
            if(thisInstance.isExploded) {
                this.ratioInstances.splice(i, 1);
                this.explodedRatioInstances.push(thisInstance);
            } else {
                thisInstance.rotate(Constants.RATIO_SPIN_RADIANS_PER_MS * deltaTime);
            }
        }

        for(let i = this.explodedRatioInstances.length - 1; i >= 0; i--) {
            let thisInstance = this.explodedRatioInstances[i];
            if(thisInstance.shouldDispose()) {
                thisInstance.dispose();
                this.explodedRatioInstances.splice(i, 1);
            }
        }
    }

    // TODO:  consolidate ratio generation code.  Consider moving a bunch of the 
    // constants into Constants.
    private generateRatios(){
        let seedRatio = Ratio.getSeedRatio();
        let factors = [2,3,4,5,6,7,8,9,10];
        
        let numRatios = Constants.NUM_EQUIVALENT_RATIOS - 1;
        this.equivalentRatios = Ratio.getEquivalentRatios(seedRatio, numRatios, factors);
        this.equivalentRatios.push(seedRatio);
    
        this.nonEquivalentRatios = Ratio.getNonEquivalentRatios(seedRatio, Constants.NUM_NONEQUIVALENT_RATIOS);
    }

    private createRatioInstancesAsync(env : Environment, scene : Scene) : Promise<any> {
        let promises = new Array<Promise<any>>();
        let candidatePositions = Utils.shuffle(this.getCandidatePositionsForRatioPlacement(env));

        this.equivalentRatios.forEach( (thisRatio) => {
            let thisPromise = this.ratioFactory.createRatioInstanceAsync(scene, thisRatio, true).then( (inst) => {
                this.placeRatio(inst, candidatePositions, env);
                this.ratioInstances.push(inst);
            });      
            promises.push(thisPromise);      
        });

        this.nonEquivalentRatios.forEach( (thisRatio) => {
            let thisPromise = this.ratioFactory.createRatioInstanceAsync(scene, thisRatio, false).then( (inst) => {
                this.placeRatio(inst, candidatePositions, env);
                this.ratioInstances.push(inst);
            });            
            promises.push(thisPromise);

        })

        return Promise.all(promises);
    }        

    // This routine sets sets the position of the ratioInstance from the specified candidate set.
    // It then removes any candidatePositions that are too close to the position chosen.

    private placeRatio(inst : RatioInstance, candidatePositions: Vector3[], env : Environment) : void {
        let minD2RatioRatio = Constants.MIN_D2_RATIO_RATIO_PLACEMENT;
        // NOTE:  the pop will return null if we are out of candidate positions.
        // this will cause this method to subsequently crash
        inst.position = candidatePositions.pop().clone();
        
        // remove any candidate positions too close to this one. Only consider X,Z when computing distance.
        for(let i = candidatePositions.length - 1; i >= 0; i--) {
            if( Vector3.DistanceSquared(candidatePositions[i], inst.position) < minD2RatioRatio) {
                candidatePositions.splice(i, 1);
            }
        }
        // set the Y coordinate of the instance position
        inst.position.y = env.groundMesh.getHeightAtCoordinates(inst.position.x, inst.position.z);
    }
   

    private getCandidatePositionsForRatioPlacement(env : Environment) {
        // get set of possible positions for placement
        let minHeight = Constants.MIN_HEIGHT_FOR_RATIO_PLACEMENT;
        let minD2TreeRatio = Constants.MIN_D2_TREE_RATIO_PLACEMENT;
    
        let candidatePositions = env.colorMap.getPositions((color: Color3) => { return true; })
        let treeInstances = env.treeInstances;
    
        for(let i = candidatePositions.length - 1; i >= 0; i--) {
            if(env.groundMesh.getHeightAtCoordinates(candidatePositions[i].x, candidatePositions[i].z) < minHeight ) {
                candidatePositions.splice(i, 1);
            }
            else {
                // NOTE:  Array#some will break once a callback returns true.
                treeInstances.some( (tree) => {
                    // consider only x,z coordinates for distance
                    let treePos = tree.position.clone();
                    treePos.z = 0;
                    if( Vector3.DistanceSquared(candidatePositions[i], treePos) < minD2TreeRatio ) {
                        candidatePositions.splice(i, 1);
                        return true;
                    } else {
                        return false;
                    }
                });
            }
        }
    
        return candidatePositions;
    }
}