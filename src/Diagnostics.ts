import { AdvancedDynamicTexture } from "@babylonjs/gui";
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
        this._textX = this.createDiagnosticsTextBlock(advancedTexture, 10, 10);
        this._textY = this.createDiagnosticsTextBlock(advancedTexture, 10, 30);
        this._textZ = this.createDiagnosticsTextBlock(advancedTexture, 10, 50);
        this._colorIndicator = this.createDiagnosticsRectangle(advancedTexture, 10, 70);

        this.equivalentRatioText = new Array<TextBlock>();
        this.nonEquivalentRatioText = new Array<TextBlock>();
    }

    public updateEquivalentRatios(ratios : Ratio[]) {

        this.equivalentRatioText.length = 0;
        let left = Math.max(0, this._advancedTexture.getSize().width - 120);
        let top = 10;
        let inc = 20;

        for(let i = 0; i < ratios.length; i++) {
            let thisText = this.createDiagnosticsTextBlock(this._advancedTexture, left, top + i * inc);
            thisText.text = ratios[i].toString();
            this.equivalentRatioText.push(thisText);
        }
    }

    public updateNonEquivalentRatios(ratios : Ratio[]) {

        this.nonEquivalentRatioText.length = 0;
        let left = Math.max(0, this._advancedTexture.getSize().width - 60);
        let top = 10;
        let inc = 20;

        for(let i = 0; i < ratios.length; i++) {
            let thisText = this.createDiagnosticsTextBlock(this._advancedTexture, left, top + i * inc);
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

    private createDiagnosticsTextBlock(ui: AdvancedDynamicTexture, left: number, top: number) : TextBlock {
        let textBlock = new TextBlock();

        textBlock.color = "white";
        textBlock.fontSize = 16;
        textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        textBlock.left = left;
        textBlock.top = top; 
        
        ui.addControl(textBlock);

        return textBlock;    
    }

    private createDiagnosticsRectangle(ui: AdvancedDynamicTexture, left: number, top: number) : Rectangle {
        let rect = new Rectangle();
        
        rect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        rect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        rect.left = left;
        rect.top = top;
        rect.width = 0.1;
        rect.height = "20px";
        rect.cornerRadius = 0;
        rect.color = "#F08080";
        rect.thickness = 4;
        rect.background = "#F08080";
    
        ui.addControl(rect);   

        return rect;
    }
}     