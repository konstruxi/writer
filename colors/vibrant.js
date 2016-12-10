(function(global) {

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

window.Swatch = Swatch = (function() {
  Swatch.prototype.hsl = void 0;

  Swatch.prototype.rgb = void 0;

  Swatch.prototype.population = 1;

  Swatch.yiq = 0;

  function Swatch(rgb, population) {
    this.rgb = rgb.map(function(value) {
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

  Swatch.prototype.getTitleTextColor = function() {
    this._ensureTextColors();
    if (this.yiq < 200) {
      return "#fff";
    } else {
      return "#000";
    }
  };

  Swatch.prototype.getBodyTextColor = function() {
    this._ensureTextColors();
    if (this.yiq < 150) {
      return "#fff";
    } else {
      return "#000";
    }
  };

  Swatch.prototype._ensureTextColors = function() {
    if (!this.yiq) {
      return this.yiq = (this.rgb[0] * 299 + this.rgb[1] * 587 + this.rgb[2] * 114) / 1000;
    }
  };

  return Swatch;

})();

window.Vibrant = Vibrant = (function() {
  Vibrant.prototype.quantize = MMCQ;

  Vibrant.prototype.rgbquant = RgbQuant;

  Vibrant.prototype._swatches = [];

  Vibrant.prototype.TARGET_DARK_LUMA = 0.26;

  Vibrant.prototype.MAX_DARK_LUMA = 0.45;

  Vibrant.prototype.MIN_LIGHT_LUMA = 0.55;

  Vibrant.prototype.TARGET_LIGHT_LUMA = 0.74;

  Vibrant.prototype.MIN_NORMAL_LUMA = 0.3;

  Vibrant.prototype.TARGET_NORMAL_LUMA = 0.5;

  Vibrant.prototype.MAX_NORMAL_LUMA = 0.7;

  Vibrant.prototype.TARGET_MUTED_SATURATION = 0.3;

  Vibrant.prototype.MAX_MUTED_SATURATION = 0.4;

  Vibrant.prototype.TARGET_VIBRANT_SATURATION = 1;

  Vibrant.prototype.MIN_VIBRANT_SATURATION = 0.35;

  Vibrant.prototype.WEIGHT_SATURATION = 5;

  Vibrant.prototype.WEIGHT_LUMA = 6;

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
    var a, allPixels, b, cmap, g, i, image, imageData, offset, opts, pallete, pixelCount, pixels, q, r;
    if (typeof colorCount === 'undefined') {
      colorCount = 64;
    }
    if (typeof quality === 'undefined') {
      quality = 5;
    }
    try {
      if (this.rgbquant) {
        opts = {
          colors: 96,
          method: 2,
          boxSize: [32, 32],
          boxPxls: 2,
          initColors: 4096,
          minHueCols: 256,
          dithKern: null,
          dithDelta: 0,
          dithSerp: false,
          palette: [],
          reIndex: false,
          useCache: true,
          cacheFreq: 10,
          colorDist: "euclidean"
        };
        q = new this.rgbquant(opts);
        q.sample(sourceImage);
        pallete = q.palette(true, true);
        this._swatches = pallete.slice(0, 64).map((function(_this) {
          return function(color, index) {
            return new Swatch(color, pallete.length - index);
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
      }
      this.maxPopulation = this.findMaxPopulation();
      this.generateVarationColors();
    } finally {
      if (image != null) {
        image.removeCanvas();
      }
    }
  }

  Vibrant.prototype.NotYellow = function(hsl) {
    return true;
  };

  Vibrant.prototype.generateVarationColors = function() {
    var i, j, results;
    results = [];
    for (i = j = 1; j < 4; i = ++j) {
      if (i === 1) {
        i = '';
      }
      this['LightVibrantSwatch' + i] = this.findColorVariation(this.TARGET_LIGHT_LUMA, this.MIN_LIGHT_LUMA, 1, this.TARGET_VIBRANT_SATURATION, this.MIN_VIBRANT_SATURATION, 1, 'LightVibrantSwatch');
      this['VibrantSwatch' + i] = this.findColorVariation(this.TARGET_NORMAL_LUMA, this.MIN_NORMAL_LUMA, this.MAX_NORMAL_LUMA, this.TARGET_VIBRANT_SATURATION, this.MIN_VIBRANT_SATURATION, 1, 'VibrantSwatch', this.NotYellow);
      this['DarkVibrantSwatch' + i] = this.findColorVariation(this.TARGET_DARK_LUMA, 0, this.MAX_DARK_LUMA, this.TARGET_VIBRANT_SATURATION, this.MIN_VIBRANT_SATURATION, 1, 'DarkVibrantSwatch', this.NotYellow);
      this['LightMutedSwatch' + i] = this.findColorVariation(this.TARGET_LIGHT_LUMA, this.MIN_LIGHT_LUMA, 1, this.TARGET_MUTED_SATURATION, 0, this.MAX_MUTED_SATURATION, 'LightMutedSwatch');
      this['MutedSwatch' + i] = this.findColorVariation(this.TARGET_NORMAL_LUMA, this.MIN_NORMAL_LUMA, this.MAX_NORMAL_LUMA, this.TARGET_MUTED_SATURATION, 0, this.MAX_MUTED_SATURATION, 'MutedSwatch', this.NotYellow);
      results.push(this['DarkMutedSwatch' + i] = this.findColorVariation(this.TARGET_DARK_LUMA, 0, this.MAX_DARK_LUMA, this.TARGET_MUTED_SATURATION, 0, this.MAX_MUTED_SATURATION, 'DarkMutedSwatch'));
    }
    return results;
  };

  Vibrant.prototype.generateEmptySwatches = function() {
    var Source, Target, hsl, light, lights, luma, number, numbers, results, saturation, value, vibrance, vibrances;
    results = [];
    for (Target in this) {
      value = this[Target];
      if (Target.indexOf('Swatch') > -1 && Target.indexOf(3) === -1) {
        if (value == null) {
          if (Target.indexOf('Light') > -1) {
            lights = ['Dark', 'Regular', 'Light'];
            luma = this.TARGET_LIGHT_LUMA;
          } else if (Target.indexOf('Dark') > -1) {
            lights = ['Regular', 'Light', 'Dark'];
            luma = this.TARGET_DARK_LUMA;
          } else {
            lights = ['Light', 'Dark', 'Regular'];
            luma = this.TARGET_NORMAL_LUMA;
          }
          if (Target.indexOf('Muted') > -1) {
            vibrances = ['Vibrant', 'Muted'];
            saturation = this.TARGET_MUTED_SATURATION;
          } else {
            vibrances = ['Muted', 'Vibrant'];
            saturation = this.TARGET_VIBRANT_SATURATION;
          }
          if (Target.indexOf('2') > -1) {
            numbers = [2, 1];
          } else {
            numbers = [1, 2];
          }
          results.push((function() {
            var j, len, results1;
            results1 = [];
            for (j = 0, len = numbers.length; j < len; j++) {
              number = numbers[j];
              results1.push((function() {
                var k, len1, results2;
                results2 = [];
                for (k = 0, len1 = lights.length; k < len1; k++) {
                  light = lights[k];
                  results2.push((function() {
                    var len2, m, ref, results3;
                    results3 = [];
                    for (m = 0, len2 = vibrances.length; m < len2; m++) {
                      vibrance = vibrances[m];
                      Source = (light !== 'Regular' && light || '') + (vibrance + 'Swatch') + (number === 2 && '2' || '');
                      if (this[Source]) {
                        hsl = (ref = this[Source].getHsl()) != null ? ref.slice() : void 0;
                        if (light === 'Regular') {
                          if (Target.match(/Light|Dark/)) {
                            hsl[2] = luma;
                          }
                        } else if (Target.indexOf(light) === -1) {
                          hsl[2] = luma;
                        }
                        hsl[1] = saturation;
                        this[Target] = new Swatch(Vibrant.hslToRgb(hsl[0], hsl[1], hsl[2]), 0);
                        break;
                      } else {
                        results3.push(void 0);
                      }
                    }
                    return results3;
                  }).call(this));
                }
                return results2;
              }).call(this));
            }
            return results1;
          }).call(this));
        } else {
          results.push(void 0);
        }
      } else {
        results.push(void 0);
      }
    }
    return results;
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
      luma = swatch.getHsl()[2];
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
            if (other && name.indexOf(label) > -1) {
              total++;
              hueDiff += Math.abs(other.getHsl()[0] - hue);
            }
          }
        }
        if (total) {
          hueDiff /= total;
        }
        value = this.createComparisonValue(sat, targetSaturation, luma, targetLuma, hueDiff, swatch.getPopulation(), this.maxPopulation);
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

  Vibrant.prototype.createComparisonValue = function(saturation, targetSaturation, luma, targetLuma, hueDiff, population, maxPopulation) {
    return this.weightedMean(this.invertDiff(saturation, targetSaturation), this.WEIGHT_SATURATION, this.invertDiff(luma, targetLuma), this.WEIGHT_LUMA, population / maxPopulation, this.WEIGHT_POPULATION, hueDiff, 1);
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

window.CanvasImage = CanvasImage = (function() {
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


})(window);