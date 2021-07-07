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
import { Tools } from "@babylonjs/core/Misc";

import { Diagnostics } from "./Diagnostics";
import { Environment } from "./Environment";
import { ImpactDecalManager } from "./ImpactDecalManager";
import { TargetDecalManager } from "./TargetDecalManager";
import { Player } from "./Player";

// physics
import { PhysicsImpostor } from "@babylonjs/core/Physics";
import "@babylonjs/core/Physics/physicsEngineComponent";
import * as cannon from "cannon";
import { CannonJSPlugin } from "@babylonjs/core/Physics"
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";


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

/*
function movePlayerTo(env : Environment, posX : number, posZ : number) {
    let posY = env.groundMesh.getHeightAtCoordinates(posX, posZ);
    
    player.position = new Vector3(posX, posY + .5, posZ);
    let surfaceNormal = env.groundMesh.getNormalAtCoordinates(posX, posZ);
    let rotationAxis = Vector3.Cross(surfaceNormal, player.up).normalize();
    let angle = Math.acos(Vector3.Dot(surfaceNormal, player.up));
    player.rotate(rotationAxis, angle); 
}
*/

/// begin code!

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas);
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
let diagnostics = new Diagnostics(advancedTexture);

// create objects in envionment
let env = new Environment();
let player : Player;

env.setup(scene, () => { 
    player = createPlayer(scene, env); 
    startRenderLoop();
});


// decals
let targetDecalManager = new TargetDecalManager(scene);


function movePlayer() {
    // TODO:  easing
    // TODO: change to cube.

    let waypoint = targetDecalManager.getNextWaypoint();
    if(waypoint) {
        player.updatePlayerPosition(env, waypoint.position, engine.getDeltaTime());
    }        

    // if within d2 of next waypoint, remove waypoint
    // get next waypoint
    // if no next waypoint, return
    // compute move point
    // get height at move point
    // adjust xy distance based on delta Z
    // move player to new xyz
    // adjust player rotation to tangent at new xyz

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
        //player.position.y = env.groundMesh.getHeightAtCoordinates(player.position.x, player.position.z);

        scene.render();
    });
}



