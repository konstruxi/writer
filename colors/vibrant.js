
function DegToRad(degrees) {
    return degrees * Math.PI / 180;
}

function ciede94(c1,c2) {
    var kl = 1;
    var kc = 1;
    var kh = 1;

    var k1 = 0.045;
    var k2 = 0.015;
    var C1  = Math.sqrt(c1[4] * c1[4] + c1[5] * c1[5]);
    var C2 = Math.sqrt(c2[4] * c2[4] + c2[5] * c2[5]);

    var deltaA = c1[4] - c2[4];
    var deltaB = c1[5] - c2[5];
    var deltaC = C1 - C2;
    var deltaH = Math.sqrt(deltaA * deltaA + deltaB * deltaB - deltaC * deltaC);
    var deltaL = c1[3] - c2[3];

    var sl = number = 1;
    var sc = number = 1 + k1 * C1;
    var sh = number = 1 + k2 * C2;

    var firstTerm  = deltaL / (kl * sl);
    var secondTerm = deltaC / (kc * sc);
    var thirdTerm = deltaH / (kh * sh);

    return Math.sqrt(firstTerm * firstTerm + secondTerm * secondTerm + thirdTerm * thirdTerm);
}
function ciede2000(c1, c2) {
  //Set weighting factors to 1
  var k_L = 1.0;
  var k_C = 1.0;
  var k_H = 1.0;

  //Change Color Space to L*a*b:
  //Lab lab1 = c1.To<Lab>();
  //Lab lab2 = c2.To<Lab>();

  //Calculate Cprime1, Cprime2, Cabbar
  var c_star_1_ab = Math.sqrt(c1[4] * c1[4] + c1[5] * c1[5]);
  var c_star_2_ab = Math.sqrt(c2[4] * c2[4] + c2[5] * c2[5]);
  var c_star_average_ab = (c_star_1_ab + c_star_2_ab) / 2;

  var c_star_average_ab_pot7 = c_star_average_ab * c_star_average_ab * c_star_average_ab;
  c_star_average_ab_pot7 *= c_star_average_ab_pot7 * c_star_average_ab;

  var G = 0.5 * (1 - Math.sqrt(c_star_average_ab_pot7 / (c_star_average_ab_pot7 + 6103515625))); //25^7
  var a1_prime = (1 + G) * c1[4];
  var a2_prime = (1 + G) * c2[4];

  var C_prime_1 = Math.sqrt(a1_prime * a1_prime + c1[5] * c1[5]);
  var C_prime_2 = Math.sqrt(a2_prime * a2_prime + c2[5] * c2[5]);
  //Angles in Degree.
  var h_prime_1 = ((Math.atan2(c1[5], a1_prime) * 180 / Math.PI) + 360) % 360;
  var h_prime_2 = ((Math.atan2(c2[5], a2_prime) * 180 / Math.PI) + 360) % 360;

  var delta_L_prime = c2[3] - c1[3];
  var delta_C_prime = C_prime_2 - C_prime_1;

  var h_bar = Math.abs(h_prime_1 - h_prime_2);
  var delta_h_prime;
  if ((C_prime_1 * C_prime_2) === 0) delta_h_prime = 0;
  else {
      if (h_bar <= 180) {
          delta_h_prime = h_prime_2 - h_prime_1;
      } else if (h_bar > 180 && h_prime_2 <= h_prime_1) {
          delta_h_prime = h_prime_2 - h_prime_1 + 360.0;
      } else {
          delta_h_prime = h_prime_2 - h_prime_1 - 360.0;
      }
  }
  var delta_H_prime = 2 * Math.sqrt(C_prime_1 * C_prime_2) * Math.sin(delta_h_prime * Math.PI / 360);

  // Calculate CIEDE2000
  var L_prime_average = (c1[3] + c2[3]) / 2;
  var C_prime_average = (C_prime_1 + C_prime_2) / 2;

  //Calculate h_prime_average

  var h_prime_average;
  if ((C_prime_1 * C_prime_2) === 0) h_prime_average = 0;
  else {
      if (h_bar <= 180) {
          h_prime_average = (h_prime_1 + h_prime_2) / 2;
      } else if (h_bar > 180 && (h_prime_1 + h_prime_2) < 360) {
          h_prime_average = (h_prime_1 + h_prime_2 + 360) / 2;
      } else {
          h_prime_average = (h_prime_1 + h_prime_2 - 360) / 2;
      }
  }
  var L_prime_average_minus_50_square = (L_prime_average - 50);
  L_prime_average_minus_50_square *= L_prime_average_minus_50_square;

  var S_L = 1 + ((0.015 * L_prime_average_minus_50_square) / Math.sqrt(20 + L_prime_average_minus_50_square));
  var S_C = 1 + 0.045 * C_prime_average;
  var T = 1 - .17 * Math.cos(DegToRad(h_prime_average - 30)) + .24 * Math.cos(DegToRad(h_prime_average * 2)) + .32 * Math.cos(DegToRad(h_prime_average * 3 + 6)) - .2 * Math.cos(DegToRad(h_prime_average * 4 - 63));
  var S_H = 1 + .015 * T * C_prime_average;
  var h_prime_average_minus_275_div_25_square = (h_prime_average - 275) / (25);
  h_prime_average_minus_275_div_25_square *= h_prime_average_minus_275_div_25_square;
  var delta_theta = 30 * Math.exp(-h_prime_average_minus_275_div_25_square);

  var C_prime_average_pot_7 = C_prime_average * C_prime_average * C_prime_average;
  C_prime_average_pot_7 *= C_prime_average_pot_7 * C_prime_average;
  var R_C = 2 * Math.sqrt(C_prime_average_pot_7 / (C_prime_average_pot_7 + 6103515625));

  var R_T = -Math.sin(DegToRad(2 * delta_theta)) * R_C;

  var delta_L_prime_div_k_L_S_L = delta_L_prime / (S_L * k_L);
  var delta_C_prime_div_k_C_S_C = delta_C_prime / (S_C * k_C);
  var delta_H_prime_div_k_H_S_H = delta_H_prime / (S_H * k_H);

  var CIEDE2000 = Math.sqrt(
  delta_L_prime_div_k_L_S_L * delta_L_prime_div_k_L_S_L + delta_C_prime_div_k_C_S_C * delta_C_prime_div_k_C_S_C + delta_H_prime_div_k_H_S_H * delta_H_prime_div_k_H_S_H + R_T * delta_C_prime_div_k_C_S_C * delta_H_prime_div_k_H_S_H);

  return CIEDE2000;
};

