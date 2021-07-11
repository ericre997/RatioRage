import { minmaxReduxPixelShader } from "@babylonjs/core/Shaders/minmaxRedux.fragment";


export class ElapsedTime {
    private startTime: number;
    private elapsedMs: number;
    private isStarted: boolean;

    public start() : void {
        this.isStarted= true;
        this.startTime = new Date().getTime();
        this.elapsedMs = 0;
    }

    public stop() : void {
        this.isStarted = false;
    }

    public getElapsedMs() : number {
        if(this.isStarted) {
            let now = new Date().getTime();
            this.elapsedMs = now - this.startTime;
        }
        return this.elapsedMs;
    }

    public toString() : string {
        let elapsed = this.getElapsedMs();

        let ms = elapsed % 1000;
        elapsed = Math.trunc(elapsed/1000);
        let sec = elapsed % 60;
        elapsed = Math.trunc(elapsed/60);
        let min = elapsed % 60;
        //elapsed = Math.trunc(elapsed/60);
        //let hour = elapsed % 24;

        return this.pad(min,2) + ":" + this.pad(sec,2) + ":" + this.pad(ms,3);
    }

    private pad(num: number, size: number): string {
        var s = "000" + num.toString();
        return s.substr(s.length - size);
    }
}
