import { Scene } from "@babylonjs/core/scene";
import { Mesh, AbstractMesh, LinesMesh } from "@babylonjs/core/Meshes";
import { NormalMaterial } from "@babylonjs/materials";
import { Vector3, Axis, Space, Color3, Quaternion } from "@babylonjs/core/Maths/math";
import { Environment } from "./Environment";
import { Constants } from "./Constants";
import { BarrelInstance } from "./BarrelInstance";
import { PhysicsImpostor } from "@babylonjs/core/Physics";
import { ApeManager, ApeAnimations } from "./ApeManager";

export class Player {

    public readonly walkSpeed : number;
    public readonly minMoveDistance = .1;
    public readonly playerSize = 1;

    private barrel : BarrelInstance;

    private playerMesh : AbstractMesh;
    private apeManager : ApeManager;
    private forwardMesh : LinesMesh;
    private upMesh : LinesMesh;
    private rightMesh : LinesMesh;

    private constructor(apeManager: ApeManager, walkSpeed: number) {
        this.apeManager = apeManager;
        this.playerMesh = this.apeManager.root;
        this.walkSpeed = walkSpeed;
    }

    public getPosition() : Vector3 {
        return this.apeManager.root.position;
    }

    public hasBarrel() : boolean { 
        return this.barrel ? true : false;
    }

    public static create(scene : Scene, apeManager : ApeManager, walkSpeed: number) {
        let player = new Player(apeManager, walkSpeed);

        player.createAxisLines(scene);
        player.updateAxisLines();

        return player;
    }

    public pickUpBarrel(barrelInstance: BarrelInstance) {
        this.barrel = barrelInstance;

        let bone = this.apeManager.getRightHand();

        // for some reason, attaching to the hand bone shrinks it down like crazy.
        // increase scaling to compensate.
        barrelInstance.root.scaling = new Vector3(30,30,30);
        barrelInstance.position = bone.getAbsolutePosition();
        let node = barrelInstance.root.attachToBone(bone, this.playerMesh);
        barrelInstance.rotate(Axis.Z, 105 * Constants.RADIANS_PER_DEGREE);
        barrelInstance.position.y += 20;
        barrelInstance.position.z += 35;

        this.apeManager.playAnimation(ApeAnimations.PUNCH);
    }

    public throwBarrel(targetPoint: Vector3, scene : Scene) : BarrelInstance{

        // point player at target
        this.pointPlayerAt(targetPoint);

        // kick off the thrown animation
        this.apeManager.playAnimation(ApeAnimations.SWIPING);

        // get world position of barrel.  we will need to set after deparenting
        let scale = new Vector3();
        let rotation = new Quaternion();
        let position = new Vector3();
        this.barrel.root.getWorldMatrix().decompose(scale, rotation, position);

        let dist = targetPoint.subtract(position);
        let acc = -9.8;
        let du = Math.sqrt(dist.x * dist.x + dist.z * dist.z);
        let dv = dist.y;
        let angle = 45 * Constants.RADIANS_PER_DEGREE;
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);

        let v = Math.sqrt( (1/(dv - (sin * du / cos))) * (acc*du*du) / (2*cos*cos) );

        // set no-pickup flag so we don't grab
        // the barrel back as soon as we throw it!
        this.barrel.isPickUpable = false;
        this.barrel.isThrown = true;

        // separate barrel and player
        let thisBarrel = this.barrel;
        let barrelRoot = thisBarrel.root;

        barrelRoot.parent = null;
        this.barrel = null;

        // set transforms
        barrelRoot.position = position;
        barrelRoot.rotationQuaternion = rotation;
        barrelRoot.scaling = scale;

        // create impostoror
        barrelRoot.physicsImpostor = new PhysicsImpostor(barrelRoot, PhysicsImpostor.ParticleImpostor, {mass: 2, friction:0, restitution:0}, scene);
        
        // set the linear velocity
        let direction = dist.clone();
        direction.y = 0;
        direction = direction.normalize();
        let linearVelocity = new Vector3(v * cos * direction.x, v * sin, v * cos * direction.z);
        barrelRoot.physicsImpostor.setLinearVelocity(linearVelocity);

        // give random spin
        const ROT = 4;
        let angularVelocity = new Vector3( ROT * (Math.random() - .5), ROT * (Math.random() - .5), ROT * (Math.random() - .5) )        
        barrelRoot.physicsImpostor.setAngularVelocity(angularVelocity);

        // return the barrel so we can track it
        return thisBarrel;
    }

    public updatePlayerPosition(env : Environment, surfaceTargetPosition: Vector3, deltaTime: number, minDestHeight: number) {
        let ret = this.tryMovePlayer(env, surfaceTargetPosition,deltaTime,minDestHeight);
        if (ret) {
            this.apeManager.playAnimation(ApeAnimations.RUNNING);
        } else {
            this.apeManager.playAnimation(ApeAnimations.IDLE);
        }
    }        

    private tryMovePlayer(env : Environment, surfaceTargetPosition: Vector3, deltaTime: number, minDestHeight: number) : boolean{
        let targetPosition = surfaceTargetPosition.clone();

        let distanceFromTarget = Vector3.Distance(this.playerMesh.position, targetPosition);
        if(distanceFromTarget < this.minMoveDistance) {
            return false;
        }

        let maxMoveDistance = this.walkSpeed * deltaTime;  
        let distanceToMove = Math.min(distanceFromTarget, maxMoveDistance);

        let direction = targetPosition.subtract(this.playerMesh.position).normalize();

        let proposedDelta = direction.multiplyByFloats(distanceToMove, distanceToMove, distanceToMove);
        let proposedPosition = this.playerMesh.position.add(proposedDelta);
        
        let heightAtProposed = env.groundMesh.getHeightAtCoordinates(proposedPosition.x, proposedPosition.z);
        if(heightAtProposed < minDestHeight) {
            return false;
        }
        proposedPosition.y = heightAtProposed; 

        // TODO:  hrmmm... do we really need this?  It's more accurate, but isn't really noticable.
        // adjust distance moved based on height of terrain at proposed location.
        let adjustedDirection = proposedPosition.subtract(this.playerMesh.position).normalize();
        let adjustedDelta = adjustedDirection.multiplyByFloats(distanceToMove, distanceToMove, distanceToMove);
        let adjustedFinalPosition = this.playerMesh.position.add(adjustedDelta);

        //let finalPosition = proposedPosition;
        let finalPosition = adjustedFinalPosition;
        this.placePlayerAt(env, finalPosition);

        return true;
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