(function(global) {
  function isSkin (r, g, b) {

    // classify based on RGB
    var rgbClassifier = ((r > 95) && (g > 40 && g < 100) && (b > 20) && ((Math.max(r, g, b) - Math.min(r, g, b)) > 15) && (Math.abs(r - g) > 15) && (r > g) && (r > b));

    // classify based on normalized RGB
    var sum = r + g + b;
    var nr = (r / sum),
      ng = (g / sum),
      nb = (b / sum),
      normRgbClassifier = (((nr / ng) > 1.185) && (((r * b) / (Math.pow(r + g + b, 2))) > 0.107) && (((r * g) / (Math.pow(r + g + b, 2))) > 0.112));

    // classify based on hue
    var h = 0,
      mx = Math.max(r, g, b),
      mn = Math.min(r, g, b),
      dif = mx - mn;

    if (mx == r) {
      h = (g - b) / dif;
    } else if (mx == g) {
      h = 2 + ((g - r) / dif)
    } else {
      h = 4 + ((r - g) / dif);
    }
    h = h * 60;
    if (h < 0) {
      h = h + 360;
    }
    var s = 1 - (3 * ((Math.min(r, g, b)) / (r + g + b)));
    var hsvClassifier = (h > 0 && h < 35 && s > 0.23 && s < 0.68);

    // match either of the classifiers
    return (rgbClassifier || normRgbClassifier || hsvClassifier); // 
  }

  function rgb2lab(rgb) {

    var r = rgb[0] / 255,
        g = rgb[1] / 255,
        b = rgb[2] / 255;

    // assume sRGB
    r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
    g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
    b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);
    
    var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
    var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
    var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);


    var l, a, b;

    x /= 95.047;
    y /= 100;
    z /= 108.883;

    x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16 / 116);
    y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16 / 116);
    z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16 / 116);

    l = (116 * y) - 16;
    a = 500 * (x - y);
    b = 200 * (y - z);
    
    rgb[3] = l
    rgb[4] = a
    rgb[5] = b

  }

