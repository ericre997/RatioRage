import { Scene } from "@babylonjs/core/scene";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { Tools } from "@babylonjs/core/Misc";

export class ColorMap { 
    private _cellColors = new Array<Color3>();
    private _subdivisionsX : number;
    private _subdivisionsY : number;

    private _width: number;
    private _height: number;

    constructor(subdivisionsX: number, 
                subdivisionsY: number, 
                width: number,
                height: number) {

        this._subdivisionsX = Math.trunc(subdivisionsX);
        this._subdivisionsY = Math.trunc(subdivisionsY);
        this._width = width;
        this._height = height;
    }


    public getColorAtPosition(position : Vector3) : Color3 {
        let idx = this.getIndexForPosition(position);
        return this._cellColors[idx];
    }

    // get positions that satisfy the specified filter
    public getPositions(filter: (color : Color3) => boolean) : Vector3[] {
        let positions = new Array<Vector3>();
        
        for(let i = 0; i < this._cellColors.length; i++) {
            if(filter(this._cellColors[i])) {
                positions.push(this.getPositionForIndex(i));
            }
        }

        return positions;
    }
   
    private getPositionForIndex(index: number) : Vector3 {
        let cellWidth = this._width / this._subdivisionsX;
        let cellHeight = this._height / this._subdivisionsY;

        let posX = (index % this._subdivisionsY ) * cellWidth - this._width/2;
        let posY = this._height/2 - (Math.floor(index / this._subdivisionsX) )* cellHeight;
        return new Vector3(posX, 0, posY);
    }
   
    private getIndexForPosition(position: Vector3) : number {
        let idxX = (((position.x + this._width / 2) / this._width) * (this._subdivisionsX - 1));
        let idxY = ((1.0 - (position.z + this._height / 2) / this._height) * (this._subdivisionsY - 1));    
    
        return Math.trunc(idxX) + Math.trunc(idxY) * this._subdivisionsX;
    }

    public buildColorMap(scene: Scene, url: string, onBuildComplete: () => void) {
    
        var onload = (img: HTMLImageElement | ImageBitmap) => {
            let bufferWidth = img.width;
            let bufferHeight = img.height;
    
            if (scene!.isDisposed) {
                return;
            }
            
            let buffer = <Uint8Array>(ColorMap.resizeImageBitmap(scene, img, bufferWidth, bufferHeight));
  
            // save off color in upper left pixel of this subdivision
            // TODO:  consider averaging the pixels in this cell
            for (let row = 0; row < this._subdivisionsY; row++) {
                for (let col = 0; col < this._subdivisionsX; col++) {
                    // calculate position relative to the center of the image.
                    // This is what will be returned in the PickingInfo on a mouse notification.
                    let position = new Vector3((col * this._width) / this._subdivisionsX - (this._width / 2.0), 
                                            0, 
                                            ((this._subdivisionsY - row) * this._height) / this._subdivisionsY - (this._height / 2.0));
    
                    // Get the index of the RGB value for this position
                    let idxX = (((position.x + this._width / 2) / this._width) * (bufferWidth - 1)) | 0;
                    let idxY = ((1.0 - (position.z + this._height / 2) / this._height) * (bufferHeight - 1)) | 0;    
    
                    let idx = (Math.trunc(idxX) + Math.trunc(idxY) * bufferWidth) * 4;
                    
                    let color = new Color3(buffer[idx] / 255.0,
                                           buffer[idx + 1] / 255.0,
                                           buffer[idx + 2] / 255.0);
    
                    this._cellColors.push(color);
                }
            }
            onBuildComplete();
        };
    
        Tools.LoadImage(url, onload, () => { }, scene.offlineProvider);
    }

    // this is (mostly) cribbed from the 5.0 Engine object and should be removed in favor of 
    // engine.resizeImageBitmap once 5.0 is released.
    
    private static resizeImageBitmap(scene : Scene,
        image: HTMLImageElement | ImageBitmap, 
        bufferWidth: number, 
        bufferHeight: number): Uint8Array {

        let canvas = document.createElement("canvas");
        canvas.width = bufferWidth;
        canvas.height = bufferHeight;

        let context = canvas.getContext("2d");
        
        context.drawImage(image, 0, 0);

        let buffer = <Uint8Array>(<any>context.getImageData(0,0,bufferWidth, bufferHeight).data);
        return buffer;
    }

/*
    public buildColorMapAsync(scene: Scene, url: string): Promise<ColorMap> {
        return new Promise((resolve,reject) => {
            this.buildColorMap(scene, url);
            return this;
        });
    }                    
*/
}

