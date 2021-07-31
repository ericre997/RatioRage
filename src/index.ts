// import using es6 modules

import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/inspector";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { ArcRotateCamera } from "@babylonjs/core/Cameras";

import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Mesh } from "@babylonjs/core/Meshes";
import { NormalMaterial } from "@babylonjs/materials";
import "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/loaders";
import "@babylonjs/core/Loading/Plugins/babylonFileLoader";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
// for picking 
import { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import "@babylonjs/core/Culling/ray";
// GUI
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { setAndStartTimer, Tools } from "@babylonjs/core/Misc";

import { Diagnostics } from "./Diagnostics";
import { Environment } from "./Environment";
import { ImpactDecalManager } from "./ImpactDecalManager";
import { WaypointManager } from "./WaypointManager";
import { Player } from "./Player";
import { Ratio } from "./Ratio";
import { GameOverlay } from "./GameOverlay";
import { ElapsedTime } from "./ElapsedTime";

// physics
import { PhysicsHelper, PhysicsImpostor } from "@babylonjs/core/Physics";
import "@babylonjs/core/Physics/physicsEngineComponent";
import * as cannon from "cannon";
import { CannonJSPlugin } from "@babylonjs/core/Physics"
import { RatioManager } from "./RatioManager";
import { RatioFactory } from "./RatioFactory";
import { RatioInstance } from "./RatioInstance";

import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { BarrelFactory } from "./BarrelFactory";
import { BarrelInstance } from "./BarrelInstance";
import { Utils } from "./Utils";
import { BarrelManager } from "./BarrelManager";
import { Constants } from "./Constants"
import { AxesViewer } from "@babylonjs/core/debug";


/// begin code!

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas);
engine.setHardwareScalingLevel(1/window.devicePixelRatio);

let scene = new Scene(engine);
//scene.fogMode = Scene.FOGMODE_EXP2;
//scene.fogDensity = .01;
//scene.debugLayer.show();

let physicsPlugin = new CannonJSPlugin(true, 10, cannon);
let physicsHelper = new PhysicsHelper(scene);
scene.enablePhysics(new Vector3(0, -9.8, 0), physicsPlugin);
scene.collisionsEnabled = true;

let camera = new ArcRotateCamera("camera1", Tools.ToRadians(-120), Tools.ToRadians(80), 65, new Vector3(5,20,0), scene);
camera.attachControl(canvas, false);

let light = new HemisphericLight("light1", new Vector3(0,1,0),scene);
light.intensity = 1;

let cameras = [camera];
let pipeline = new DefaultRenderingPipeline("defaultPipeline", true, scene, cameras);
//pipeline.depthOfFieldEnabled = true;
//pipeline.depthOfFieldBlurLevel = DepthOfFieldEffectBlurLevel.Low;

pipeline.bloomEnabled = true;
pipeline.bloomThreshold = 0.8;
pipeline.bloomWeight = 0.3;
pipeline.bloomKernel = 64;
pipeline.bloomScale = 0.5;

// TODO REMOVE temp nonsense.
let sphere = Mesh.CreateSphere("sphere1", 16,  2, scene);
sphere.material = new NormalMaterial("normal", scene);
sphere.physicsImpostor = new PhysicsImpostor(sphere, PhysicsImpostor.SphereImpostor, {mass: 2, friction:0.5, restitution:0}, scene);
sphere.parent = null;

// set up HUD
let advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
let diagnostics = new Diagnostics(advancedTexture);
let gameOverlay = new GameOverlay(advancedTexture);

// create objects in envionment

let barrelManager = new BarrelManager();
let ratioManager  = new RatioManager();

let env = new Environment();
let player : Player;

let elapsedTime = new ElapsedTime();
let score = 0;


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
    player = createPlayer(scene, env); 
    
    elapsedTime.start();

    ratioManager.initialize(env, scene)
        .then( () => {
            let ratioPositions = getFlattenedRatioPositions();
            return barrelManager.initialize(env, ratioPositions, scene);
        })
        .then( () => {
            diagnostics.updateEquivalentRatios(ratioManager.equivalentRatios);
            diagnostics.updateNonEquivalentRatios(ratioManager.nonEquivalentRatios);
            gameOverlay.updateTargetRatio(ratioManager.targetRatio);
    
            startRenderLoop();
        });
});

function createPlayer(scene: Scene, env: Environment) {
    let playerSize = 1;
    let walkSpeed = 20 / 1000;  // units per millisecond

    let posX = 31;
    let posZ = -1.5;
    let posY = env.groundMesh.getHeightAtCoordinates(posX, posZ);
    let startPosition = new Vector3(posX, posY + playerSize / 2, posZ);

    player = Player.create(scene, playerSize, walkSpeed);
    player.placePlayerAt(env, startPosition);
    return player;
 }



// decals
let targetDecalManager = new WaypointManager(scene);

function movePlayer() {
    // TODO:  easing
    // TODO:  allow for multiple waypoints (i.e. remove current waypoint if hit?)
    // TODO:  adjust speed based on terrain?
    // TODO:  go around obstacles.
    let waypoint = targetDecalManager.getNextWaypoint();
    if(waypoint) {
        player.updatePlayerPosition(env, waypoint.position, engine.getDeltaTime(), Constants.MIN_D2_PLAYER_ELEVATION);
    }        
}

// set up click detection

function pointerUp() {}
function pointerMove() {}
function leftMouseButtonDown(pickInfo : PickingInfo) {

    if(pickInfo.pickedMesh === env.groundMesh) {

        sphere.position.x = pickInfo.pickedPoint.x;
        sphere.position.y = pickInfo.pickedPoint.y + 10;
        sphere.position.z = pickInfo.pickedPoint.z;
        sphere.physicsImpostor.setLinearVelocity(new Vector3(0,0,0));
        
        let color = env.colorMap.getColorAtPosition(pickInfo.pickedPoint);
        diagnostics.update(pickInfo.pickedPoint, color);

        targetDecalManager.buildDecal(env.groundMesh, pickInfo.pickedPoint, pickInfo.getNormal());

        player.pointPlayerAt(pickInfo.pickedPoint);

        score += 1;
    }
}

function rightMouseButtonDown(pickInfo : PickingInfo) {
    if(pickInfo.pickedMesh === env.groundMesh 
       || pickInfo.pickedMesh.name.startsWith(Constants.BARREL_WHOLE_PREFIX)
       || pickInfo.pickedMesh.name.startsWith(Constants.RATIO_WHOLE_PREFIX)) {
        alert("hello");
        // throw barrel at picked point
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

// TODO:  can we re-write the buildColorMap routine to return a promise? 
// TODO:  remove MeshBuilder?
// TODO:  trees look bad.  Tweak materials and lighting for better shading on trunk?

// TODO:  detect collisions with trees
// TODO:  camera following ball



function checkForBarrelPickup(){
    if( player.barrel ) {
        return;
    } else {
        let collided = barrelManager.checkForCollision(player.getPosition(), Constants.MIN_D2_PLAYER_BARREL_PICKUP);
        if(collided) {
            player.pickUpBarrel(collided);
        }
    }
}



function startRenderLoop() {

    engine.runRenderLoop(()=> {

        movePlayer();
        checkForBarrelPickup();

        let collided = ratioManager.checkForCollision(player.getPosition());
        if(collided) {
            collided.explode(scene);
        }

        ratioManager.spinRatios(engine.getDeltaTime());
        ratioManager.updateRatioFragments();

       // barrelManager.spinBarrels(engine.getDeltaTime());

        gameOverlay.updateElapsedTime(elapsedTime);
        gameOverlay.updateScore(score);

        scene.render();
    });
}