/*
  Vibrant.js
  by Jari Zwarts
  Color algorithm class that finds variations on colors in an image.
  Credits
  --------
  Lokesh Dhakar (http://www.lokeshdhakar.com) - Created ColorThief
  Google - Palette support library in Android
 */
var CanvasImage, Swatch, Vibrant,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  slice = [].slice;
var YIQ = function(color) {
  return (color.rgb[0] * 299 + color.rgb[1] * 587 + color.rgb[2] * 114) / 1000;
};

global.Swatch = Swatch = (function() {
  Swatch.prototype.hsl = void 0;

  Swatch.prototype.rgb = void 0;

  Swatch.prototype.population = 1;

  Swatch.yiq = 0;

  function Swatch(rgb, population) {
    this.rgb = rgb.slice(0, 3).map(function(value) {
      return Math.floor(value);
    });
    this.population = population;
  }

  Swatch.prototype.getHsl = function() {
    if (!this.hsl) {
      return this.hsl = Vibrant.rgbToHsl(this.rgb[0], this.rgb[1], this.rgb[2]);
    } else {
      return this.hsl;
    }
  };
  Swatch.prototype.getLab = function() {
    if (!this.lab) {
      var rgb = this.rgb.slice()
      rgb2lab(rgb)
      this.lab = rgb.slice(3)
      this.lab.fromRgb = rgb;
      return this.lab
    } else {
      return this.lab;
    }
  };

  Swatch.prototype.getPopulation = function() {
    return this.population;
  };

  Swatch.prototype.getRgb = function() {
    return this.rgb;
  };

  Swatch.prototype.toString = function() {
    return 'rgb(' + this.rgb.join(', ') + ')';
  };

  Swatch.prototype.getHex = function() {
    return "#" + ((1 << 24) + (this.rgb[0] << 16) + (this.rgb[1] << 8) + this.rgb[2]).toString(16).slice(1, 7);
  };

  return Swatch;

})();

