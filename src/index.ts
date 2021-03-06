// import using es6 modules

import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/inspector";
import { Vector3, Axis } from "@babylonjs/core/Maths/math";
import { ArcRotateCamera } from "@babylonjs/core/Cameras";
import { Animation } from "@babylonjs/core";

import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";

import "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/loaders";
import "@babylonjs/core/Loading/Plugins/babylonFileLoader";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";

// for picking 
import { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import "@babylonjs/core/Culling/ray";
// GUI
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { Tools } from "@babylonjs/core/Misc";

import { Diagnostics } from "./Diagnostics";
import { Environment } from "./Environment";
import { ImpactDecalManager } from "./ImpactDecalManager";
import { WaypointManager } from "./WaypointManager";
import { Player } from "./Player";
import { RatioInstance } from "./RatioInstance";
import { GameOverlay } from "./GameOverlay";
import { ElapsedTime } from "./ElapsedTime";

// physics
import { PhysicsHelper, PhysicsImpostor } from "@babylonjs/core/Physics";
import "@babylonjs/core/Physics/physicsEngineComponent";
import * as cannon from "cannon";
import { CannonJSPlugin } from "@babylonjs/core/Physics"
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { RatioManager } from "./RatioManager";
import { BarrelManager } from "./BarrelManager";
import { BarrelInstance } from "./BarrelInstance";
import { Constants } from "./Constants"
import { Shockwave } from "./Shockwave";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { ApeAnimations, ApeManager } from "./ApeManager";
import { KeyboardEventTypes } from "@babylonjs/core";
import { ShockwaveManager } from "./ShockwaveManager";
import { Score } from "./Score";

/// begin code!

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas);
engine.setHardwareScalingLevel(1/window.devicePixelRatio);

Animation.AllowMatricesInterpolation = true;

let scene = new Scene(engine);

let physicsPlugin = new CannonJSPlugin(true, 10, cannon);
let physicsHelper = new PhysicsHelper(scene);
scene.enablePhysics(new Vector3(0, -9.8, 0), physicsPlugin);
scene.collisionsEnabled = true;

let camera = new ArcRotateCamera("camera1", Tools.ToRadians(-120), Tools.ToRadians(80), 65, new Vector3(5,20,0), scene);
camera.attachControl(canvas, false);

let light = new HemisphericLight("light1", new Vector3(0,1,0),scene);
light.intensity = 1;

// TODO:  add in shadows:
/*
    var light2 = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -0.5, -1.0), scene);
    light2.position = new BABYLON.Vector3(0, 5, 5);

    // Shadows
    var shadowGenerator = new BABYLON.ShadowGenerator(1024, light2);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;
*/


let cameras = [camera];
let pipeline = new DefaultRenderingPipeline("defaultPipeline", true, scene, cameras);

pipeline.bloomEnabled = true;
pipeline.bloomThreshold = 0.8;
pipeline.bloomWeight = 0.3;
pipeline.bloomKernel = 64;
pipeline.bloomScale = 0.5;

// TODO REMOVE temp nonsense.
//let sphere = Mesh.CreateSphere("sphere1", 16,  2, scene);
//sphere.material = new NormalMaterial("normal", scene);
//sphere.physicsImpostor = new PhysicsImpostor(sphere, PhysicsImpostor.SphereImpostor, {mass: 2, friction:0.5, restitution:0}, scene);
//sphere.parent = null;


// set up HUD
let advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
//let diagnostics = new Diagnostics(advancedTexture);
let gameOverlay = new GameOverlay(advancedTexture);

// create objects in envionment
let score = new Score();
let barrelManager = new BarrelManager();
let ratioManager  = new RatioManager();
let shockwaveManager = new ShockwaveManager(scene, ratioManager, barrelManager, score);
let apeManager = new ApeManager();

let env = new Environment();
let player : Player;

// decals
let waypointManager = new WaypointManager(scene);

