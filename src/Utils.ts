export class Utils {

    public static getRandomInteger(minValueInclusive : number, maxValueExclusive : number) : number {
        return minValueInclusive + Math.trunc(Math.random() * (maxValueExclusive - minValueInclusive));
    }
    
    public static selectRandomValue(values : number[]) : number {
        let idxChosen = Utils.getRandomInteger(0, values.length);
        return values[idxChosen];
    }
    
    public static removeValueFromArray(values: number[], exclude : number) : boolean {
        const idxExclude = values.indexOf(exclude, 0);
        if(idxExclude > -1) {
            values.splice(idxExclude, 1);
            return true;
        }
        return false;
    }
}