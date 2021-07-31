export class Constants {
    static readonly RADIANS_PER_REVOLUTION = 6.28319;
    static readonly DEGREES_PER_RADIAN = 360 / Constants.RADIANS_PER_REVOLUTION;
    static readonly RADIANS_PER_DEGREE = Constants.RADIANS_PER_REVOLUTION / 360;

    static readonly NUM_EQUIVALENT_RATIOS = 4;
    static readonly NUM_NONEQUIVALENT_RATIOS = 6;

    static readonly MIN_HEIGHT_FOR_RATIO_PLACEMENT = 1;
    static readonly MIN_D2_TREE_RATIO_PLACEMENT = 1;
    static readonly MIN_D2_RATIO_RATIO_PLACEMENT = 2;
    static readonly MIN_D2_ANY_RATIO_COLLISION = 1;    

    static readonly RATIO_SPIN_RADIANS_PER_MS = -.05 / 60;

    static readonly NUM_BARRELS = 10;
    static readonly MIN_HEIGHT_FOR_BARREL_PLACEMENT = 1;
    static readonly MIN_D2_TREE_BARREL_PLACEMENT = 1;
    static readonly MIN_D2_RATIO_BARREL_PLACEMENT = 4;
    static readonly MIN_D2_BARREL_BARREL_PLACEMENT = 4;


    static readonly MIN_D2_PLAYER_BARREL_PICKUP = 1;
    static readonly MIN_D2_PLAYER_ELEVATION = .1;

}