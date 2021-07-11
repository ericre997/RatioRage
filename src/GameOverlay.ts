
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { Control, TextBlock, Rectangle } from "@babylonjs/gui";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { Ratio } from "./Ratio";
import { Parallelogram } from "./Parallelogram";
import { ElapsedTime } from "./ElapsedTime";



export class GameOverlay {
    private advancedTexture : AdvancedDynamicTexture;
    
    private elaspedTimeLabel : TextBlock;
    private elapsedTime : TextBlock;
    
    private scoreLabel : TextBlock;
    private score : TextBlock;

    private targetNumerator : TextBlock;
    private targetRatioSeparator : Parallelogram;
    private targetDenominator : TextBlock;

    constructor(advancedTexture : AdvancedDynamicTexture) {
        this.advancedTexture = advancedTexture;
        let width = this.advancedTexture.getSize().width;
        let height = this.advancedTexture.getSize().height;

        this.elaspedTimeLabel = this.createTextBlock(this.advancedTexture, 10, height - 40);
        this.elaspedTimeLabel.text = this.addHairSpacing("Elapsed Time:");
        this.elapsedTime = this.createTextBlock(this.advancedTexture, 125, height - 40);

        this.scoreLabel = this.createTextBlock(this.advancedTexture, 10, height - 70);
        this.scoreLabel.text = "Score:".split("").join(String.fromCharCode(8202));;
        this.score = this.createTextBlock(this.advancedTexture, 70, height - 70);

        this.targetNumerator = this.createTargetRatioTextBlock(this.advancedTexture, width / 2 - 35, height - 80);
        this.targetRatioSeparator = this.createTargetRatioSeparator(this.advancedTexture, width / 2 - 35, height - 46);
        this.targetDenominator = this.createTargetRatioTextBlock(this.advancedTexture, width / 2 - 35, height - 40);

        //this._textX = this.createDiagnosticsTextBlock(advancedTexture, 10, 10);
        //this._textY = this.createDiagnosticsTextBlock(advancedTexture, 10, 30);
        //this._textZ = this.createDiagnosticsTextBlock(advancedTexture, 10, 50);
        //this._colorIndicator = this.createDiagnosticsRectangle(advancedTexture, 10, 70);

        //this.equivalentRatioText = new Array<TextBlock>();
        //this.nonEquivalentRatioText = new Array<TextBlock>();
    }

    public updateElapsedTime(elapsedTime: ElapsedTime) {
        this.elapsedTime.text = this.addHairSpacing(elapsedTime.toString());
    }
    public updateScore(score: number) {
        this.score.text = this.addHairSpacing(score.toString());
    }
    public updateTargetRatio(ratio: Ratio) {
        this.targetNumerator.text = this.addHairSpacing(ratio.numerator.toString());
        //this.drawTargetRatioSeparator(this.advancedTexture, 0, 0);
        //this.targetRatioLine.text = "----";
        this.targetDenominator.text = this.addHairSpacing(ratio.denominator.toString());
    }

    // HTML5 canvas and text box don't appear to support letter-spacing
    // insert hair spacing characters instread.  NOTE: use 8201 for slightly wider space.
    private addHairSpacing(source : string) : string {
        return source.split("").join(String.fromCharCode(8202));;
    }

    private createTextBlock(ui: AdvancedDynamicTexture, left: number, top: number) : TextBlock {
        let textBlock = new TextBlock();

        textBlock.color = "white";
        textBlock.fontSize = 20;
        textBlock.fontFamily = "Bangers";
        
        textBlock.outlineColor = "black";
        textBlock.outlineWidth = 2;
        
        textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        textBlock.left = left;
        textBlock.top = top; 
        
        ui.addControl(textBlock);

        return textBlock;    
    }

    // the 1 and 7 in bangers look virtually identical, so we use Luckiest Guy here.
    private createTargetRatioTextBlock(ui: AdvancedDynamicTexture, left: number, top: number) : TextBlock {
        let textBlock = new TextBlock();

        textBlock.color = "lime";
        textBlock.fontSize = 30;
        textBlock.fontFamily = "Luckiest Guy";
        textBlock.outlineColor = "black";
        textBlock.outlineWidth = 2;
        textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        textBlock.left = left;
        textBlock.top = top; 
        
        ui.addControl(textBlock);

        return textBlock;
    }    
    private createTargetRatioSeparator(ui: AdvancedDynamicTexture, left: number, top: number) : Parallelogram {
        let shape = new Parallelogram();
        
        shape.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        shape.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        shape.left = left;
        shape.top = top;
        shape.width = "50px"; //"100px";
        shape.skew = 5;
        shape.height = "8px";
        shape.color = "black";
        shape.thickness = .8;
        shape.background = "lime";
    
        ui.addControl(shape);   

        return shape;
    }


}