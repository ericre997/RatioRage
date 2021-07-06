import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Mesh } from "@babylonjs/core/Meshes";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";

export class ImpactDecalManager {
    private decalMaterial;
    private decalSize = new Vector3(3,3,3);
    private decals = new Array<Mesh>();

    constructor(scene: Scene){
        this.decalMaterial = this.createImpactMaterial(scene);
    }

    public buildDecal(targetMesh : Mesh, pos: Vector3, norm: Vector3) {

        // build instance
        var decal = Mesh.CreateDecal("decal", targetMesh, pos, norm, this.decalSize, 90);
        decal.material = this.decalMaterial;
        this.decals.push(decal);
    }

    private createImpactMaterial(scene: Scene) : StandardMaterial {
        let material = new StandardMaterial("decalMat", scene);
        material.diffuseTexture = new Texture("textures/decals/impact.png", scene);
        material.diffuseTexture.hasAlpha = true;
        material.zOffset = -2;
        return material;
    }
}