let elapsedTime = new ElapsedTime();

////////////////////////////////////////////////////////////////////
// create environment and game objects
////////////////////////////////////////////////////////////////////

function createPlayer(scene: Scene, env: Environment, apeManager : ApeManager) {

    let posX = 31;
    let posZ = -1.5;
    let posY = env.groundMesh.getHeightAtCoordinates(posX, posZ);
    let startPosition = new Vector3(posX, posY, posZ);

    player = Player.create(scene, apeManager, Constants.PLAYER_SPEED);
    player.placePlayerAt(env, startPosition);

    return player;
 }

function getFlattenedRatioPositions() : Vector3[] {
    let positions = new Array<Vector3>();
    for(let i = 0; i < ratioManager.ratioInstances.length; i++){
        let thisPosition = ratioManager.ratioInstances[i].position.clone();
        thisPosition.y = 0;
        positions.push(thisPosition);
    }
    return positions;
}


env.setup(scene, () => { 

    apeManager.load(scene)
        .then( () => {
            player = createPlayer(scene, env, apeManager);
        });

    elapsedTime.start();

    ratioManager.initialize(env, scene)
        .then( () => {
            let ratioPositions = getFlattenedRatioPositions();
            return barrelManager.initialize(env, ratioPositions, scene);
        })
        .then( () => {
            //diagnostics.updateEquivalentRatios(ratioManager.equivalentRatios);
            //diagnostics.updateNonEquivalentRatios(ratioManager.nonEquivalentRatios);
            gameOverlay.updateIslandName("Grunch Island!");
            gameOverlay.updateTargetRatio(ratioManager.targetRatio);
    
            startRenderLoop();
        });
});

// set up click detection

function pointerUp() {}
function pointerMove() {}
function leftMouseButtonDown(pickInfo : PickingInfo) {

    let position : Vector3;

    if(pickInfo.pickedMesh.name.startsWith(Constants.BARREL_WHOLE_PREFIX)
      || pickInfo.pickedMesh.name.startsWith(Constants.RATIO_WHOLE_PREFIX)) {
        position = pickInfo.pickedPoint.clone();
        position.y = env.groundMesh.getHeightAtCoordinates(position.x, position.z);
    } else if(pickInfo.pickedMesh === env.groundMesh) {
        position = pickInfo.pickedPoint.clone();
    }

    if(position) {
        let normal = env.groundMesh.getNormalAtCoordinates(position.x, position.z);
        let color = env.colorMap.getColorAtPosition(pickInfo.pickedPoint);

        //diagnostics.update(position, color);

        waypointManager.buildDecal(env.groundMesh, position, normal);

        player.pointPlayerAt(position);
    }
}

function rightMouseButtonDown(pickInfo : PickingInfo) {
    if(pickInfo.pickedMesh === env.groundMesh 
       || pickInfo.pickedMesh.name.startsWith(Constants.BARREL_WHOLE_PREFIX)
       || pickInfo.pickedMesh.name.startsWith(Constants.RATIO_WHOLE_PREFIX)) {
        
        if(player.hasBarrel()) {
            player.throwBarrel(pickInfo.pickedPoint, scene, (thrownBarrel: BarrelInstance) => {
                barrelManager.addThrownBarrel(thrownBarrel);
            });
        }
    }
}

scene.onPointerObservable.add((pointerInfo) => {
    switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
            if(Constants.LEFT_MOUSE_BUTTON === pointerInfo.event.button 
                && pointerInfo.pickInfo.hit) {
                leftMouseButtonDown(pointerInfo.pickInfo);
            } else if (Constants.RIGHT_MOUSE_BUTTON === pointerInfo.event.button
                && pointerInfo.pickInfo.hit) {
                rightMouseButtonDown(pointerInfo.pickInfo);
            }

        break;
        case PointerEventTypes.POINTERUP:
            pointerUp();
        break;
        case PointerEventTypes.POINTERMOVE:
            pointerMove();
        break;
    }
});


