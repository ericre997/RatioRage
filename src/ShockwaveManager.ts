import { Scene } from "@babylonjs/core";
import { Color3, StandardMaterial } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { RatioManager } from "./RatioManager";
import { RatioInstance } from "./RatioInstance";
import { BarrelManager } from "./BarrelManager";
import { BarrelInstance } from "./BarrelInstance";
import { Shockwave } from "./Shockwave";
import { Score } from "./Score";

export class ShockwaveManager {
    // shockwaves
    private scene : Scene;
    private shockwaves : Shockwave[];
    private ratioManager : RatioManager;
    private barrelManager : BarrelManager;
    private score : Score;

    private shockwaveMat : StandardMaterial;

    public constructor(scene : Scene, ratioManager : RatioManager, barrelManager : BarrelManager, score: Score) {
        this.shockwaveMat = new StandardMaterial("swmat", scene);
        this.shockwaveMat.diffuseColor = new Color3(1,1,1);
        
        this.scene = scene;
        this.shockwaves = new Array<Shockwave>();
        this.ratioManager = ratioManager;
        this.barrelManager = barrelManager;
        this.score = score;
    }

    public createShockwave(position : Vector3) {
        let pos = position.clone();
        pos.y += 1;
        let newShockwave = new Shockwave(pos, 10, 700, Date.now());
        // newShockwave.createDebugMesh(shockwaveMat, scene);
        this.shockwaves.push(newShockwave);
    }

    public updateShockwaves() {
        let now = Date.now();
        for(let i = this.shockwaves.length-1; i >= 0; i--) {
            let radius = this.shockwaves[i].getCurrentSize(now);
            if(radius < 0) {
                this.shockwaves.splice(i, 1);
            } else {
                let d2 = radius * radius;
                let ratios = this.ratioManager.checkForCollisions(this.shockwaves[i].position, d2);
                for(let i = 0; i < ratios.length; i++) {
                    this.explodeRatioInstance(ratios[i]);
                }
                let barrels = this.barrelManager.checkForCollisions(this.shockwaves[i].position, d2)
                for(let i = 0; i < barrels.length; i++) {
                    this.explodeBarrelInstance(barrels[i]);
                }
            }            
        }
    }
    
    public explodeRatioInstance(ratioInstance : RatioInstance) {
        ratioInstance.explode(this.scene);
        this.createShockwave(ratioInstance.position);
        
        if(ratioInstance.isEquivalent) {
            this.score.increment();
        }
    }
    
    public explodeBarrelInstance(barrelInstance : BarrelInstance) {
        barrelInstance.explode(this.scene);
        this.createShockwave(barrelInstance.position);
        this.barrelManager.queueBarrelForDisposal(barrelInstance);
    }
}
