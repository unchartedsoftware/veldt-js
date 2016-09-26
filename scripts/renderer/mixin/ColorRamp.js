(function() {

    'use strict';

    let NUM_GRADIENT_STEPS = 100;

    function rgb2lab(rgb) {
        let r = rgb[0] > 0.04045 ? Math.pow((rgb[0] + 0.055) / 1.055, 2.4) : rgb[0] / 12.92;
        let g = rgb[1] > 0.04045 ? Math.pow((rgb[1] + 0.055) / 1.055, 2.4) : rgb[1] / 12.92;
        let b = rgb[2] > 0.04045 ? Math.pow((rgb[2] + 0.055) / 1.055, 2.4) : rgb[2] / 12.92;
        //Observer. = 2°, Illuminant = D65
        let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
        let y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
        let z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;
        x = x / 0.95047; // Observer= 2°, Illuminant= D65
        y = y / 1.00000;
        z = z / 1.08883;
        x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787037 * x) + (16 / 116);
        y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787037 * y) + (16 / 116);
        z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787037 * z) + (16 / 116);
        return [(116 * y) - 16,
            500 * (x - y),
            200 * (y - z),
            rgb[3]];
    }

    function lab2rgb(lab) {
        let y = (lab[0] + 16) / 116;
        let x = y + lab[1] / 500;
        let z = y - lab[2] / 200;
        x = x > 0.206893034 ? x * x * x : (x - 4 / 29) / 7.787037;
        y = y > 0.206893034 ? y * y * y : (y - 4 / 29) / 7.787037;
        z = z > 0.206893034 ? z * z * z : (z - 4 / 29) / 7.787037;
        x = x * 0.95047; // Observer= 2°, Illuminant= D65
        y = y * 1.00000;
        z = z * 1.08883;
        let r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
        let g = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
        let b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
        r = r > 0.00304 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
        g = g > 0.00304 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
        b = b > 0.00304 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;
        return [Math.max(Math.min(r, 1), 0), Math.max(Math.min(g, 1), 0), Math.max(Math.min(b, 1), 0), lab[3]];
    }

    function distance(c1, c2) {
        return Math.sqrt(
            (c1[0] - c2[0]) * (c1[0] - c2[0]) +
            (c1[1] - c2[1]) * (c1[1] - c2[1]) +
            (c1[2] - c2[2]) * (c1[2] - c2[2]) +
            (c1[3] - c2[3]) * (c1[3] - c2[3]));
    }

    let buildFlatLookupTable = function(color) {
        let output = [];
        for (let i = 0; i < NUM_GRADIENT_STEPS; i++) {
            output.push(color[0]);
            output.push(color[1]);
            output.push(color[2]);
            output.push(color[3]);
        }
        return output;
    };

    // Interpolate between a set of colors using even perceptual distance and interpolation in CIE L*a*b* space
    let buildPerceptualLookupTable = function(baseColors) {
        let buffer = new ArrayBuffer(NUM_GRADIENT_STEPS * 4 * 4);
        let outputGradient = new Float32Array(buffer);
        // Calculate perceptual spread in L*a*b* space
        let labs = _.map(baseColors, color => {
            return rgb2lab([color[0] / 255, color[1] / 255, color[2] / 255, color[3] / 255]);
        });
        let distances = _.map(labs, (color, index, colors) => {
            return index > 0 ? distance(color, colors[index - 1]) : 0;
        });
        // Calculate cumulative distances in [0,1]
        let totalDistance = _.reduce(distances, (a, b) => {
            return a + b;
        }, 0);
        distances = _.map(distances, d => {
            return d / totalDistance;
        });
        let distanceTraversed = 0;
        let key = 0;
        let progress;
        let stepProgress;
        let rgb;
        for (let i = 0; i < NUM_GRADIENT_STEPS; i++) {
            progress = i / (NUM_GRADIENT_STEPS - 1);
            if (progress > distanceTraversed + distances[key + 1] && key + 1 < labs.length - 1) {
                key += 1;
                distanceTraversed += distances[key];
            }
            stepProgress = (progress - distanceTraversed) / distances[key + 1];
            rgb = lab2rgb([
                labs[key][0] + (labs[key + 1][0] - labs[key][0]) * stepProgress,
                labs[key][1] + (labs[key + 1][1] - labs[key][1]) * stepProgress,
                labs[key][2] + (labs[key + 1][2] - labs[key][2]) * stepProgress,
                labs[key][3] + (labs[key + 1][3] - labs[key][3]) * stepProgress
            ]);
            outputGradient[i * 4] = rgb[0];
            outputGradient[i * 4 + 1] = rgb[1];
            outputGradient[i * 4 + 2] = rgb[2];
            outputGradient[i * 4 + 3] = rgb[3];
        }
        return outputGradient;
    };

    let COOL = buildPerceptualLookupTable([
        [0x04, 0x20, 0x40, 0x50],
        [0x08, 0x40, 0x81, 0x7f],
        [0x08, 0x68, 0xac, 0xff],
        [0x2b, 0x8c, 0xbe, 0xff],
        [0x4e, 0xb3, 0xd3, 0xff],
        [0x7b, 0xcc, 0xc4, 0xff],
        [0xa8, 0xdd, 0xb5, 0xff],
        [0xcc, 0xeb, 0xc5, 0xff],
        [0xe0, 0xf3, 0xdb, 0xff],
        [0xf7, 0xfc, 0xf0, 0xff]
    ]);

    let HOT = buildPerceptualLookupTable([
        [0x40, 0x00, 0x13, 0x50],
        [0x80, 0x00, 0x26, 0x7f],
        [0xbd, 0x00, 0x26, 0xff],
        [0xe3, 0x1a, 0x1c, 0xff],
        [0xfc, 0x4e, 0x2a, 0xff],
        [0xfd, 0x8d, 0x3c, 0xff],
        [0xfe, 0xb2, 0x4c, 0xff],
        [0xfe, 0xd9, 0x76, 0xff],
        [0xff, 0xed, 0xa0, 0xff]
    ]);

    let VERDANT = buildPerceptualLookupTable([
        [0x00, 0x40, 0x26, 0x50],
        [0x00, 0x5a, 0x32, 0x7f],
        [0x23, 0x84, 0x43, 0xff],
        [0x41, 0xab, 0x5d, 0xff],
        [0x78, 0xc6, 0x79, 0xff],
        [0xad, 0xdd, 0x8e, 0xff],
        [0xd9, 0xf0, 0xa3, 0xff],
        [0xf7, 0xfc, 0xb9, 0xff],
        [0xff, 0xff, 0xe5, 0xff]
    ]);

    let SPECTRAL = buildPerceptualLookupTable([
        [0x26, 0x1a, 0x40, 0x50],
        [0x44, 0x2f, 0x72, 0x7f],
        [0xe1, 0x2b, 0x02, 0xff],
        [0x02, 0xdc, 0x01, 0xff],
        [0xff, 0xd2, 0x02, 0xff],
        [0xff, 0xff, 0xff, 0xff]
    ]);

    let TEMPERATURE = buildPerceptualLookupTable([
        [0x00, 0x16, 0x40, 0x50],
        [0x00, 0x39, 0x66, 0x7f],
        [0x31, 0x3d, 0x66, 0xff],
        [0xe1, 0x2b, 0x02, 0xff],
        [0xff, 0xd2, 0x02, 0xff],
        [0xff, 0xff, 0xff, 0xff]
    ]);

    let GREYSCALE = buildPerceptualLookupTable([
        [0x00, 0x00, 0x00, 0x7f],
        [0x40, 0x40, 0x40, 0xff],
        [0xff, 0xff, 0xff, 0xff]
    ]);

    let POLAR_HOT = buildPerceptualLookupTable([
        [ 0xff, 0x44, 0x00, 0xff ],
        [ 0xbd, 0xbd, 0xbd, 0xb0 ]
    ]);

    let POLAR_COLD = buildPerceptualLookupTable([
        [ 0xbd, 0xbd, 0xbd, 0xb0 ],
        [ 0x32, 0xa5, 0xf9, 0xff ]
    ]);

    let FIRE = buildPerceptualLookupTable([
        [0x96, 0x00, 0x00, 0x96],
        [0xff, 0xff, 0x32, 0xff]
    ]);

    let FLAT = buildFlatLookupTable([0xff, 0xff, 0xff, 0xff]);

    let buildLookupFunction = function(RAMP) {
        return function(scaledValue, inColor) {
            let index = Math.floor(scaledValue * (RAMP.length / 4 - 1));
            inColor[0] = RAMP[index * 4];
            inColor[1] = RAMP[index * 4 + 1];
            inColor[2] = RAMP[index * 4 + 2];
            inColor[3] = RAMP[index * 4 + 3];
            return inColor;
        };
    };

    let concat = function(a, b) {
        let combined = new Float32Array(a.length + b.length);
        combined.set(a, 0);
        combined.set(b, a.length);
        return combined;
    };

    let ColorTables = {
        cool: COOL,
        hot: HOT,
        verdant: VERDANT,
        spectral: SPECTRAL,
        temperature: TEMPERATURE,
        grey: GREYSCALE,
        polar: concat(POLAR_HOT, POLAR_COLD),
        flat: FLAT
    };

    let ColorRamp = {
        cool: buildLookupFunction(COOL),
        hot: buildLookupFunction(HOT),
        verdant: buildLookupFunction(VERDANT),
        spectral: buildLookupFunction(SPECTRAL),
        temperature: buildLookupFunction(TEMPERATURE),
        grey: buildLookupFunction(GREYSCALE),
        fire: buildLookupFunction(FIRE),
        polar: buildLookupFunction(concat(POLAR_HOT, POLAR_COLD)),
        flat: buildLookupFunction(FLAT)
    };

    let setColorRamp = function(type, baseColors) {
        let func = ColorRamp[type.toLowerCase()];
        if (func) {
            this._colorRamp = func;
        } else if (baseColors) {
            ColorRamp[type.toLowerCase()] = buildLookupFunction(buildPerceptualLookupTable(baseColors));
            this._colorRamp = ColorRamp[type.toLowerCase()];
        }
            this._colorRampType = type.toLowerCase();
        return this;
    };

    let getColorRamp = function(type) {
        return this._colorRamp || ColorRamp[type.toLowerCase()];
    };

    let getColorRampTable = function() {
        return ColorTables[this._colorRampType];
    };

    let initialize = function() {
        this._colorRamp = ColorRamp.verdant;
        this._colorRampType = 'verdant';
    };

    module.exports = {
        initialize: initialize,
        setColorRamp: setColorRamp,
        getColorRamp: getColorRamp,
        getColorRampTable: getColorRampTable,
        NUM_GRADIENT_STEPS: NUM_GRADIENT_STEPS
    };

}());
