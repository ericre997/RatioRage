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
// physics
import { PhysicsImpostor } from "@babylonjs/core/Physics";
import "@babylonjs/core/Physics/physicsEngineComponent";
import * as cannon from "cannon";
import { CannonJSPlugin } from "@babylonjs/core/Physics"
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";



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
env.setup(scene);

// decals
let targetDecalManager = new TargetDecalManager(scene);

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

// TODO:  github acct

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

/*

// drawing 'radio waves'
var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
var i = 0;
var intervalId = window.setInterval(drawit, 50);
function drawit()
{
    const maxRadius = 60;
    ctx.clearRect(0,0,c.width, c.height);
    ctx.lineWidth = 10;
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#000000";
    drawCircle(i%maxRadius,40,60);
    drawCircle((i+20)%maxRadius,40,60);
    drawCircle((i+40)%maxRadius,40,60);

    i++;
    if(i > 100) {
          window.clearInterval(intervalId);
    }
}

function drawCircle(radius, startFade, endFade) 
{
    let alpha = 1;
    if( radius > startFade) {
		let increment = 1/(endFade - startFade);
    	alpha = 1 - increment * (radius - startFade);
  	}

  	alpha = alpha >= 0 ? alpha : 0;
   	alpha = alpha <= 1 ? alpha : 1;
    
	ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#FF0000";

    ctx.beginPath();
    ctx.arc(100, 75, radius, 0, 2 * Math.PI);
    ctx.stroke();
}    


*/



engine.runRenderLoop(()=> {
    scene.render();
});




