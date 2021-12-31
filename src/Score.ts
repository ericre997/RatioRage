
export class Score {
    private score : number = 0;

    public increment() {
        this.score ++;
    }

    public decrement() {
        this.score --;
    }
    
    public getScore() { 
        return this.score;
    }
}