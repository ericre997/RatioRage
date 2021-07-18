// import using es6 modules

import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
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
import { PhysicsImpostor } from "@babylonjs/core/Physics";
import "@babylonjs/core/Physics/physicsEngineComponent";
import * as cannon from "cannon";
import { CannonJSPlugin } from "@babylonjs/core/Physics"
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { NumberFactory, RatioInstance } from "./NumberFactory";



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
let physicsPlugin = new CannonJSPlugin(true, 10, cannon);
scene.enablePhysics(new Vector3(0, -9.8, 0), physicsPlugin);
scene.collisionsEnabled = true;

let camera = new ArcRotateCamera("camera1", Tools.ToRadians(-120), Tools.ToRadians(80), 65, new Vector3(5,20,0), scene);
camera.attachControl(canvas, false);

let light = new HemisphericLight("light1", new Vector3(0,1,0),scene);
light.intensity = 1;


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
let numberFactory; 
let ratios = new Array<RatioInstance>();


let env = new Environment();
let player : Player;

let elapsedTime = new ElapsedTime();
let score = 0;

env.setup(scene, () => { 
    player = createPlayer(scene, env); 
    
    generateRatios();
    diagnostics.updateEquivalentRatios(equivalentRatios);
    diagnostics.updateNonEquivalentRatios(nonEquivalentRatios);
    
    elapsedTime.start();

    gameOverlay.updateTargetRatio(equivalentRatios[equivalentRatios.length-1]);

    NumberFactory.create(scene).then( (result) => {
        numberFactory = result;
  
        for(let i = 0; i < equivalentRatios.length; i++) {
            let inst = numberFactory.createRatioInstance(scene, equivalentRatios[i]);
            inst.root.position.x = -20 + ratios.length*3;
            inst.root.position.y = 0;
            inst.root.position.z = -32;

            ratios.push(inst);
        }

        for(let i = 0; i < nonEquivalentRatios.length; i++) {
            let inst = numberFactory.createRatioInstance(scene, nonEquivalentRatios[i]);
            inst.root.position.x = -20 + ratios.length*3;
            inst.root.position.y = 0;
            inst.root.position.z = -32;

            ratios.push(inst);
        }

/*
        for(let i = 0; i < 10; i++) {
            let inst = numberFactory.createRatioInstance(scene, new Ratio(i * 11,i * 11));
            inst.root.position.x = -20 + i*3;
            inst.root.position.y = 0;
            inst.root.position.z = -32;

            ratios.push(inst);
        }
*/        
    });
    startRenderLoop();
});


// decals
let targetDecalManager = new WaypointManager(scene);


function movePlayer() {
    // TODO:  easing
    // TODO:  allow for multiple waypoints (i.e. remove current waypoint if hit?)
    // TODO:  adjust speed based on terrain?
    let waypoint = targetDecalManager.getNextWaypoint();
    if(waypoint) {
        player.updatePlayerPosition(env, waypoint.position, engine.getDeltaTime());
    }        
}

// set up click detection

function pointerUp() {}
function pointerMove() {}
function pointerDown(pickInfo : PickingInfo) {

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

// note:  collision group & collision mask
// TODO:  move ball on ground

// TODO:  detect collisions with trees
// TODO:  camera following ball

// TODO:  load number textures
// TODO:  create and place ratios
// TODO:  spin ratios
// TODO:  explode ratios

// groundMesh.getHeightAtCoordinates(x,z)
// groundMesh.getNormalAtCoordinates(x,z);

function startRenderLoop() {

    engine.runRenderLoop(()=> {

        movePlayer();

        gameOverlay.updateElapsedTime(elapsedTime);
        gameOverlay.updateScore(score);

        let zAxis = new Vector3(0,1,0);
        const radians_per_minute = -30 * 100;
        let amount = radians_per_minute * engine.getDeltaTime() / (60 * 60 * 1000);
        for(let i = 0; i < ratios.length; i++) {
            ratios[i].root.rotate(zAxis, amount);
        }
        scene.render();
    });
}



