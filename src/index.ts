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



var equivalentRatios;
var nonEquivalentRatios;

function generateRatios(){
    let seedRatio = Ratio.getSeedRatio();
    let factors = [2,3,4,5,6,7,8,9,10];
    
    equivalentRatios = Ratio.getEquivalentRatios(seedRatio, 3, factors);
    equivalentRatios.push(seedRatio);

    nonEquivalentRatios = Ratio.getNonEquivalentRatios(seedRatio, 5);
}

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
// doing this messes up UX layout.  Just manually specify scaling for UX elements.
//advancedTexture.rootContainer.scaleX = window.devicePixelRatio;
//advancedTexture.rootContainer.scaleY = window.devicePixelRatio;

let diagnostics = new Diagnostics(advancedTexture);
let gameOverlay = new GameOverlay(advancedTexture);

// create objects in envionment
/*
let numberFactory; 
let ratios = new Array<RatioInstance>();
*/
let ratioManager  = new RatioManager();

let barrelFactory;
let barrels = new Array<BarrelInstance>();

let env = new Environment();
let player : Player;

let elapsedTime = new ElapsedTime();
let score = 0;

function createBarrelInstancesAsync() : Promise<any> {
    let promises = new Array<Promise<any>>();

    let thisPromise = barrelFactory.createBarrelInstanceAsync(scene).then( (inst) => {
        inst.position.x = 0;
        inst.position.z = -36;
        inst.position.y = env.groundMesh.getHeightAtCoordinates(inst.position.x, inst.position.z);
        barrels.push(inst);
    })
    promises.push(thisPromise);

    return Promise.all(promises);
}

env.setup(scene, () => { 
    player = createPlayer(scene, env); 
    
    generateRatios();
    diagnostics.updateEquivalentRatios(equivalentRatios);
    diagnostics.updateNonEquivalentRatios(nonEquivalentRatios);
    
    elapsedTime.start();

    gameOverlay.updateTargetRatio(equivalentRatios[equivalentRatios.length-1]);

    BarrelFactory.create(scene).then((result) => {
        barrelFactory = result;
    }).then( () => {
        return createBarrelInstancesAsync();
    }).then( () => {
        return ratioManager.initialize(env, scene);
    }).then( () => {
        startRenderLoop();
    });
});

// decals
let targetDecalManager = new WaypointManager(scene);

const MIN_PLAYER_HEIGHT : number = .1;

function movePlayer() {
    // TODO:  easing
    // TODO:  allow for multiple waypoints (i.e. remove current waypoint if hit?)
    // TODO:  adjust speed based on terrain?
    // TODO:  go around obstacles.
    let waypoint = targetDecalManager.getNextWaypoint();
    if(waypoint) {
        player.updatePlayerPosition(env, waypoint.position, engine.getDeltaTime(), MIN_PLAYER_HEIGHT);
    }        
}

// set up click detection

function pointerUp() {}
function pointerMove() {}
function pointerDown(pickInfo : PickingInfo) {

    if(barrels[0]) {
        barrels[0].explode(scene);
        barrels[0] = null;
    }        

    if(pickInfo.pickedMesh === env.groundMesh) {

        sphere.position.x = pickInfo.pickedPoint.x;
        sphere.position.y = pickInfo.pickedPoint.y + 10;
        sphere.position.z = pickInfo.pickedPoint.z;
        sphere.physicsImpostor.setLinearVelocity(new Vector3(0,0,0));
        
        let color = env.colorMap.getColorAtPosition(pickInfo.pickedPoint);
        diagnostics.update(pickInfo.pickedPoint, color);

        targetDecalManager.buildDecal(env.groundMesh, pickInfo.pickedPoint, pickInfo.getNormal());

        score += 1;
    }
}

scene.onPointerObservable.add((pointerInfo) => {
    switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
            if(0 === pointerInfo.event.button 
                && pointerInfo.pickInfo.hit) {
                pointerDown(pointerInfo.pickInfo);
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


function startRenderLoop() {

    engine.runRenderLoop(()=> {

        movePlayer();


        let collided = ratioManager.checkForCollision(player.getPosition());
        if(collided) {
            collided.explode(scene);
        }

        ratioManager.spinRatios(engine.getDeltaTime());
        ratioManager.updateRatioFragments();

        gameOverlay.updateElapsedTime(elapsedTime);
        gameOverlay.updateScore(score);

        scene.render();
    });
}
