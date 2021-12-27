export class Constants {
    static readonly RADIANS_PER_REVOLUTION = 6.28319;
    static readonly DEGREES_PER_RADIAN = 360 / Constants.RADIANS_PER_REVOLUTION;
    static readonly RADIANS_PER_DEGREE = Constants.RADIANS_PER_REVOLUTION / 360;

    static readonly LEFT_MOUSE_BUTTON = 0;
    static readonly RIGHT_MOUSE_BUTTON = 2;

    static readonly BARREL_ROOT_PREFIX = "br";
    static readonly BARREL_EXP_ROOT_PREFIX = "bx";
    static readonly BARREL_WHOLE_PREFIX = "bw";
    static readonly BARREL_FRAGMENT_PREFIX = "bf";

    static readonly RATIO_ROOT_PREFIX = "rr";
    static readonly RATIO_EXP_ROOT_PREFIX = "rx";
    static readonly RATIO_WHOLE_PREFIX = "rw";
    static readonly RATIO_FRAGMENT_PREFIX = "rf";

    // note:  stuff under here should probably be moved as it is more config/level dependent.
    // keep it all in one place for now though.
    static readonly NUM_EQUIVALENT_RATIOS = 4;
    static readonly NUM_NONEQUIVALENT_RATIOS = 6;

    static readonly MIN_HEIGHT_FOR_RATIO_PLACEMENT = 1;
    static readonly MIN_D2_TREE_RATIO_PLACEMENT = 1;
    static readonly MIN_D2_RATIO_RATIO_PLACEMENT = 2;
    static readonly MIN_D2_ANY_RATIO_COLLISION = 1;    

    static readonly RATIO_SPIN_RADIANS_PER_MS = -.05 / 60;

    static readonly PLAYER_SPEED = 5/1000; // units per millisecond
    static readonly APE_SCALING = 2;

    static readonly NUM_BARRELS = 10;
    static readonly MIN_HEIGHT_FOR_BARREL_PLACEMENT = 1;
    static readonly MIN_D2_TREE_BARREL_PLACEMENT = 1;
    static readonly MIN_D2_RATIO_BARREL_PLACEMENT = 4;
    static readonly MIN_D2_BARREL_BARREL_PLACEMENT = 4;

    static readonly MIN_D2_PLAYER_BARREL_PICKUP = 1.5;
    static readonly MIN_D2_PLAYER_ELEVATION = .1;

    static readonly MIN_D_BARREL_GROUND_EXPLODE = .5
    static readonly MIN_D2_BARREL_BARREL_EXPLODE = 1;
    static readonly MIN_D2_BARREL_RATIO_EXPLODE = 1;

}