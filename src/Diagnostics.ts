import { AdvancedDynamicTexture, ScatterPanel } from "@babylonjs/gui";
import { Control, TextBlock, Rectangle } from "@babylonjs/gui";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { Ratio } from "./Ratio";

export class Diagnostics {
    private _advancedTexture : AdvancedDynamicTexture;
    private _textX : TextBlock;
    private _textY : TextBlock;
    private _textZ : TextBlock;
    private _colorIndicator : Rectangle;

    private equivalentRatioText : TextBlock[];
    private nonEquivalentRatioText : TextBlock[];
    
    constructor(advancedTexture : AdvancedDynamicTexture) {
        this._advancedTexture = advancedTexture;
        let scale = window.devicePixelRatio;

        {
            let left = 10 * scale;
            let fontSize = 16 * scale;
            this._textX = this.createDiagnosticsTextBlock(advancedTexture, fontSize, left, 10 * scale);
            this._textY = this.createDiagnosticsTextBlock(advancedTexture, fontSize, left, 30 * scale);
            this._textZ = this.createDiagnosticsTextBlock(advancedTexture, fontSize, left, 50 * scale);
            this._colorIndicator = this.createDiagnosticsRectangle(advancedTexture, left, 70 * scale, 70 * scale, 20 * scale);
        }            

        this.equivalentRatioText = new Array<TextBlock>();
        this.nonEquivalentRatioText = new Array<TextBlock>();
    }

    public updateEquivalentRatios(ratios : Ratio[]) {

        this.equivalentRatioText.length = 0;
        let scale = window.devicePixelRatio;

        let fontSize = 16 * scale;
        let left = Math.max(0, this._advancedTexture.getSize().width - 120 * scale);
        let top = 10 * scale;
        let inc = 20 * scale;

        for(let i = 0; i < ratios.length; i++) {
            let thisText = this.createDiagnosticsTextBlock(this._advancedTexture, fontSize, left, top + i * inc);
            thisText.text = ratios[i].toString();
            this.equivalentRatioText.push(thisText);
        }
    }

    public updateNonEquivalentRatios(ratios : Ratio[]) {

        this.nonEquivalentRatioText.length = 0;
        let scale = window.devicePixelRatio;

        let fontSize = 16 * scale;
        let left = Math.max(0, this._advancedTexture.getSize().width - 60 * scale);
        let top = 10 * scale;
        let inc = 20 * scale;

        for(let i = 0; i < ratios.length; i++) {
            let thisText = this.createDiagnosticsTextBlock(this._advancedTexture, fontSize, left, top + i * inc);
            thisText.text = ratios[i].toString();
            this.equivalentRatioText.push(thisText);
        }
    }

    public update(position : Vector3, color : Color3) {
        this._textX.text = "X: " + position.x;
        this._textY.text = "Y: " + position.y;
        this._textZ.text = "Z: " + position.z;

        let colorString = color.toHexString();
        this._colorIndicator.color = this._colorIndicator.background = colorString;
    }

    private createDiagnosticsTextBlock(ui: AdvancedDynamicTexture, fontSize: number, left: number, top: number) : TextBlock {
        let textBlock = new TextBlock();
        let scale = window.devicePixelRatio;

        textBlock.color = "white";
        textBlock.fontSize = fontSize;
        textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        textBlock.left = left;
        textBlock.top = top; 
        
        ui.addControl(textBlock);

        return textBlock;    
    }


    private createDiagnosticsRectangle(ui: AdvancedDynamicTexture, 
        left: number, top: number, width: number, height: number) : Rectangle {
        let rect = new Rectangle();
        let scale = window.devicePixelRatio;
       
        rect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        rect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        rect.left = left;
        rect.top = top;
        rect.width = width.toString() + "px"; 
        rect.height = height.toString() + "px"; 
        rect.cornerRadius = 0;
        rect.color = "#F08080";
        rect.thickness = 4;
        rect.background = "#F08080";
    
        ui.addControl(rect);   

        return rect;
    }
}     