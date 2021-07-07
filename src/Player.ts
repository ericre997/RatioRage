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

    public static create(scene : Scene, playerSize: number, walkSpeed: number) {
        let player = new Player(playerSize, walkSpeed);

        player.playerMesh = Mesh.CreateBox("tmp_player", playerSize, scene)
        player.playerMesh.material = new NormalMaterial("tmp_player_material", scene);
        player.playerMesh.parent = null;

        return player;
    }
    
    public updatePlayerPosition(env : Environment, surfaceTargetPosition: Vector3, deltaTime: number) {
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
  
        let heightAtProposed = env.groundMesh.getHeightAtCoordinates(proposedPosition.x, proposedPosition.z) + this.playerSize / 2;
        proposedPosition.y = heightAtProposed;

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