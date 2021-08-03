import { Scene } from "@babylonjs/core/scene";
import { Color3, Vector3, Axis } from "@babylonjs/core/Maths/math";
import { Environment } from "./Environment";
import { BarrelFactory } from "./BarrelFactory";
import { BarrelInstance } from "./BarrelInstance";
import { Constants } from "./Constants";
import { Utils } from "./Utils";


// barrel lifecycle:
// create and stash in BarrelManager.barrelInstance
// on pick up, remove from barrelInstances and add to player
// on throw, remove from player and add to thrownBarrels
// on explode
export class BarrelManager {
    private barrelInstances = new Array<BarrelInstance>();
    public thrownBarrels = new Array<BarrelInstance>();
    public explodedBarrels = new Array<BarrelInstance>();
    
    private barrelFactory : BarrelFactory;

    public initialize(env : Environment, ratioPositions : Vector3[], scene : Scene) : Promise<any> {
        let promise = BarrelFactory.create(scene)
            .then( (result) => {
                this.barrelFactory = result;
                return this.createBarrelInstancesAsync(env, ratioPositions, scene);
            });                

        return promise;
    }

    // TODO:  consolidate release code in cleanup pass
    public releaseBarrel(barrel : BarrelInstance) {
        for(let i = 0; i < this.barrelInstances.length; i++) {
            if(this.barrelInstances[i] === barrel) {
                this.barrelInstances.splice(i, 1);
                break;
            }
        }
    }

    public releaseThrownBarrel(barrel : BarrelInstance) {
        for(let i = 0; i < this.thrownBarrels.length; i++) {
            if(this.thrownBarrels[i] === barrel) {
                this.thrownBarrels.splice(i, 1);
                break;
            }
        }
    }

    public queueBarrelForDisposal(barrel : BarrelInstance) {
        this.explodedBarrels.push(barrel);
    }

    public disposeBarrels() {
        for(let i = this.explodedBarrels.length - 1; i >= 0; i--) {
            let thisInstance = this.explodedBarrels[i];
            if(thisInstance.shouldDispose()) {
                thisInstance.dispose();
                this.explodedBarrels.splice(i, 1);
            }
        }
    }

    public addThrownBarrel(barrel : BarrelInstance) {
        this.thrownBarrels.push(barrel);
    }

    public checkForCollisions(position : Vector3, d2 : number) : BarrelInstance[] {
        let ret = new Array<BarrelInstance>();
        for(let i = 0; i < this.barrelInstances.length; i++) {
            if(!this.barrelInstances[i].isExploded && Vector3.DistanceSquared(position, this.barrelInstances[i].position) <= d2) {
                ret.push(this.barrelInstances[i]);
            }
        }
        return ret;
    }
    
    private createBarrelInstancesAsync(env : Environment, ratioPositions : Vector3[], scene : Scene) : Promise<any> {
        let promises = new Array<Promise<any>>();
    
        let candidatePositions = this.getCandidatePositionsForBarrelPlacement(env, ratioPositions);
        candidatePositions = Utils.shuffle(candidatePositions);

        for(let i = 0; i < Constants.NUM_BARRELS; i++){
            let thisPromise = this.barrelFactory.createBarrelInstanceAsync(scene).then( (inst) => {
                let y = inst.position.y;
                inst.position = this.selectBarrelPosition(candidatePositions, Constants.MIN_D2_BARREL_BARREL_PLACEMENT)
                inst.position.y = y + env.groundMesh.getHeightAtCoordinates(inst.position.x, inst.position.z);
                this.barrelInstances.push(inst);
            })
            promises.push(thisPromise);
        }

        return Promise.all(promises);
    }
    

    private getCandidatePositionsForBarrelPlacement(env : Environment, ratioPositions : Vector3[]) : Vector3[]{

        // note:  these are returned with zeroed y 
        let candidatePositions = env.colorMap.getPositions((color: Color3) => { return true; })

        // create set of tree positions with zeroed y.
        let treeInstances = env.treeInstances;
        let treePositions = new Array<Vector3>();
        for(let i = 0; i < treeInstances.length; i++){
            let thisPosition = treeInstances[i].position.clone();
            thisPosition.y = 0;
            treePositions.push(thisPosition);
        }

        for(let i = candidatePositions.length - 1; i >= 0; i--) {
            if(env.groundMesh.getHeightAtCoordinates(candidatePositions[i].x, candidatePositions[i].z) < Constants.MIN_HEIGHT_FOR_BARREL_PLACEMENT) {
                candidatePositions.splice(i, 1);
            }
            else if (!this.isValidPlacement(candidatePositions[i], treePositions, Constants.MIN_D2_TREE_BARREL_PLACEMENT)) {
                candidatePositions.splice(i, 1);
            }
            else if (!this.isValidPlacement(candidatePositions[i], ratioPositions, Constants.MIN_D2_RATIO_BARREL_PLACEMENT)) {
                candidatePositions.splice(i, -1);
            }
        }
    
        return candidatePositions;
    }

    private isValidPlacement(pos : Vector3, obstacles : Vector3[], minD2 : number) : boolean{

        for(let i = 0; i < obstacles.length; i++) {
            if( Vector3.DistanceSquared(pos, obstacles[i]) <= minD2 ) {
                return false;
            }
        }
        return true;
    }     
    
    // This routine sets the position of the instance to a position from the specified candidate set.
    // It then removes any candidatePositions that are too close to the position chosen.

    private selectBarrelPosition(candidatePositions: Vector3[], minD2 : number) : Vector3 {
        // NOTE:  the pop will return null if we are out of candidate positions.
        // this will cause this method to subsequently crash
        let pos = candidatePositions.pop().clone();
        
        // remove any candidate positions too close to this one. Only consider X,Z when computing distance.
        for(let i = candidatePositions.length - 1; i >= 0; i--) {
            if(Vector3.DistanceSquared(candidatePositions[i], pos) < minD2) {
                candidatePositions.splice(i, 1);
            }
        }
        return pos;
    }

}