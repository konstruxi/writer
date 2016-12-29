(function (global){
var Adjust, CSS, Colors, Contrast, Find, Matrix, Options, Palette, Row, Samples, Schema, Schemes, Space, YIQ, properties, rule,
  hasProp = {}.hasOwnProperty;


var Palette = global.Palette = function(img) {
  var generator, matrix, swatches, vibrance;
  if (!img.nodeType || !(swatches = Palette.fromString(img.getAttribute('palette')))) {
    vibrance = new Vibrant(img, 120, 1);
    swatches = vibrance.swatches();
  }
  matrix = Matrix(swatches);
  generator = function(name, I, J) {
    var cell, i, j, k, l, len, len1, row;
    for (i = k = 0, len = Space.length; k < len; i = ++k) {
      row = Space[i];
      for (j = l = 0, len1 = row.length; l < len1; j = ++l) {
        cell = row[j];
        if (j < 7) {
          if (name === cell || (i === I && j === J)) {
            return Schemes[cell](swatches, matrix, (I != null ? I : i) / 4, (J != null ? J : j) / 4);
          }
        }
      }
    }
  };
  generator.debug = function() {
    return Palette.debug(swatches, matrix);
  };
  generator.toString = function() {
    var string = ''
    for (var name in swatches) {
      var prefix = name.replace(/[a-z]/g, '');
      var colors = swatches[name];
      if (string)
        string += ' '
      string += prefix
      for (var i = 0, color; color = colors[i++];) {
        string += color.getHex()
       //keep caps
      }

    }
    return string;
  }
  return generator;
};

Palette.fromString = function(string) {
  if (!string) return
  var swatches = {}
  string.split(/\s+/).forEach(function(bit) {
    switch (bit.substring(0, 2).toLowerCase()) {
      case 'lm':
        var name = 'LightMuted';
        break;
      case 'dm':
        var name = 'DarkMuted';
        break;
      case 'm#':
        var name = 'Muted';
        break;
      case 'lv':
        var name = 'LightVibrant';
        break;
      case 'dv':
        var name = 'DarkVibrant';
        break;
      case 'v#':
        var name = 'Vibrant';
        break;
    }
    swatches[name] = []
    bit.match(/\#([a-f0-9]{3,6})/ig).forEach(function(color, index) {
      var rgb = hexToRgb(color)
      if (rgb)
        swatches[name].push(new Swatch(rgb, 3 - index))
    })
  })
  return swatches
}

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

Adjust = function(colors) {
  var diff, hsl, Palette, property, value;
  Palette = {};
  for (property in colors) {
    value = colors[property];
    if (value) {
      hsl = value.getHsl();
      if (property.indexOf('Dark') > -1) {
        if (value.getPopulation() < 3000) {
          if ((diff = hsl[2] - 0.15) > 0) {
            Palette[property] = new Swatch(Vibrant.hslToRgb(hsl[0], hsl[1], hsl[2] * (1 - diff * 2)), value.getPopulation());
          }
        }
      } else if (property.indexOf('Light') > -1) {
        if (value.getPopulation() < 6000) {
          if ((diff = 0.85 - hsl[2]) > 0) {
            Palette[property] = new Swatch(Vibrant.hslToRgb(hsl[0], hsl[1], hsl[2] * (1 + diff * 2)), value.getPopulation());
          }
        }
      }
      if (value.getPopulation() < 1000) {
        if (property.indexOf('Vibrant') > -1) {
          if (property.indexOf('Light') > -1 || property.indexOf('Dark') > -1) {
            if ((diff = 0.65 - hsl[1]) > 0) {
              Palette[property] = new Swatch(Vibrant.hslToRgb(hsl[0], hsl[1] * (1 + diff), hsl[2]), value.getPopulation());
            }
          } else {
            if ((diff = 0.85 - hsl[1]) > 0) {
              Palette[property] = new Swatch(Vibrant.hslToRgb(hsl[0], hsl[1] * (1 + diff * 2), hsl[2]), value.getPopulation());
            }
          }
        }
      }
      if (Palette[property] == null) {
        Palette[property] = value;
      }
    }
  }
  return Palette;
};

Contrast = function(c1, c2) {
  return ciede2000(c1.getLab().fromRgb, c2.getLab().fromRgb)
};

RGBContrast = function(c1, c2) {
  var l1 = Luminance(c1);
  var l2 = Luminance(c2);
  if (l1 > l2) {
    return (l1 + 0.05) / (l2 + 0.05);
  }
  return (l2 + 0.05) / (l1 + 0.05);
};
Luminance = function(color) {
  var rgba = color.rgb.slice();

  for(var i=0; i<3; i++) {
    var rgb = rgba[i];

    rgb /= 255;

    rgb = rgb < .03928 ? rgb / 12.92 : Math.pow((rgb + .055) / 1.055, 2.4);

    rgba[i] = rgb;
  }

  return .2126 * rgba[0] + .7152 * rgba[1] + 0.0722 * rgba[2];
};
YIQ = function(color) {
  return (color.rgb[0] * 299 + color.rgb[1] * 587 + color.rgb[2] * 114) / 1000;
};

Row = function(name, bg, text) {
  var b, contrast, t, yiq;
  contrast = RGBContrast(bg, text);
  t = text.getHsl();
  b = bg.getHsl();
  yiq = YIQ(bg);
  if (contrast < 7) {

      if (yiq < 150) {
        var aaa = new Swatch([255, 255, 255], 0);
      } else {
        var aaa = new Swatch([0, 0, 0], 0);
      }
  }
  if (contrast < 2.5) {

      if (yiq < 150) {
        var aa = new Swatch([255, 255, 255], 0);
      } else {
        var aa = new Swatch([0, 0, 0], 0);
      }
  }
  return [text, contrast, aa, aaa];
};

Matrix = function(swatches) {
  var bg, bgAll, k, key, l, len, len1, matrix, p1, p2, text, textAll;
  matrix = {};
  for (p1 in swatches) {
    bgAll = swatches[p1];
    for (k = 0, len = bgAll.length; k < len; k++) {
      bg = bgAll[k];
      key = String(bg);
      for (p2 in swatches) {
        textAll = swatches[p2];
        for (l = 0, len1 = textAll.length; l < len1; l++) {
          text = textAll[l];
          if (text) {
            (matrix[key] || (matrix[key] = [])).push(Row(p2, bg, text));
          }
        }
      }
      matrix[key] = matrix[key].sort(function(a, b) {
        return b[1] - a[1];
      });
    }
  }
  return matrix;
};

Find = function(swatches, order, luma, saturation, result, filter, sorter, fallback, groups) {
  var collection, color, colors, k, l, label, len, len1, other, property, used;
  collection = [];
  if (groups == null)
    groups = 1;
  for (k = 0, len = order.length; k < len; k++) {
    label = order[k];
    if (colors = swatches[label]) {
      for (l = 0, len1 = colors.length; l < len1; l++) {
        color = colors[l];
        used = false;
        for (property in result) {
          other = result[property];
          if (!other.rgb || property.charAt(property.length - 1) == 'A')
            continue
          if (other.rgb[0] === color.rgb[0] && 
              other.rgb[1] === color.rgb[1] && 
              other.rgb[2] === color.rgb[2]) {
            used = true;
            break;
          }
        }
        if (!used && (!filter || filter(color))) {
          collection.push(color);
        }
      }
      if (!collection.length) {
        continue;
      }
      if (/*groups == null || */--groups == 0) break;
    }
  }
  if (sorter) {
    collection = collection.sort(sorter)//.slice(0, 3);
  } else {
    if (luma != null) {
      collection = collection.sort(function(a, b) {
        return (b.getHsl()[2] * b.population - a.getHsl()[2] * a.population) * luma + (b.getHsl()[1] * b.population - a.getHsl()[1] * a.population) * saturation;
      });
      collection = [collection[Math.floor(luma * 4 * 4 + saturation * 4 * 7) % collection.length]];
    }
  }
  if (filter) {
    if (!collection.length && fallback) {
      return Find(swatches, fallback, result, filter);
    }
    return collection[0];
  } else {
    return collection[0];
  }
};

PaletteResult = function(swatches, matrix, luma, saturation, preset) {
  var color, colors, fallback, order, property, result, values;
  result = Object.create(preset);
  for (property in preset) {
    values = preset[property];
    if (!(values != null ? values.push : void 0)) {
      continue;
    }
    if (values[0].push) {
      fallback = values[0], order = values[1];
    } else {
      fallback = null;
      order = values;
    }
    if (property === 'foreground') {
      colors = Find(swatches, order, luma, saturation, result, function(a) {
        return RGBContrast(result.background, a) > 1.4;
      }, fallback);
    } else if (property === 'accent') {
      colors = Find(swatches, order, luma, saturation, result, function(a) {
        return RGBContrast(result.background, a) > 1.1 &&
               RGBContrast(result.foreground, a) > 1.4;
      }, function(a, b) {
        return (Contrast(result.background, b) + Contrast(result.foreground, b)) - 
               (Contrast(result.background, a) + Contrast(result.foreground, a))
      }, undefined, 2);
    } else if (property === 'background') {
      colors = Find(swatches, order, luma, saturation, result);
    }
    if (colors) {
      if (colors.length) {
        color = colors[0];
      } else {
        color = colors;
      }
      result[property] = color;


      result[property + 'AAA'] = matrix[color][1][3] || matrix[color][1][2] || matrix[color][1][0];
      if (YIQ(matrix[color][0][0]) > 50 && YIQ(matrix[color][0][0]) < 800)
        result[property + 'AA'] = matrix[color][0][2] || matrix[color][0][0];
      else if (YIQ(matrix[color][1][0]) > 50 && YIQ(matrix[color][1][0]) < 800)
        result[property + 'AA'] = matrix[color][1][2] || matrix[color][1][0];
      else
        result[property + 'AA'] = matrix[color][2][2] || matrix[color][2][0];
    }
  }
  return result;
};

global.Space = Space = ("DM+DM DM+LM DV+M  DV+V DV+LV\n"+ 
        "DM+M  M+DM  M+DV  M+V  V+M\n" + 
        "DM+V   M+LV  M+LM  V+DM V+LV\n"+ 
        "LM+V  LM+DM LM+M  LV+M V+V\n"+ 
        "LM+LM LM+LV LV+LM LV+V LV+LV").split(/\n/g).map(function(line) {
  return line.split(/\s+/g);
});

Options = {
  luma: {
    dark: ['Dark', 'Dark'],
    darkish: ['', 'Dark'],
    darkening: ['Light', 'Dark'],
    darkened: ['Dark', ''],
    light: ['Light', 'Light'],
    lightish: ['', 'Light'],
    lightening: ['Dark', 'Light'],
    lightened: ['Light', '']
  },
  saturation: {
    muted: ['Muted', 'Muted'],
    saturating: ['Muted', 'Vibrant'],
    desaturating: ['Vibrant', 'Muted'],
    vibrant: ['Vibrant', 'Vibrant']
  }
};

properties = ['background', 'foreground', 'accent'];

Schema = function(name, lumas, saturations) {
  var index, k, len, options, property;
  options = {
    name: name,
    toString: CSS
  };
  for (index = k = 0, len = properties.length; k < len; index = ++k) {
    property = properties[index];
    options[property] = Colors(index, lumas, saturations).filter(function(color) {
      return typeof color === 'string' && color.indexOf('undefined') === -1;
    });
  }
  return function(swatches, matrix, luma, saturation) {
    return PaletteResult(swatches, matrix, luma, saturation, options);
  };
};

Schema.fromString = function(name) {
  var bit, index, k, l, len, len1, letter, lumas, ref, saturations;
  lumas = saturations = null;
  ref = name.split('+');
  for (index = k = 0, len = ref.length; k < len; index = ++k) {
    bit = ref[index];
    for (l = 0, len1 = bit.length; l < len1; l++) {
      letter = bit[l];
      switch (letter) {
        case 'D':
          (lumas || (lumas = []))[index] = 'Dark';
          break;
        case 'L':
          (lumas || (lumas = []))[index] = 'Light';
          break;
        case 'V':
          (saturations || (saturations = []))[index] = 'Vibrant';
          break;
        case 'M':
          (saturations || (saturations = []))[index] = 'Muted';
      }
    }
  }
  return Schema(name, lumas, saturations);
};

Colors = function(index, lumas, saturations) {
  var colors, fallback, luma, patterns, saturation;
  colors = [];
  if (index < 2) {
    luma = (lumas != null ? lumas[index] : void 0) || '';
    saturation = (saturations != null ? saturations[index] : void 0) || 'Muted';
    patterns = [!luma && saturation, luma + saturation].concat(luma ? saturation : (lumas != null ? lumas.indexOf('Dark') : void 0) === -1 ? ['Dark' + saturation, 'Light' + saturation] : ['Light' + saturation, 'Dark' + saturation]).concat(luma + (saturation === 'Vibrant' && 'Muted' || 'Vibrant'));
    fallback = [];
    return patterns;
  } else if ((saturations != null ? saturations.indexOf('Vibrant') : void 0) > -1 && lumas) {
    return ['LightVibrant', 'Vibrant', 'DarkVibrant', 'LightMuted', 'DarkMuted'];
  } else {
    return ['LightVibrant', 'Vibrant', 'DarkVibrant'];
  }
};

Palette.debug = function(swatches, matrix) {
  var color, dd, delimeted, dt, k, len, list, property, span, value;
  list = document.createElement('dl');
  list.style.float = 'left';
  list.style.marginLeft = '20px';
  for (property in swatches) {
    if (!hasProp.call(swatches, property)) continue;
    value = swatches[property];
    if (value) {
      dt = document.createElement('dt');
      dt.innerHTML = property;
      dt.style.float = 'left';
      dt.style.clear = 'both';
      dt.style.width = '100px';
      dd = document.createElement('dd');
      dd.style.float = 'left';
      dd.style.height = '20px';
      for (k = 0, len = value.length; k < len; k++) {
        color = value[k];
        span = document.createElement('span');
        span.style.display = 'inline-block';
        span.style.width = '20px';
        span.style.height = '20px';
        span.style.backgroundColor = color.toString();
        span.title = parseFloat(color.getPopulation());
        dd.appendChild(span);
      }
      delimeted = false;
      list.appendChild(dt);
      list.appendChild(dd);
    }
  }
  return list;
};

Palette.example = function(colors, level) {
  var article;
  article = document.createElement('article');
  article.style.backgroundColor = colors.background;
  article.style.width = '140px';
  article.style.padding = '10px';
  article.style.display = 'inline-block';
  article.style.verticalAlign = 'top';
  if (level) {
    article.style.marginTop = 40 * (level - 1) + 'px';
    if (level < 5) {
      article.style.marginRight = '-115px';
    } else {
      article.style.marginRight = '-30px';
    }
  }
  article.innerHTML = "<h1 style=\"color: " + colors.backgroundAA + "; padding: 0; margin: 0 0 5px\">" + colors.name + "</h1>\n<p style=\"color: " + colors.backgroundAAA + "; padding: 0; margin: 0 0 5px\">" + colors.background.name + "</p>\n<button style=\"margin: 0 -8px -10px -10px; padding: 5px 10px; border: 0; background: " + colors.accent + "; color: " + colors.accentAAA + "\">" + colors.accent.name + "</button>\n<section style=\"background-color: " + colors.foreground + "; padding: 15px 10px 10px\">\n  <h1 style=\"color: " + colors.foregroundAA + "; padding: 0; margin: 0 0 5px\">Good title Ω</h1>\n  <p style=\"color: " + colors.foregroundAAA + "; padding: 0; margin: 0\">" + colors.foreground.name + "</p>\n</section>";
  return article;
};

CSS = function(prefix) {
  return (
"body.toolbar-" + prefix + " #formatting," +
"body.menu-"    + prefix + " #sectionizer svg," +
"body.toolbar-" + prefix + " #formatting .cke_button {\n" +
"  background-color: " + this.foreground + ";\n" +
"  color: " + this.accent + ";\n" +
"}\n" +
".temp-"    + prefix + " {" +
"  color: " + this.foregroundAAA + " !important;\n" +
"  background-color: " + this.foreground + ";\n" +
"}\n" +
"body.menu-"    + prefix + " #sectionizer svg:hover," +
"body.toolbar-" + prefix + " #formatting .cke_button:hover {\n" +
"  color: " + this.foreground + ";\n" +
"  background-color: " + this.accent + ";\n" +
"}\n" +
".content section." + prefix + " {\n" +
"  background-color: " + this.background + ";\n" +
"  color: " + this.foregroundAAA + ";\n" +
"}\n" +
".content section." + prefix + " .toolbar  {\n" +
"  background-color: " + this.background + ";\n" +
"  border-color: " + this.background + ";\n" +
"  color: " + this.accent + ";\n" +
"}\n" +
".content section." + prefix + " .toolbar  svg{\n" +
"  color: " + this.accent + ";\n" +
"  background-color: " + this.background + ";\n" +
"  border-color: " + this.background + ";\n" +
"}\n" +
".content section." + prefix + " .toolbar svg:hover {\n" +
"  border-color: " + this.accent + ";\n" +
"  background-color: " + this.accent + ";\n" +
"  color: " + this.background + ";\n" +
"}\n" +
".content section." + prefix + " h1,\n" +
".content section." + prefix + " h2,\n" +
".content section." + prefix + " h3 {\n" +
"  color: " + this.foregroundAA + ";\n" +
"}\n" +
".content section." + prefix + " a {\n" +
"  color: " + this.accent + ";\n" +
"  border-color: " + this.background + ";\n" +
"  outline-color: " + this.foregroundAA + ";\n" +
"}\n" +
".content section." + prefix + " > .foreground {\n" +
"  background-color: " + this.foreground + ";\n" +
"}" +
".content section." + prefix + ":hover > .foreground {\n" +
"  border-color: " + this.accent + ";\n" +
"}" + 
".content section." + prefix + " *::selection {\n" +
"  background-color: " + this.accent + ";\n" +
"  color: " + this.accentAAA + ";\n" +
"}")
};


rule = function(prefix, selector, text) {
  return text.replace(new RegExp(prefix, 'g'), prefix + selector);
};

Schemes = {};

(function() {
  var cell, i, j, k, l, len, len1, luma, lumas, ref, ref1, ref2, results, row, saturation, saturations;
  for (i = k = 0, len = Space.length; k < len; i = ++k) {
    row = Space[i];
    for (j = l = 0, len1 = row.length; l < len1; j = ++l) {
      cell = row[j];
      Schemes[cell] = Schema.fromString(cell);
    }
  }
  ref = Options.saturation;
  for (saturation in ref) {
    saturations = ref[saturation];
    Schemes[saturation] = Schema(saturation, null, saturations);
  }
  ref1 = Options.luma;
  results = [];
  for (luma in ref1) {
    lumas = ref1[luma];
    ref2 = Options.saturation;
    for (saturation in ref2) {
      saturations = ref2[saturation];
      Schemes[luma + saturation] = Schema(luma + saturation, lumas, saturations);
    }
    results.push(Schemes[luma] = Schema(luma, lumas));
  }
  return results;
})();

})(this);