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



export class Ratio {
    public numerator: number;
    public denominator: number;
    
    constructor(numerator: number, denominator: number) {
        this.numerator = numerator;
        this.denominator = denominator;
    }
}

function getRandomInteger(minValueInclusive : number, maxValueExclusive : number) : number {
    return minValueInclusive + Math.trunc(Math.random() * (maxValueExclusive - minValueInclusive));
}

function getRandomValue(values : number[]) : number {
    let idxChosen = getRandomInteger(0, values.length);
    return values[idxChosen];
}

function removeValueFromArray(values: number[], exclude : number) : boolean {
    const idxExclude = values.indexOf(exclude, 0);
    if(idxExclude > -1) {
        values.splice(idxExclude, 1);
        return true;
    }
    return false;
}

function getSeedRatio() {
    let primes = [1,2,3,5,7];

    // get random ratio where numerator and denom are both primes
    let ratio = new Ratio(getRandomValue(primes), getRandomValue(primes));

    removeValueFromArray(primes, 1);

    // multiply one or the other by another prime (might be one)
    let numberToMux = getRandomInteger(0,3);
    switch(numberToMux) {
        case 0:
            // do nothing
            break;
        case 1: 
            removeValueFromArray(primes, ratio.denominator);
            ratio.numerator *= getRandomValue(primes);
            break;
        case 2: 
            removeValueFromArray(primes, ratio.numerator);
            ratio.denominator *= getRandomValue(primes);
            break;
        default:
            throw new Error("unexpected value during seedRatio mux");
    }

    return ratio;
}


function getEquivalentRatios(ratio : Ratio, numRatios : number, factors : number[]) : Ratio[] {
    let equivalentRatios = new Array<Ratio>();

    let unusedFactors = [];
    for(let i = 0; i < factors.length; i++) {
        unusedFactors.push(factors[i]);
    }

    numRatios = Math.min(numRatios, factors.length);

    for(let i = 0; i < numRatios; i++) {
        let idxFactor = getRandomInteger(0, unusedFactors.length);
        let equivalentRatio = new Ratio(ratio.numerator * unusedFactors[idxFactor], ratio.denominator * unusedFactors[idxFactor]);
        equivalentRatios.push(equivalentRatio);
        unusedFactors.splice(idxFactor,1);
    }

    return equivalentRatios;
}

function isRatioPresentInArray(ratio : Ratio, array : Ratio[]) : boolean {
    for(let i = 0; i < array.length; i++){
        if(array[i].numerator === ratio.numerator &&
           array[i].denominator === ratio.denominator) {
               return true;
           }
    }
    return false;
}

// TODO:  this number picking strategy is pretty crude.  Probably gonna need to fine tune it.
function getNonEquivalentRatios(ratio : Ratio, numRatios : number) : Ratio[] {
    let nonEquivalentRatios = new Array<Ratio>();
    const minInclusive = 1;
    const maxExclusive = 101;

    // TODO: this will spin forever in degerate cases  
    // consider adding additional checks to prevent this.
    while(nonEquivalentRatios.length < numRatios) {
        let num1 = getRandomInteger(minInclusive, maxExclusive);
        let num2 = getRandomInteger(minInclusive, maxExclusive);

        // maintain ordering of specified ratio
        if((ratio.numerator > ratio.denominator && num1 < num2) ||
        (ratio.numerator < ratio.denominator && num1 > num2)) {
            [num1, num2] = [num2, num1];
        }
    
        let proposed = new Ratio(num1, num2);

        // if they are equivalent, try again
        if(ratio.numerator * proposed.denominator === ratio.denominator * proposed.numerator) {
            continue;
        }       

        // check that we aren't already using this ratio
        if(isRatioPresentInArray(proposed, nonEquivalentRatios)) {
            continue;
        }

        nonEquivalentRatios.push(proposed);
    }        

    return nonEquivalentRatios;
}


// TODO:  break all of this nonsense out into it's own support class.
// TODO:  shuffle the arrays, use the first equivalent one as the 'target'.
// 
// TODO:  the seedRatio might need to be modified so that we don't wind up with things like 2/49.
// TODO:  the nonEquivalent picking strategy should probably be modified to use adaptive ranges that are similar
//        to the range represented by the equivalent fractions.

// TODO:  add HUD to display these values for debugging purposes.

var equivalentRatios;
var nonEquivalentRatios;

function generateRatios(){
    let seedRatio = getSeedRatio();
    let factors = [2,3,4,5,6,7,8,9,10];
    
    equivalentRatios = getEquivalentRatios(seedRatio, 3, factors);
    equivalentRatios.push(seedRatio);

    nonEquivalentRatios = getNonEquivalentRatios(seedRatio, 5);
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

// temp
generateRatios();

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