scene.onKeyboardObservable.add( (kbInfo) => {
    switch(kbInfo.type) {
        case KeyboardEventTypes.KEYDOWN:
            let animationIdx : number = kbInfo.event.key.charCodeAt(0) - "0".charCodeAt(0);
            if(animationIdx >= 0 && animationIdx < ApeAnimations.NUM_ANIMATIONS){
                apeManager.playAnimation(animationIdx);
            }
            /*
            else if( kbInfo.event.key === "q") {
                player.rotBarrel(Axis.X,15);
            }                
            else if( kbInfo.event.key === "w") {
                player.rotBarrel(Axis.Y,15);
            }                
            else if( kbInfo.event.key === "e") {
                player.rotBarrel(Axis.Z,15);
            }      
            else if( kbInfo.event.key === "a") {
                player.moveBarrel(Axis.X,10);
            }      
            else if( kbInfo.event.key === "s") {
                player.moveBarrel(Axis.Y,10);
            }      
            else if( kbInfo.event.key === "d") {
                player.moveBarrel(Axis.Z,10);
            } 
            */     
            break;

    }
});

/////////////////////////////////////////////////////////////////
// main game loop and support methods.
/////////////////////////////////////////////////////////////////


function movePlayer() {
    // TODO:  easing
    // TODO:  allow for multiple waypoints (i.e. remove current waypoint if hit?)
    // TODO:  adjust speed based on terrain?
    // TODO:  go around obstacles.
    let waypoint = waypointManager.getNextWaypoint();
    if(waypoint) {
        player.updatePlayerPosition(env, waypoint.position, engine.getDeltaTime(), Constants.MIN_D2_PLAYER_ELEVATION);
    }       
}

// TODO:  can we re-write the buildColorMap routine to return a promise? 
// TODO:  trees look bad.  Tweak materials and lighting for better shading on trunk?

function checkForBarrelPickup(){
    if( !player.hasBarrel() ) {
        let collided = barrelManager.checkForCollisions(player.getPosition(), Constants.MIN_D2_PLAYER_BARREL_PICKUP);
        if(collided && collided.length > 0 && collided[0].isPickUpable) {
            player.pickUpBarrel(collided[0]);
            barrelManager.releaseBarrel(collided[0]);
        }
    }
}

function updateThrownBarrels() {
    for(let i = 0; i < barrelManager.thrownBarrels.length; i++){
        let thisBarrel = barrelManager.thrownBarrels[i];

        if((thisBarrel.position.y < env.groundMesh.getHeightAtCoordinates(thisBarrel.position.x, thisBarrel.position.z) + Constants.MIN_D_BARREL_GROUND_EXPLODE)
           || barrelManager.checkForCollisions(thisBarrel.position, Constants.MIN_D2_BARREL_BARREL_EXPLODE).length > 0
           || ratioManager.checkForCollisions(thisBarrel.position, Constants.MIN_D2_BARREL_RATIO_EXPLODE).length > 0) {

               barrelManager.releaseThrownBarrel(thisBarrel);
               shockwaveManager.explodeBarrelInstance(thisBarrel);
           }
    }
}

function startRenderLoop() {

    engine.runRenderLoop(()=> {

        movePlayer();
        checkForBarrelPickup();
        updateThrownBarrels();
        shockwaveManager.updateShockwaves();

        let collided = ratioManager.checkForCollisions(player.getPosition(), Constants.MIN_D2_ANY_RATIO_COLLISION);
        if(collided && collided.length > 0) {
            shockwaveManager.explodeRatioInstance(collided[0]);
        }
        
        ratioManager.updateRatios(engine.getDeltaTime());
        barrelManager.disposeBarrels();

        gameOverlay.updateElapsedTime(elapsedTime);
        gameOverlay.updateScore(score.getScore());

        scene.render();
    });
}
