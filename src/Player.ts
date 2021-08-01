import { Scene } from "@babylonjs/core/scene";
import { Mesh, LinesMesh } from "@babylonjs/core/Meshes";
import { NormalMaterial } from "@babylonjs/materials";
import { Vector3, Axis, Space, Color3, Quaternion } from "@babylonjs/core/Maths/math";
import { Environment } from "./Environment";
import { Constants } from "./Constants";
import { BarrelInstance } from "./BarrelInstance";
import { PhysicsImpostor } from "@babylonjs/core/Physics";


export class Player {

    public readonly playerSize : number;
    public readonly walkSpeed : number;
    public readonly minMoveDistance = .1;

    private barrel : BarrelInstance;

    private playerMesh : Mesh;
    private forwardMesh : LinesMesh;
    private upMesh : LinesMesh;
    private rightMesh : LinesMesh;

    private constructor(playerSize: number, walkSpeed: number) {
        this.playerSize = playerSize;
        this.walkSpeed = walkSpeed;
    }

    public getPosition() : Vector3 {
        return this.playerMesh.position;
    }

    public hasBarrel() : boolean { 
        return this.barrel ? true : false;
    }

    public static create(scene : Scene, playerSize: number, walkSpeed: number) {
        let player = new Player(playerSize, walkSpeed);

        player.playerMesh = Mesh.CreateBox("tmp_player", playerSize, scene)
        player.playerMesh.material = new NormalMaterial("tmp_player_material", scene);
        player.playerMesh.parent = null;

        player.createAxisLines(scene);
        player.updateAxisLines();

        return player;
    }

    public pickUpBarrel(barrelInstance: BarrelInstance) {
        if(barrelInstance.isPickUpable 
           && Vector3.DistanceSquared(barrelInstance.position, this.getPosition()) <= Constants.MIN_D2_PLAYER_BARREL_PICKUP) {
            this.barrel = barrelInstance;
            barrelInstance.parent = this.playerMesh;
            barrelInstance.rotate(Axis.X, -45 * Constants.RADIANS_PER_DEGREE);
            barrelInstance.position = new Vector3(this.playerSize/2, this.playerSize/2, 0);
        }
    }

    public throwBarrel(targetPoint: Vector3, scene : Scene) {
        // de-parent barrel from player
        let barrel = this.barrel;
      //  this.barrel = null;

        // calculate initial velocity and direction needed to hit target 
        // get world position of barrel
        let scale = new Vector3();
        let rotation = new Quaternion();
        let position = new Vector3();
        barrel.root.getWorldMatrix().decompose(scale, rotation, position);

        let dist = targetPoint.subtract(position);
        let acc = -9.8;
        let du = Math.sqrt(dist.x * dist.x + dist.z * dist.z);
        let dv = dist.y;
        let angle = 45 * Constants.RADIANS_PER_DEGREE;
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);

        let v = Math.sqrt( (1/(dv - (sin * du / cos))) * (acc*du*du) / (2*cos*cos) );

        // separate barrel and player
        barrel.isPickUpable = false;
        let b = barrel.root;
        b.parent = null;

        this.barrel = null;

        b.position = position;
        b.rotationQuaternion = rotation;
        b.scaling = scale;
        b.physicsImpostor = new PhysicsImpostor(b, PhysicsImpostor.ParticleImpostor, {mass: 2, friction:0, restitution:0}, scene);
        
        // TODO:  set the direction correctly!
        // give set initial velocity for barrel
        let linearVelocity = new Vector3(v * cos, v * sin, 0);
        b.physicsImpostor.setLinearVelocity(linearVelocity);

        // give random spin
        const ROT = 4;
        let angularVelocity = new Vector3( ROT * (Math.random() - .5), ROT * (Math.random() - .5), ROT * (Math.random() - .5) )        
        b.physicsImpostor.setAngularVelocity(angularVelocity);

        // TODO:  set pre-render routine to detect collisions/trigger explosion/update score.

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

        //this.updateAxisLines();
    }

    //https://math.stackexchange.com/questions/2510897/calculate-the-angle-between-two-vectors-when-direction-is-important
    public pointPlayerAt(targetPosition: Vector3) {
        let flatTargetPos = targetPosition.clone();
        flatTargetPos.y = 0;
        let flatPlayerPos = this.getPosition().clone();
        flatPlayerPos.y = 0;

        let directionToTarget = flatTargetPos.subtract(flatPlayerPos);
        directionToTarget.normalize();
        let facing = this.playerMesh.forward.clone();
        facing.y = 0;
        facing.normalize();

        // calculate directional angle
        let angle = Math.atan2(directionToTarget.x * facing.z - directionToTarget.z * facing.x,
                               directionToTarget.x * facing.x + directionToTarget.z * facing.z);
 
        this.playerMesh.rotate(Axis.Y, angle, Space.WORLD); 

        //this.updateAxisLines();
    }

    private createAxisLines(scene : Scene) {
        const LINE_LENGTH = 3;
        let points = new Array<Vector3>();
        points.push(this.playerMesh.position);
        points.push(this.playerMesh.position.add(this.playerMesh.forward.scale(LINE_LENGTH)));
        this.forwardMesh = Mesh.CreateLines("forward", points, scene, true);
        this.forwardMesh.color = new Color3(1, 0, 0);
        points[1] = this.playerMesh.position.add(this.playerMesh.up.scale(LINE_LENGTH));
        this.upMesh = Mesh.CreateLines("up", points, scene, true);
        this.upMesh.color = new Color3(0, 1, 0);
        points[1] = this.playerMesh.position.add(this.playerMesh.right.scale(LINE_LENGTH));
        this.rightMesh = Mesh.CreateLines("right", points, scene, true);
        this.rightMesh.color = new Color3(0, 0, 1);
    }

 
    private updateAxisLines() {
        const LINE_LENGTH = 3;

        // NOTE:  need to compute the world matrix for the mesh in order to recalculate 'forward' to include any
        // rotations that might have occurred during this render cycle.  If we don't do this, forward/up/right won't be updated
        // until the next frame.
        this.playerMesh.computeWorldMatrix(true);

        let points = new Array<Vector3>();
        points.push(this.playerMesh.position);
        points.push(this.playerMesh.position.add(this.playerMesh.forward.scale(LINE_LENGTH)));
        this.forwardMesh = Mesh.CreateLines(null, points, null, null, this.forwardMesh);
        points[1] = this.playerMesh.position.add(this.playerMesh.up.scale(LINE_LENGTH));
        this.upMesh = Mesh.CreateLines(null, points, null, null, this.upMesh);
        points[1] = this.playerMesh.position.add(this.playerMesh.right.scale(LINE_LENGTH));
        this.rightMesh = Mesh.CreateLines(null, points, null, null, this.rightMesh);
    }

    public placePlayerAt(env: Environment, position: Vector3){
        this.playerMesh.position = position;
        this.updateAxisLines();

        let surfaceNormal = env.groundMesh.getNormalAtCoordinates(position.x, position.z);
        // TODO:  hrmmm... there is some kind of bug here that will occasionally cause the rotation to go wacky.
        // just gonna comment it out for now since the final model won't need it anyway.  Would be good to understand
        // what's up though.  

    //    let rotationAxis = Vector3.Cross(surfaceNormal, this.playerMesh.up).normalize();
    //    let angle = Math.acos(Vector3.Dot(surfaceNormal, this.playerMesh.up));
    //    this.playerMesh.rotate(rotationAxis, angle); 

        this.updateAxisLines();
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