global.Vibrant = Vibrant = (function() {
  Vibrant.prototype.quantize = MMCQ;

  Vibrant.prototype.rgbquant = RgbQuant;
  Vibrant.prototype.iq = global.iq;

  Vibrant.prototype._swatches = [];



  //Vibrant.prototype.MAX_DARK_LUMA = 0.45;
  Vibrant.prototype.MAX_DARK_LUMA = 0.07;
  Vibrant.prototype.MIN_NORMAL_LUMA = 0.07;
  Vibrant.prototype.MAX_NORMAL_LUMA = 0.45;
  Vibrant.prototype.MIN_LIGHT_LUMA = 0.45;

  Vibrant.prototype.MAX_MUTED_SATURATION = 0.45;
  Vibrant.prototype.MIN_VIBRANT_SATURATION = 0.45;

  Vibrant.prototype.TARGET_DARK_LUMA = 0.0;
  Vibrant.prototype.TARGET_LIGHT_LUMA = 0.6;
  Vibrant.prototype.TARGET_NORMAL_LUMA = 0.2;
  Vibrant.prototype.TARGET_MUTED_SATURATION = 0.4;
  Vibrant.prototype.TARGET_VIBRANT_SATURATION = 0.8;


  Vibrant.prototype.WEIGHT_SATURATION = 7;

  Vibrant.prototype.WEIGHT_LUMA = 3;

  Vibrant.prototype.WEIGHT_POPULATION = 1;

  Vibrant.prototype.VibrantSwatch = void 0;

  Vibrant.prototype.MutedSwatch = void 0;

  Vibrant.prototype.DarkVibrantSwatch = void 0;

  Vibrant.prototype.DarkMutedSwatch = void 0;

  Vibrant.prototype.LightVibrantSwatch = void 0;

  Vibrant.prototype.LightMutedSwatch = void 0;

  Vibrant.prototype.HighestPopulation = 0;


  function Vibrant(sourceImage, colorCount, quality) {
    this.swatches = bind(this.swatches, this);
    var a, allPixels, b, cmap, g, i, image, imageData, offset, opts, palette, pixelCount, pixels, q, r;
    if (typeof colorCount === 'undefined') {
      colorCount = 64;
    }
    if (typeof quality === 'undefined') {
      quality = 5;
    }
      if (this.rgbquant) {
        opts = {
          colors: 80,
          method: 2,
          boxSize: [4, 4],
          boxPxls: 2,
          initColors: 4096
        };
        q = new this.rgbquant(opts);
        q.initDist = 0.15;
        q.distIncr = 0.2;
        q.colorDist = function(rgb1, rgb2) {
          if (rgb1.length == 3) {
            rgb2lab(rgb1)
          }
          if (rgb2.length == 3) {
            rgb2lab(rgb2)
          }

          return ciede94(rgb1, rgb2)
          
          var sum  = 0;


          sum += Math.pow(rgb1[3] - rgb2[3], 2);
          sum += Math.pow(rgb1[4] - rgb2[4], 2);
          sum += Math.pow(rgb1[5] - rgb2[5], 2);

          return Math.max(Math.min(Math.sqrt(sum), 100), 0)
        }
//        q.method = 1;
  //      q.sample(sourceImage);
        q.method = 2;

        q.sample(sourceImage);
        palette = q.palette(true, true);

        //q.sortPal()

        this._swatches = palette.map((function(_this) {
          return function(color, index) {
            return new Swatch(color, palette.length - index);
          };
        })(this));
      } else {
        image = new CanvasImage(sourceImage);
        imageData = image.getImageData();
        pixels = imageData.data;
        pixelCount = image.getPixelCount();
        allPixels = [];
        i = 0;
        while (i < pixelCount) {
          offset = i * 4;
          r = pixels[offset + 0];
          g = pixels[offset + 1];
          b = pixels[offset + 2];
          a = pixels[offset + 3];
          if (a >= 125) {
            if (!(r > 250 && g > 250 && b > 250)) {
              allPixels.push([r, g, b]);
            }
          }
          i = i + quality;
        }
        cmap = this.quantize(allPixels, colorCount);
        this._swatches = cmap.vboxes.map((function(_this) {
          return function(vbox) {
            return new Swatch(vbox.color, vbox.vbox.count());
          };
        })(this));
        image.removeCanvas();
      }
      this.maxPopulation = this.findMaxPopulation();
      this.generateVarationColors();
      this.generateEmptySwatches()
  }

  Vibrant.prototype.NotYellow = function(hsl) {
    return true;
    if (hsl[2] < 0.5)
      return false
    return hsl[0] < 50 || hsl[0] > 63
  };

  Vibrant.prototype.generateVarationColors = function() {
    var i, j;
    for (i = j = 1; j < 4; i = ++j) {
      if (i === 1) {
        i = '';
      }
      this['LightVibrantSwatch' + i] = this.findColorVariation(
                                          this.TARGET_LIGHT_LUMA, this.MIN_LIGHT_LUMA, 1, 
                                          this.TARGET_VIBRANT_SATURATION, this.MIN_VIBRANT_SATURATION, 1, 
                                          'LightVibrantSwatch');
      this['MutedSwatch' + i] = this.findColorVariation(this.TARGET_NORMAL_LUMA, this.MIN_NORMAL_LUMA, this.MAX_NORMAL_LUMA, 
                                           this.TARGET_MUTED_SATURATION, 0, this.MAX_MUTED_SATURATION - 0.1, 'MutedSwatch');
      this['DarkMutedSwatch' + i] = this.findColorVariation(this.TARGET_DARK_LUMA, 0, this.MAX_DARK_LUMA, this.TARGET_MUTED_SATURATION, 0, this.MAX_MUTED_SATURATION, 'DarkMutedSwatch');
      this['DarkVibrantSwatch' + i] = this.findColorVariation(this.TARGET_DARK_LUMA, 0.02, this.MAX_DARK_LUMA, this.TARGET_VIBRANT_SATURATION, this.MIN_VIBRANT_SATURATION, 1, 'DarkVibrantSwatch');
      this['LightMutedSwatch' + i] = this.findColorVariation(this.TARGET_LIGHT_LUMA, this.MIN_LIGHT_LUMA, 1, this.TARGET_MUTED_SATURATION, 0, this.MAX_MUTED_SATURATION, 'LightMutedSwatch');
      this['VibrantSwatch' + i] = this.findColorVariation(this.TARGET_NORMAL_LUMA, this.MIN_NORMAL_LUMA / 1.5, this.MIN_NORMAL_LUMA / 3 + this.MAX_NORMAL_LUMA, this.TARGET_VIBRANT_SATURATION, this.MIN_VIBRANT_SATURATION + 0.15, 1, 'VibrantSwatch')
                              ||  this.findColorVariation(this.TARGET_NORMAL_LUMA, this.MIN_NORMAL_LUMA / 1.5, this.MIN_NORMAL_LUMA / 3 + this.MAX_NORMAL_LUMA, this.TARGET_VIBRANT_SATURATION, this.MIN_VIBRANT_SATURATION, 1, 'VibrantSwatch')
      
    }
  };

  Vibrant.prototype.generateEmptySwatches = function() {
    var Source, Target, hsl, light, lights, luma, number, numbers, saturation, value, vibrance, vibrances;
    for (Target in this) {
      value = this[Target];
      if (Target.indexOf('Swatch') > -1 && Target.indexOf(3) === -1) {
        if (value == null) {
          if (Target.indexOf('Light') > -1) {
            lights = ['Regular', 'Dark', 'Light'];
            luma = this.TARGET_LIGHT_LUMA;
          } else if (Target.indexOf('Dark') > -1) {
            lights = ['Regular', 'Light', 'Dark'];
            luma = 0.15;
          } else {
            lights = ['Light', 'Dark', 'Regular'];
            luma = 0.6;
          }
          if (Target.indexOf('Muted') > -1) {
            if (Target.indexOf('Dark') > -1 || Target.indexOf('Light') > -1) 
              vibrances = ['Vibrant', 'Muted'];
            else
              vibrances = ['Muted', 'Vibrant']
            saturation = this.TARGET_MUTED_SATURATION;
          } else {
            vibrances = ['Vibrant'];
            saturation = this.TARGET_VIBRANT_SATURATION;
          }
          if (Target.indexOf('2') > -1) {
            numbers = [2, 1];
          } else {
            numbers = [1, 2];
          }
          var j, len ;
          swatches: for (j = 0, len = numbers.length; j < len; j++) {
            number = numbers[j];
            var k, len1;
            for (k = 0, len1 = lights.length; k < len1; k++) {
              light = lights[k];
              var len2, m, ref;
              for (m = 0, len2 = vibrances.length; m < len2; m++) {
                vibrance = vibrances[m];
                Source = (light !== 'Regular' && light || '') + (vibrance + 'Swatch') + (number === 2 && '2' || '');
                if (this[Source] && YIQ(this[Source]) > 100) {
                  hsl = (ref = this[Source].getHsl()) != null ? ref.slice() : void 0;
                  if (light === 'Regular') {
                    if (Target.match(/Light|Dark/)) {
                      hsl[2] = luma;
                    }
                  } else if (Target.indexOf(light) === -1) {
                    hsl[2] = luma;
                  }
                  hsl[1] = saturation;
                  var composed = new Swatch(Vibrant.hslToRgb(hsl[0], hsl[1], hsl[2]), 0);
                  if (Target.indexOf('2') > -1)
                    if (ciede94(composed.getLab().fromRgb, this[Target.replace('2', '')].getLab().fromRgb) < 0.3)
                      continue
                  this[Target] = composed;
                  break swatches;
                }
              }
            }
          }
        }
      }
    }
  };

  Vibrant.prototype.findMaxPopulation = function() {
    var j, len, population, ref, swatch;
    population = 0;
    ref = this._swatches;
    for (j = 0, len = ref.length; j < len; j++) {
      swatch = ref[j];
      population = Math.max(population, swatch.getPopulation());
    }
    return population;
  };

  Vibrant.prototype.findColorVariation = function(targetLuma, minLuma, maxLuma, targetSaturation, minSaturation, maxSaturation, label, filter) {
    var hue, hueDiff, j, len, luma, max, maxValue, name, other, ref, sat, swatch, total, value;
    max = void 0;
    maxValue = 0;
    ref = this._swatches;
    for (j = 0, len = ref.length; j < len; j++) {
      swatch = ref[j];
      hue = swatch.getHsl()[0];
      sat = swatch.getHsl()[1];
      luma = swatch.getLab()[0] / 8;
      if (filter) {
        if (filter.call(this, hue) === false) {
          continue;
        }
      }
      if (sat >= minSaturation && sat <= maxSaturation && luma >= minLuma && luma <= maxLuma && !this.isAlreadySelected(swatch) && swatch.getPopulation() > 2) {
        hueDiff = 0;
        total = 0;
        if (label) {
          for (name in this) {
            other = this[name];
            if (other && name.indexOf(label) == 0) {
              total++;
              hueDiff += Math.abs(other.getHsl()[0] - hue) % 0.5;
            }
          }
        }
        value = this.createComparisonValue(swatch.getRgb(), sat, targetSaturation, luma, targetLuma, hueDiff, swatch.getPopulation(), this.maxPopulation);
        if (max === void 0 || value > maxValue) {
          max = swatch;
          maxValue = value;
        }
      }
    }
    if (max != null) {
      max.name = label.replace('Switch', '');
    }
    return max;
  };


  Vibrant.prototype.createComparisonValue = function(rgb, saturation, targetSaturation, luma, targetLuma, hueDiff, population, maxPopulation) {
    return this.weightedMean(this.invertDiff(saturation, targetSaturation), this.WEIGHT_SATURATION, 
      this.invertDiff(luma, targetLuma), this.WEIGHT_LUMA, 
      population / maxPopulation, this.WEIGHT_POPULATION, 
      hueDiff, 55,
      isSkin.apply(null, rgb), -5);
  };

  Vibrant.prototype.invertDiff = function(value, targetValue) {
    return 1 - Math.abs(value - targetValue);
  };

  Vibrant.prototype.weightedMean = function() {
    var i, sum, sumWeight, value, values, weight;
    values = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    sum = 0;
    sumWeight = 0;
    i = 0;
    while (i < values.length) {
      value = values[i];
      weight = values[i + 1];
      sum += value * weight;
      sumWeight += weight;
      i += 2;
    }
    return sum / sumWeight;
  };

  Vibrant.prototype.swatches = function() {
    var name1, property, result, value;
    result = {};
    for (property in this) {
      value = this[property];
      if (typeof value === 'object' && property.indexOf('Swatch') > -1) {
        (result[name1 = property.replace('Swatch', '').replace(/\d+$/, '')] || (result[name1] = [])).push(value);
      }
    }
    return result;
  };

  Vibrant.prototype.isAlreadySelected = function(swatch) {
    var property, value;
    for (property in this) {
      value = this[property];
      if (value === swatch) {
        return true;
      }
    }
  };

  Vibrant.rgbToHsl = function(r, g, b) {
    var d, h, l, max, min, s;
    r /= 255;
    g /= 255;
    b /= 255;
    max = Math.max(r, g, b);
    min = Math.min(r, g, b);
    h = void 0;
    s = void 0;
    l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return [h, s, l];
  };

  Vibrant.hslToRgb = function(h, s, l) {
    var b, g, hue2rgb, p, q, r;
    r = void 0;
    g = void 0;
    b = void 0;
    hue2rgb = function(p, q, t) {
      if (t < 0) {
        t += 1;
      }
      if (t > 1) {
        t -= 1;
      }
      if (t < 1 / 6) {
        return p + (q - p) * 6 * t;
      }
      if (t < 1 / 2) {
        return q;
      }
      if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6;
      }
      return p;
    };
    if (s === 0) {
      r = g = b = l;
    } else {
      q = l < 0.5 ? l * (1 + s) : l + s - (l * s);
      p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - (1 / 3));
    }
    return [r * 255, g * 255, b * 255];
  };

  return Vibrant;

})();


/*
  CanvasImage Class
  Class that wraps the html image element and canvas.
  It also simplifies some of the canvas context manipulation
  with a set of helper functions.
  Stolen from https://github.com/lokesh/color-thief
 */

global.CanvasImage = CanvasImage = (function() {
  function CanvasImage(image) {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    document.body.appendChild(this.canvas);
    this.width = this.canvas.width = image.width;
    this.height = this.canvas.height = image.height;
    this.context.drawImage(image, 0, 0, this.width, this.height);
  }

  CanvasImage.prototype.clear = function() {
    return this.context.clearRect(0, 0, this.width, this.height);
  };

  CanvasImage.prototype.update = function(imageData) {
    return this.context.putImageData(imageData, 0, 0);
  };

  CanvasImage.prototype.getPixelCount = function() {
    return this.width * this.height;
  };

  CanvasImage.prototype.getImageData = function() {
    return this.context.getImageData(0, 0, this.width, this.height);
  };

  CanvasImage.prototype.removeCanvas = function() {
    return this.canvas.parentNode.removeChild(this.canvas);
  };

  return CanvasImage;
})()


})(this);