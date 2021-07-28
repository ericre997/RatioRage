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

    public static shuffle(array : any[]) : any[] {
        let currentIndex = array.length;
        while(0 != currentIndex) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }
}