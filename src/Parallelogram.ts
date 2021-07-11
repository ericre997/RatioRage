import { Container } from "@babylonjs/gui/2D/controls";
import { Measure } from "@babylonjs/gui/2D";
import { _TypeStore } from '@babylonjs/core/Misc/typeStore';
import { serialize } from '@babylonjs/core/Misc/decorators';
//import { CanvasRenderingContext2D } from "@babylonjs/core";

/** Class used to create rectangle container */
export class Parallelogram extends Container {
    private _thickness = 1;
    private _skew = 0;

    /** Gets or sets border thickness */
    
    public get thickness(): number {
        return this._thickness;
    }

    public set thickness(value: number) {
        if (this._thickness === value) {
            return;
        }

        this._thickness = value;
        this._markAsDirty();
    }

    /** Gets or sets the skew*/
    public get skew(): number {
        return this._skew;
    }

    public set skew(value: number) {
        if (value < 0) {
            value = 0;
        }

        if (this._skew === value) {
            return;
        }

        this._skew = value;
        this._markAsDirty();
    }


    /**
     * Creates a new Rectangle
     * @param name defines the control name
     */
    constructor(public name?: string) {
        super(name);
    }

    protected _getTypeName(): string {
        return "Parallelogram";
    }

    protected _localDraw(context : CanvasRenderingContext2D): void {
        context.save();

        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }

        if (this._background) {
            context.fillStyle = this.typeName === "Button" ? (this.isEnabled ? this._background : this.disabledColor) : this._background;

            this._drawInternal(context, this._thickness / 2);
            context.fill();
        }

        if (this._thickness) {

            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowBlur = 0;
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
            }

            if (this.color) {
                context.strokeStyle = this.color;
            }
            context.lineWidth = this._thickness;

            this._drawInternal(context, this._thickness / 2);
            context.stroke();
        }

        context.restore();
    }

    protected _additionalProcessing(parentMeasure: Measure, context : CanvasRenderingContext2D): void {
        super._additionalProcessing(parentMeasure, context);

        this._measureForChildren.width -= 2 * this._thickness;
        this._measureForChildren.height -= 2 * this._thickness;
        this._measureForChildren.left += this._thickness;
        this._measureForChildren.top += this._thickness;
    }

    private _drawInternal(context, offset: number = 0): void {
        var x = this._currentMeasure.left + offset;
        var y = this._currentMeasure.top + offset;
        var width = this._currentMeasure.width - offset * 2;
        var height = this._currentMeasure.height - offset * 2;

        
        context.beginPath();

        context.moveTo(x + this._skew, y);
        context.lineTo(x + width, y);
        context.lineTo(x + width - this._skew, y + height);
        context.lineTo(x, y + height);
        
        context.closePath();
    }

    protected _clipForChildren(context : CanvasRenderingContext2D) {
        this._drawInternal(context, this._thickness);
        context.clip();
    }
}
_TypeStore.RegisteredTypes["BABYLON.GUI.Parallelogram"] = Parallelogram;