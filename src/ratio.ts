import { Utils } from "./Utils"

export class Ratio {
    public numerator: number;
    public denominator: number;
    
    constructor(numerator: number, denominator: number) {
        this.numerator = numerator;
        this.denominator = denominator;
    }

    public toString(): string { 
        return this.numerator + "/" + this.denominator; 
    }
    
    public static getSeedRatio() {
        let primes = [1,2,3,5,7];
        let pNumerator = .25;
        let pDenominator = .5;

        // get random ratio where numerator and denom are both primes
        let ratio = new Ratio(Utils.selectRandomValue(primes), Utils.selectRandomValue(primes));
    
        // randomly select numerator or denominator (or nothing) and multiply by another prime
        Utils.removeValueFromArray(primes, 1);
    
        let roll = Math.random();
        if(roll < pNumerator) {
            Utils.removeValueFromArray(primes, ratio.denominator);
            ratio.numerator *= Utils.selectRandomValue(primes);
        } else if (roll < pDenominator) {
            Utils.removeValueFromArray(primes, ratio.numerator);
            ratio.denominator *= Utils.selectRandomValue(primes);
        }
        // else do nothing;

        return ratio;
    }
    

    public static getEquivalentRatios(ratio : Ratio, numRatios : number, factors : number[]) : Ratio[] {
        let equivalentRatios = new Array<Ratio>();
    
        let unusedFactors = [];
        for(let i = 0; i < factors.length; i++) {
            unusedFactors.push(factors[i]);
        }
    
        numRatios = Math.min(numRatios, factors.length);
    
        for(let i = 0; i < numRatios; i++) {
            let idxFactor = Utils.getRandomInteger(0, unusedFactors.length);
            let equivalentRatio = new Ratio(ratio.numerator * unusedFactors[idxFactor], ratio.denominator * unusedFactors[idxFactor]);
            equivalentRatios.push(equivalentRatio);
            unusedFactors.splice(idxFactor,1);
        }
    
        return equivalentRatios;
    }

    public static isRatioPresentInArray(ratio : Ratio, array : Ratio[]) : boolean {
        for(let i = 0; i < array.length; i++){
            if(array[i].numerator === ratio.numerator &&
               array[i].denominator === ratio.denominator) {
                   return true;
               }
        }
        return false;
    }

    // TODO:  this number picking strategy is pretty crude.  Probably gonna need to fine tune it.
    public static getNonEquivalentRatios(ratio : Ratio, numRatios : number) : Ratio[] {
        let nonEquivalentRatios = new Array<Ratio>();
        const minInclusive = 1;
        const maxExclusive = 101;

        // TODO: this will spin forever in degerate cases  
        // consider adding additional checks to prevent this.
        while(nonEquivalentRatios.length < numRatios) {
            let num1 = Utils.getRandomInteger(minInclusive, maxExclusive);
            let num2 = Utils.getRandomInteger(minInclusive, maxExclusive);

            // maintain ordering of specified ratio
            if((ratio.numerator > ratio.denominator && num1 < num2) ||
            (ratio.numerator < ratio.denominator && num1 > num2)) {
                [num1, num2] = [num2, num1];
            }
        
            let proposed = new Ratio(num1, num2);

            // if they are equivalent, try again
            if(ratio.numerator * proposed.denominator === ratio.denominator * proposed.numerator) {
                continue;
            }       

            // check that we aren't already using this ratio
            if(Ratio.isRatioPresentInArray(proposed, nonEquivalentRatios)) {
                continue;
            }

            nonEquivalentRatios.push(proposed);
        }        

        return nonEquivalentRatios;
    }
    
}