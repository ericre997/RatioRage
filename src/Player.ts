import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes";
import { NormalMaterial } from "@babylonjs/materials";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Environment } from "./Environment";

export class Player {

    public readonly playerSize : number;
    public readonly walkSpeed : number;
    public readonly minMoveDistance = .1;

    private playerMesh : Mesh;

    private constructor(playerSize: number, walkSpeed: number) {
        this.playerSize = playerSize;
        this.walkSpeed = walkSpeed;
    }

    public getPosition() : Vector3 {
        return this.playerMesh.position;
    }

    public static create(scene : Scene, playerSize: number, walkSpeed: number) {
        let player = new Player(playerSize, walkSpeed);

        player.playerMesh = Mesh.CreateBox("tmp_player", playerSize, scene)
        player.playerMesh.material = new NormalMaterial("tmp_player_material", scene);
        player.playerMesh.parent = null;

        return player;
    }

    public updatePlayerPosition(env : Environment, surfaceTargetPosition: Vector3, deltaTime: number, minDestHeight: number) {
        let targetPosition = surfaceTargetPosition.clone();
        targetPosition.y += this.playerSize / 2;

        let distanceFromTarget = Vector3.Distance(this.playerMesh.position, targetPosition);
        if(distanceFromTarget < this.minMoveDistance) {
            return;
        }

        let maxMoveDistance = this.walkSpeed * deltaTime;  
        let distanceToMove = Math.min(distanceFromTarget, maxMoveDistance);

        let direction = targetPosition.subtract(this.playerMesh.position).normalize();

        let proposedDelta = direction.multiplyByFloats(distanceToMove, distanceToMove, distanceToMove);
        let proposedPosition = this.playerMesh.position.add(proposedDelta);
        
   //     proposedPosition = this.getProposedPosition(env, proposedPosition.x, proposedPosition.z, minDestHeight);
        let heightAtProposed = env.groundMesh.getHeightAtCoordinates(proposedPosition.x, proposedPosition.z);
        if(heightAtProposed < minDestHeight) {
            return;
        }
        proposedPosition.y = heightAtProposed + this.playerSize /2;;

        // TODO:  hrmmm... do we really need this?  It's more accurate, but isn't really noticable.
        // adjust distance moved based on height of terrain at proposed location.
        let adjustedDirection = proposedPosition.subtract(this.playerMesh.position).normalize();
        let adjustedDelta = adjustedDirection.multiplyByFloats(distanceToMove, distanceToMove, distanceToMove);
        let adjustedFinalPosition = this.playerMesh.position.add(adjustedDelta);

        //let finalPosition = proposedPosition;
        let finalPosition = adjustedFinalPosition;
        this.placePlayerAt(env, finalPosition);
    }

    public placePlayerAt(env: Environment, position: Vector3){
        this.playerMesh.position = position;

        let surfaceNormal = env.groundMesh.getNormalAtCoordinates(position.x, position.z);
        let rotationAxis = Vector3.Cross(surfaceNormal, this.playerMesh.up).normalize();
        let angle = Math.acos(Vector3.Dot(surfaceNormal, this.playerMesh.up));
        this.playerMesh.rotate(rotationAxis, angle); 
    }
    
    /*  Hmm... this is pretty jerky.  Also, the player seems to sometimes be able to fall through the map.
        for now, just leave the 'can't move there' check in place and look into doing a better job with
        a more generic obstacle avoidance routine. */
    /*    
    public getPositionIfDestValid(env : Environment, x : number, z: number, minDestHeight: number) : Vector3 {
        let pos = new Vector3(x, 0, z);
        let heightAtProposed = env.groundMesh.getHeightAtCoordinates(x, z);
        if(heightAtProposed >= minDestHeight) {
            return new Vector3(x, heightAtProposed + this.playerSize /2, z);
        }
        return null;
    }

    public getProposedPosition(env : Environment, x : number, z: number, minDestHeight: number) : Vector3 {
        Vector3..RotationFromAxis()
        let pos = this.getPositionIfDestValid(env, x, z, minDestHeight);
        if(pos) { return pos; }

        pos = this.getPositionIfDestValid(env, -z, x, minDestHeight);
        if(pos) { return pos; }
        
        pos = this.getPositionIfDestValid(env, x, -z, minDestHeight);
        if(pos) { return pos; }

        return null;
    }
    */

    /*
    public movePlayerTo(env : Environment, posX : number, posZ : number)
    {
        let posY = env.groundMesh.getHeightAtCoordinates(posX, posZ);
        this.playerMesh.position = new Vector3(posX, posY + this.playerSize/2, posZ);

        let surfaceNormal = env.groundMesh.getNormalAtCoordinates(posX, posZ);
        let rotationAxis = Vector3.Cross(surfaceNormal, this.playerMesh.up).normalize();
        let angle = Math.acos(Vector3.Dot(surfaceNormal, this.playerMesh.up));
        this.playerMesh.rotate(rotationAxis, angle); 
    }
    */
}