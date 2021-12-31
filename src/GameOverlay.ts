
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

    private islandNameLabel : TextBlock;
    private islandName : TextBlock;

    constructor(advancedTexture : AdvancedDynamicTexture) {
        this.advancedTexture = advancedTexture;
        
        let width = this.advancedTexture.getSize().width;
        let height = this.advancedTexture.getSize().height;
        let scale = window.devicePixelRatio;

        {
            let fontSize = 20 * scale;
            let outlineWidth = 2 * scale;

            this.elaspedTimeLabel = this.createTextBlock(this.advancedTexture, fontSize, outlineWidth, 10 * scale, height - 40 * scale);
            this.elaspedTimeLabel.text = this.addHairSpacing("Elapsed Time:");
            this.elapsedTime = this.createTextBlock(this.advancedTexture, fontSize, outlineWidth, 125 * scale, height - 40 * scale);

            this.scoreLabel = this.createTextBlock(this.advancedTexture, fontSize, outlineWidth, 10 * scale, height - 70 * scale);
            this.scoreLabel.text = "Score:".split("").join(String.fromCharCode(8202));;
            this.score = this.createTextBlock(this.advancedTexture, fontSize, outlineWidth, 70 * scale, height - 70 * scale);
        }
        {
            let fontSize = 30 * scale;
            let outlineWidth = 2 * scale;
            let hCenter =  width / 2 - 35 * scale;

            this.targetNumerator = this.createTargetRatioTextBlock(this.advancedTexture, fontSize, outlineWidth, hCenter, height - 80 * scale);
            this.targetRatioSeparator = this.createTargetRatioSeparator(this.advancedTexture, 50 * scale, 7 * scale, hCenter, height - 43 * scale);
            this.targetDenominator = this.createTargetRatioTextBlock(this.advancedTexture, fontSize, outlineWidth, hCenter, height - 40 * scale);
        }
        {
            let fontSize = 30 * scale;
            let outlineWidth = 3 * scale;
            this.islandNameLabel = this.createIslandNameTextBlock(this.advancedTexture, fontSize, outlineWidth, 10 * scale, 10 * scale);
            this.islandNameLabel.text = this.addHairSpacing("Current Level:")
            this.islandName = this.createIslandNameTextBlock(this.advancedTexture, fontSize, outlineWidth, 200 * scale, 10 * scale);
        }
    }

    public updateIslandName(islandName : string) {
        this.islandName.text = this.addHairSpacing(islandName);
    }
    public updateElapsedTime(elapsedTime: ElapsedTime) {
        this.elapsedTime.text = this.addHairSpacing(elapsedTime.toString());
    }
    public updateScore(score: number) {
        this.score.text = this.addHairSpacing(score.toString());
    }
    public updateTargetRatio(ratio: Ratio) {
        this.targetNumerator.text = this.addHairSpacing(ratio.numerator.toString());
        this.targetDenominator.text = this.addHairSpacing(ratio.denominator.toString());
    }

    // HTML5 canvas and text box don't appear to support letter-spacing
    // insert hair spacing characters instread.  NOTE: use 8201 for slightly wider space.
    private addHairSpacing(source : string) : string {
        return source.split("").join(String.fromCharCode(8202));;
    }

    private createTextBlock(ui: AdvancedDynamicTexture, fontSize: number, outlineWidth: number, left: number, top: number) : TextBlock {
        let textBlock = new TextBlock();

        textBlock.color = "white";
        textBlock.fontSize = fontSize; 
        textBlock.fontFamily = "Bangers";
        
        textBlock.outlineColor = "black";
        textBlock.outlineWidth = outlineWidth;  
        
        textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        textBlock.left = left;
        textBlock.top = top; 
        
        ui.addControl(textBlock);

        return textBlock;    
    }

    private createIslandNameTextBlock(ui: AdvancedDynamicTexture, fontSize: number, outlineWidth: number, left: number, top: number) : TextBlock {
        let textBlock = new TextBlock();

        textBlock.color = "red";
        textBlock.fontSize = fontSize; 
        textBlock.fontFamily = "Bangers";
        
        textBlock.outlineColor = "black";
        textBlock.outlineWidth = outlineWidth;  
        
        textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        textBlock.left = left;
        textBlock.top = top; 
        
        ui.addControl(textBlock);

        return textBlock;    
    }

    // the 1 and 7 in bangers look virtually identical, so we use Luckiest Guy here.
    private createTargetRatioTextBlock(ui: AdvancedDynamicTexture, fontSize: number, outlineWidth: number, left: number, top: number) : TextBlock {
        let textBlock = new TextBlock();

        textBlock.color = "lime";
        textBlock.fontSize = fontSize;
        //textBlock.fontFamily = "Luckiest Guy";
        textBlock.fontFamily = "Fugaz One";
        textBlock.outlineColor = "black";
        textBlock.outlineWidth = outlineWidth;
        textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        textBlock.left = left;
        textBlock.top = top; 
        
        ui.addControl(textBlock);

        return textBlock;
    }    
    private createTargetRatioSeparator(ui: AdvancedDynamicTexture, width: number, height: number, left: number, top: number) : Parallelogram {
        let shape = new Parallelogram();
        
        shape.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        shape.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        shape.left = left;
        shape.top = top;
        shape.width = width.toString() + "px";
        shape.skew = 5;
        shape.height = height.toString() + "px";
        shape.color = "black";
        shape.thickness = 2;
        shape.background = "lime";
    
        ui.addControl(shape);   

        return shape;
    }


}