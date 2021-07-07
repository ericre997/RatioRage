import { Scene } from "@babylonjs/core/scene";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { Mesh } from "@babylonjs/core/Meshes";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";

export class TargetDecalManager {
    private decalMaterial;
    private decalSize = new Vector3(10,10,10);
    private decals = new Array<Mesh>();
    private iteration = 0;
    private readonly maxTargets = 1;
    private intervalId;

    readonly targetSize = 120;
    readonly targetUpdatePeriod = 50;

    constructor(scene: Scene){
        this.decalMaterial = this.createTargetMaterial(scene);
    }

    public getNextWaypoint() : Mesh {
        return this.decals.length > 0 ? this.decals[0] : null;
    }

    public buildDecal(targetMesh : Mesh, pos: Vector3, norm: Vector3) {

        // build instance
        var decal = Mesh.CreateDecal("decal", targetMesh, pos, norm, this.decalSize, 90);
        decal.material = this.decalMaterial;
        decal.isPickable = false;
        
        this.decals.push(decal);
        if(this.decals.length > this.maxTargets){
            let removedMesh = this.decals.shift();
            removedMesh.dispose();
        }
    }

    private createTargetMaterial(scene: Scene) : StandardMaterial {
        let material = new StandardMaterial("targetMaterial", scene);
        material.diffuseColor = new Color3(1,0,0);
        material.opacityTexture = new DynamicTexture("taretOpacityTexture", {width:this.targetSize, height:this.targetSize}, scene, false);
        material.zOffset = -2;

        this.intervalId = window.setInterval(() => { this.drawTarget(); }, this.targetUpdatePeriod);
        
        return material
    }    
    
    private drawTarget()
    {
        const maxRadius = this.targetSize/2;
        const startFade = maxRadius * 2.0 / 3.0;
        const endFade = maxRadius;
    
        const posX = this.targetSize/2;
        const posY = this.targetSize/2;
    
        let opacityTexture = <DynamicTexture>this.decalMaterial.opacityTexture;
        let ctx = opacityTexture.getContext();
        
        ctx.clearRect(0, 0, this.targetSize, this.targetSize);
    
        const numLines = 3;
     
        let lineWidth = maxRadius / (2 * numLines);
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#000000";
        for(let index = 0; index < numLines; index++){
            TargetDecalManager.drawCircle(ctx, posX, posY,(this.iteration + 2 * index * lineWidth)%maxRadius, startFade, endFade);    
        }
        
        opacityTexture.update();

        this.iteration++;
        this.iteration = this.iteration > maxRadius ? 0 : this.iteration;
    }
    
    private static drawCircle(ctx, poxX, poxY, radius, startFade, endFade) 
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
        ctx.arc(poxX, poxY, radius, 0, 2 * Math.PI);
        ctx.stroke();
    }    
}
