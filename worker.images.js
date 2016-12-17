/*
* Copyright (c) 2015, Leon Sorokin
* All rights reserved. (MIT Licensed)
*
* RgbQuant.js - an image quantization lib
*/

(function(){
  function RgbQuant(opts) {
    opts = opts || {};

    // 1 = by global population, 2 = subregion population threshold
    this.method = opts.method || 2;
    // desired final palette size
    this.colors = opts.colors || 256;
    // # of highest-frequency colors to start with for palette reduction
    this.initColors = opts.initColors || 4096;
    // color-distance threshold for initial reduction pass
    this.initDist = opts.initDist || 0.01;
    // subsequent passes threshold
    this.distIncr = opts.distIncr || 0.005;
    // palette grouping
    this.hueGroups = opts.hueGroups || 10;
    this.satGroups = opts.satGroups || 10;
    this.lumGroups = opts.lumGroups || 10;
    // if > 0, enables hues stats and min-color retention per group
    this.minHueCols = opts.minHueCols || 0;
    // HueStats instance
    this.hueStats = this.minHueCols ? new HueStats(this.hueGroups, this.minHueCols) : null;

    // subregion partitioning box size
    this.boxSize = opts.boxSize || [64,64];
    // number of same pixels required within box for histogram inclusion
    this.boxPxls = opts.boxPxls || 2;
    // palette locked indicator
    this.palLocked = false;
    // palette sort order
//    this.sortPal = ['hue-','lum-','sat-'];

    // dithering/error diffusion kernel name
    this.dithKern = opts.dithKern || null;
    // dither serpentine pattern
    this.dithSerp = opts.dithSerp || false;
    // minimum color difference (0-1) needed to dither
    this.dithDelta = opts.dithDelta || 0;

    // accumulated histogram
    this.histogram = {};
    // palette - rgb triplets
    this.idxrgb = opts.palette ? opts.palette.slice(0) : [];
    // palette - int32 vals
    this.idxi32 = [];
    // reverse lookup {i32:idx}
    this.i32idx = {};
    // {i32:rgb}
    this.i32rgb = {};
    // enable color caching (also incurs overhead of cache misses and cache building)
    this.useCache = opts.useCache !== false;
    // min color occurance count needed to qualify for caching
    this.cacheFreq = opts.cacheFreq || 10;
    // allows pre-defined palettes to be re-indexed (enabling palette compacting and sorting)
    this.reIndex = opts.reIndex || this.idxrgb.length == 0;
    // selection of color-distance equation
    this.colorDist = opts.colorDist == "manhattan" ? distManhattan : distEuclidean;

    // if pre-defined palette, build lookups
    if (this.idxrgb.length > 0) {
      var self = this;
      this.idxrgb.forEach(function(rgb, i) {
        var i32 = (
          (255    << 24) |  // alpha
          (rgb[2] << 16) |  // blue
          (rgb[1] <<  8) |  // green
           rgb[0]       // red
        ) >>> 0;

        self.idxi32[i]    = i32;
        self.i32idx[i32]  = i;
        self.i32rgb[i32]  = rgb;
      });
    }
  }

  // gathers histogram info
  RgbQuant.prototype.sample = function sample(img, width) {
    if (this.palLocked)
      throw "Cannot sample additional images, palette already assembled.";

    var data = getImageData(img, width);

    switch (this.method) {
      case 1: this.colorStats1D(data.buf32); break;
      case 2: this.colorStats2D(data.buf32, data.width); break;
    }
  };

  // image quantizer
  // todo: memoize colors here also
  // @retType: 1 - Uint8Array (default), 2 - Indexed array, 3 - Match @img type (unimplemented, todo)
  RgbQuant.prototype.reduce = function reduce(img, retType, dithKern, dithSerp) {
    if (!this.palLocked)
      this.buildPal();

    dithKern = dithKern || this.dithKern;
    dithSerp = typeof dithSerp != "undefined" ? dithSerp : this.dithSerp;

    retType = retType || 1;

    // reduce w/dither
    if (dithKern)
      var out32 = this.dither(img, dithKern, dithSerp);
    else {
      var data = getImageData(img),
        buf32 = data.buf32,
        len = buf32.length,
        out32 = new Uint32Array(len);

      for (var i = 0; i < len; i++) {
        var i32 = buf32[i];
        out32[i] = this.nearestColor(i32);
      }
    }

    if (retType == 1)
      return new Uint8Array(out32.buffer);

    if (retType == 2) {
      var out = [],
        len = out32.length;

      for (var i = 0; i < len; i++) {
        var i32 = out32[i];
        out[i] = this.i32idx[i32];
      }

      return out;
    }
  };

  // adapted from http://jsbin.com/iXofIji/2/edit by PAEz
  RgbQuant.prototype.dither = function(img, kernel, serpentine) {
    // http://www.tannerhelland.com/4660/dithering-eleven-algorithms-source-code/
    var kernels = {
      FloydSteinberg: [
        [7 / 16, 1, 0],
        [3 / 16, -1, 1],
        [5 / 16, 0, 1],
        [1 / 16, 1, 1]
      ],
      FalseFloydSteinberg: [
        [3 / 8, 1, 0],
        [3 / 8, 0, 1],
        [2 / 8, 1, 1]
      ],
      Stucki: [
        [8 / 42, 1, 0],
        [4 / 42, 2, 0],
        [2 / 42, -2, 1],
        [4 / 42, -1, 1],
        [8 / 42, 0, 1],
        [4 / 42, 1, 1],
        [2 / 42, 2, 1],
        [1 / 42, -2, 2],
        [2 / 42, -1, 2],
        [4 / 42, 0, 2],
        [2 / 42, 1, 2],
        [1 / 42, 2, 2]
      ],
      Atkinson: [
        [1 / 8, 1, 0],
        [1 / 8, 2, 0],
        [1 / 8, -1, 1],
        [1 / 8, 0, 1],
        [1 / 8, 1, 1],
        [1 / 8, 0, 2]
      ],
      Jarvis: [     // Jarvis, Judice, and Ninke / JJN?
        [7 / 48, 1, 0],
        [5 / 48, 2, 0],
        [3 / 48, -2, 1],
        [5 / 48, -1, 1],
        [7 / 48, 0, 1],
        [5 / 48, 1, 1],
        [3 / 48, 2, 1],
        [1 / 48, -2, 2],
        [3 / 48, -1, 2],
        [5 / 48, 0, 2],
        [3 / 48, 1, 2],
        [1 / 48, 2, 2]
      ],
      Burkes: [
        [8 / 32, 1, 0],
        [4 / 32, 2, 0],
        [2 / 32, -2, 1],
        [4 / 32, -1, 1],
        [8 / 32, 0, 1],
        [4 / 32, 1, 1],
        [2 / 32, 2, 1],
      ],
      Sierra: [
        [5 / 32, 1, 0],
        [3 / 32, 2, 0],
        [2 / 32, -2, 1],
        [4 / 32, -1, 1],
        [5 / 32, 0, 1],
        [4 / 32, 1, 1],
        [2 / 32, 2, 1],
        [2 / 32, -1, 2],
        [3 / 32, 0, 2],
        [2 / 32, 1, 2],
      ],
      TwoSierra: [
        [4 / 16, 1, 0],
        [3 / 16, 2, 0],
        [1 / 16, -2, 1],
        [2 / 16, -1, 1],
        [3 / 16, 0, 1],
        [2 / 16, 1, 1],
        [1 / 16, 2, 1],
      ],
      SierraLite: [
        [2 / 4, 1, 0],
        [1 / 4, -1, 1],
        [1 / 4, 0, 1],
      ],
    };

    if (!kernel || !kernels[kernel]) {
      throw 'Unknown dithering kernel: ' + kernel;
    }

    var ds = kernels[kernel];

    var data = getImageData(img),
//      buf8 = data.buf8,
      buf32 = data.buf32,
      width = data.width,
      height = data.height,
      len = buf32.length;

    var dir = serpentine ? -1 : 1;

    for (var y = 0; y < height; y++) {
      if (serpentine)
        dir = dir * -1;

      var lni = y * width;

      for (var x = (dir == 1 ? 0 : width - 1), xend = (dir == 1 ? width : 0); x !== xend; x += dir) {
        // Image pixel
        var idx = lni + x,
          i32 = buf32[idx],
          r1 = (i32 & 0xff),
          g1 = (i32 & 0xff00) >> 8,
          b1 = (i32 & 0xff0000) >> 16;

        // Reduced pixel
        var i32x = this.nearestColor(i32),
          r2 = (i32x & 0xff),
          g2 = (i32x & 0xff00) >> 8,
          b2 = (i32x & 0xff0000) >> 16;

        buf32[idx] =
          (255 << 24) | // alpha
          (b2  << 16) | // blue
          (g2  <<  8) | // green
           r2;

        // dithering strength
        if (this.dithDelta) {
          var dist = this.colorDist([r1, g1, b1], [r2, g2, b2]);
          if (dist < this.dithDelta)
            continue;
        }

        // Component distance
        var er = r1 - r2,
          eg = g1 - g2,
          eb = b1 - b2;

        for (var i = (dir == 1 ? 0 : ds.length - 1), end = (dir == 1 ? ds.length : 0); i !== end; i += dir) {
          var x1 = ds[i][1] * dir,
            y1 = ds[i][2];

          var lni2 = y1 * width;

          if (x1 + x >= 0 && x1 + x < width && y1 + y >= 0 && y1 + y < height) {
            var d = ds[i][0];
            var idx2 = idx + (lni2 + x1);

            var r3 = (buf32[idx2] & 0xff),
              g3 = (buf32[idx2] & 0xff00) >> 8,
              b3 = (buf32[idx2] & 0xff0000) >> 16;

            var r4 = Math.max(0, Math.min(255, r3 + er * d)),
              g4 = Math.max(0, Math.min(255, g3 + eg * d)),
              b4 = Math.max(0, Math.min(255, b3 + eb * d));

            buf32[idx2] =
              (255 << 24) | // alpha
              (b4  << 16) | // blue
              (g4  <<  8) | // green
               r4;      // red
          }
        }
      }
    }

    return buf32;
  };

  // reduces histogram to palette, remaps & memoizes reduced colors
  RgbQuant.prototype.buildPal = function buildPal(noSort) {
    if (this.palLocked || this.idxrgb.length > 0 && this.idxrgb.length <= this.colors) return;

    var histG  = this.histogram,
      sorted = sortedHashKeys(histG, true);

    if (sorted.length == 0)
      throw "Nothing has been sampled, palette cannot be built.";

    switch (this.method) {
      case 1:
        var cols = this.initColors,
          last = sorted[cols - 1],
          freq = histG[last];

        var idxi32 = sorted.slice(0, cols);

        // add any cut off colors with same freq as last
        var pos = cols, len = sorted.length;
        while (pos < len && histG[sorted[pos]] == freq)
          idxi32.push(sorted[pos++]);

        // inject min huegroup colors
        if (this.hueStats)
          this.hueStats.inject(idxi32);

        break;
      case 2:
        var idxi32 = sorted;
        break;
    }

    // int32-ify values
    idxi32 = idxi32.map(function(v){return +v;});

    this.reducePal(idxi32);

    if (!noSort && this.reIndex)
      this.sortPal();

    // build cache of top histogram colors
    if (this.useCache)
      this.cacheHistogram(idxi32);

    this.palLocked = true;
  };

  RgbQuant.prototype.palette = function palette(tuples, noSort) {
    this.buildPal(noSort);
    return tuples ? this.idxrgb : new Uint8Array((new Uint32Array(this.idxi32)).buffer);
  };

  RgbQuant.prototype.prunePal = function prunePal(keep) {
    var i32;

    for (var j = 0; j < this.idxrgb.length; j++) {
      if (!keep[j]) {
        i32 = this.idxi32[j];
        this.idxrgb[j] = null;
        this.idxi32[j] = null;
        delete this.i32idx[i32];
      }
    }

    // compact
    if (this.reIndex) {
      var idxrgb = [],
        idxi32 = [],
        i32idx = {};

      for (var j = 0, i = 0; j < this.idxrgb.length; j++) {
        if (this.idxrgb[j]) {
          i32 = this.idxi32[j];
          idxrgb[i] = this.idxrgb[j];
          i32idx[i32] = i;
          idxi32[i] = i32;
          i++;
        }
      }

      this.idxrgb = idxrgb;
      this.idxi32 = idxi32;
      this.i32idx = i32idx;
    }
  };

  // reduces similar colors from an importance-sorted Uint32 rgba array
  RgbQuant.prototype.reducePal = function reducePal(idxi32) {
    // if pre-defined palette's length exceeds target
    if (this.idxrgb.length > this.colors) {
      // quantize histogram to existing palette
      var len = idxi32.length, keep = {}, uniques = 0, idx, pruned = false;

      for (var i = 0; i < len; i++) {
        // palette length reached, unset all remaining colors (sparse palette)
        if (uniques == this.colors && !pruned) {
          this.prunePal(keep);
          pruned = true;
        }

        idx = this.nearestIndex(idxi32[i]);

        if (uniques < this.colors && !keep[idx]) {
          keep[idx] = true;
          uniques++;
        }
      }

      if (!pruned) {
        this.prunePal(keep);
        pruned = true;
      }
    }
    // reduce histogram to create initial palette
    else {
      // build full rgb palette
      var idxrgb = idxi32.map(function(i32) {
        return [
          (i32 & 0xff),
          (i32 & 0xff00) >> 8,
          (i32 & 0xff0000) >> 16,
        ];
      });

      var len = idxrgb.length,
        palLen = len,
        thold = this.initDist;

      // palette already at or below desired length
      if (palLen > this.colors) {
        while (palLen > this.colors) {
          var memDist = [];

          // iterate palette
          for (var i = 0; i < len; i++) {
            var pxi = idxrgb[i], i32i = idxi32[i];
            if (!pxi) continue;

            for (var j = i + 1; j < len; j++) {
              var pxj = idxrgb[j], i32j = idxi32[j];
              if (!pxj) continue;

              var dist = this.colorDist(pxi, pxj);

              if (dist < thold) {
                // store index,rgb,dist
                memDist.push([j, pxj, i32j, dist]);

                // kill squashed value
                delete(idxrgb[j]);
                palLen--;
              }
            }
          }

          // palette reduction pass
          // console.log("palette length: " + palLen);

          // if palette is still much larger than target, increment by larger initDist
          thold += (palLen > this.colors * 3) ? this.initDist : this.distIncr;
        }

        // if palette is over-reduced, re-add removed colors with largest distances from last round
        if (palLen < this.colors) {
          // sort descending
          sort.call(memDist, function(a,b) {
            return b[3] - a[3];
          });

          var k = 0;
          while (palLen < this.colors) {
            // re-inject rgb into final palette
            idxrgb[memDist[k][0]] = memDist[k][1];

            palLen++;
            k++;
          }
        }
      }

      var len = idxrgb.length;
      for (var i = 0; i < len; i++) {
        if (!idxrgb[i]) continue;

        this.idxrgb.push(idxrgb[i]);
        this.idxi32.push(idxi32[i]);

        this.i32idx[idxi32[i]] = this.idxi32.length - 1;
        this.i32rgb[idxi32[i]] = idxrgb[i];
      }
    }
  };

  // global top-population
  RgbQuant.prototype.colorStats1D = function colorStats1D(buf32) {
    var histG = this.histogram,
      num = 0, col,
      len = buf32.length;

    for (var i = 0; i < len; i++) {
      col = buf32[i];

      // skip transparent
      if ((col & 0xff000000) >> 24 == 0) continue;

      // collect hue stats
      if (this.hueStats)
        this.hueStats.check(col);

      if (col in histG)
        histG[col]++;
      else
        histG[col] = 1;
    }
  };

  // population threshold within subregions
  // FIXME: this can over-reduce (few/no colors same?), need a way to keep
  // important colors that dont ever reach local thresholds (gradients?)
  RgbQuant.prototype.colorStats2D = function colorStats2D(buf32, width) {
    var boxW = this.boxSize[0],
      boxH = this.boxSize[1],
      area = boxW * boxH,
      boxes = makeBoxes(width, buf32.length / width, boxW, boxH),
      histG = this.histogram,
      self = this;

    boxes.forEach(function(box) {
      var effc = Math.max(Math.round((box.w * box.h) / area) * self.boxPxls, 2),
        histL = {}, col;

      iterBox(box, width, function(i) {
        col = buf32[i];

        // skip transparent
        if ((col & 0xff000000) >> 24 == 0) return;

        // collect hue stats
        if (self.hueStats)
          self.hueStats.check(col);

        if (col in histG)
          histG[col]++;
        else if (col in histL) {
          if (++histL[col] >= effc)
            histG[col] = histL[col];
        }
        else
          histL[col] = 1;
      });
    });

    if (this.hueStats)
      this.hueStats.inject(histG);
  };

  // TODO: group very low lum and very high lum colors
  // TODO: pass custom sort order
  RgbQuant.prototype.sortPal = function sortPal() {
    var self = this;

    this.idxi32.sort(function(a,b) {
      var idxA = self.i32idx[a],
        idxB = self.i32idx[b],
        rgbA = self.idxrgb[idxA],
        rgbB = self.idxrgb[idxB];

      var hslA = rgb2hsl(rgbA[0],rgbA[1],rgbA[2]),
        hslB = rgb2hsl(rgbB[0],rgbB[1],rgbB[2]);

      // sort all grays + whites together
      var hueA = (rgbA[0] == rgbA[1] && rgbA[1] == rgbA[2]) ? -1 : hueGroup(hslA.h, self.hueGroups);
      var hueB = (rgbB[0] == rgbB[1] && rgbB[1] == rgbB[2]) ? -1 : hueGroup(hslB.h, self.hueGroups);

      var hueDiff = hueB - hueA;
      if (hueDiff) return -hueDiff;

      var lumDiff = lumGroup(+hslB.l.toFixed(2)) - lumGroup(+hslA.l.toFixed(2));
      if (lumDiff) return -lumDiff;

      var satDiff = satGroup(+hslB.s.toFixed(2)) - satGroup(+hslA.s.toFixed(2));
      if (satDiff) return -satDiff;
    });

    // sync idxrgb & i32idx
    this.idxi32.forEach(function(i32, i) {
      self.idxrgb[i] = self.i32rgb[i32];
      self.i32idx[i32] = i;
    });
  };

  // TOTRY: use HUSL - http://boronine.com/husl/
  RgbQuant.prototype.nearestColor = function nearestColor(i32) {
    var idx = this.nearestIndex(i32);
    return idx === null ? 0 : this.idxi32[idx];
  };

  // TOTRY: use HUSL - http://boronine.com/husl/
  RgbQuant.prototype.nearestIndex = function nearestIndex(i32) {
    // alpha 0 returns null index
    if ((i32 & 0xff000000) >> 24 == 0)
      return null;

    if (this.useCache && (""+i32) in this.i32idx)
      return this.i32idx[i32];

    var min = 1000,
      idx,
      rgb = [
        (i32 & 0xff),
        (i32 & 0xff00) >> 8,
        (i32 & 0xff0000) >> 16,
      ],
      len = this.idxrgb.length;

    for (var i = 0; i < len; i++) {
      if (!this.idxrgb[i]) continue;    // sparse palettes

      var dist = this.colorDist(rgb, this.idxrgb[i]);

      if (dist < min) {
        min = dist;
        idx = i;
      }
    }

    return idx;
  };

  RgbQuant.prototype.cacheHistogram = function cacheHistogram(idxi32) {
    for (var i = 0, i32 = idxi32[i]; i < idxi32.length && this.histogram[i32] >= this.cacheFreq; i32 = idxi32[i++])
      this.i32idx[i32] = this.nearestIndex(i32);
  };

  function HueStats(numGroups, minCols) {
    this.numGroups = numGroups;
    this.minCols = minCols;
    this.stats = {};

    for (var i = -1; i < numGroups; i++)
      this.stats[i] = {num: 0, cols: []};

    this.groupsFull = 0;
  }

  HueStats.prototype.check = function checkHue(i32) {
    if (this.groupsFull == this.numGroups + 1)
      this.check = function() {return;};

    var r = (i32 & 0xff),
      g = (i32 & 0xff00) >> 8,
      b = (i32 & 0xff0000) >> 16,
      hg = (r == g && g == b) ? -1 : hueGroup(rgb2hsl(r,g,b).h, this.numGroups),
      gr = this.stats[hg],
      min = this.minCols;

    gr.num++;

    if (gr.num > min)
      return;
    if (gr.num == min)
      this.groupsFull++;

    if (gr.num <= min)
      this.stats[hg].cols.push(i32);
  };

  HueStats.prototype.inject = function injectHues(histG) {
    for (var i = -1; i < this.numGroups; i++) {
      if (this.stats[i].num <= this.minCols) {
        switch (typeOf(histG)) {
          case "Array":
            this.stats[i].cols.forEach(function(col){
              if (histG.indexOf(col) == -1)
                histG.push(col);
            });
            break;
          case "Object":
            this.stats[i].cols.forEach(function(col){
              if (!histG[col])
                histG[col] = 1;
              else
                histG[col]++;
            });
            break;
        }
      }
    }
  };

  // Rec. 709 (sRGB) luma coef
  var Pr = .2126,
    Pg = .7152,
    Pb = .0722;

  // http://alienryderflex.com/hsp.html
  function rgb2lum(r,g,b) {
    return Math.sqrt(
      Pr * r*r +
      Pg * g*g +
      Pb * b*b
    );
  }

  var rd = 255,
    gd = 255,
    bd = 255;

  var euclMax = Math.sqrt(Pr*rd*rd + Pg*gd*gd + Pb*bd*bd);
  // perceptual Euclidean color distance
  function distEuclidean(rgb0, rgb1) {
    var rd = rgb1[0]-rgb0[0],
      gd = rgb1[1]-rgb0[1],
      bd = rgb1[2]-rgb0[2];

    return Math.sqrt(Pr*rd*rd + Pg*gd*gd + Pb*bd*bd) / euclMax;
  }

  var manhMax = Pr*rd + Pg*gd + Pb*bd;
  // perceptual Manhattan color distance
  function distManhattan(rgb0, rgb1) {
    var rd = Math.abs(rgb1[0]-rgb0[0]),
      gd = Math.abs(rgb1[1]-rgb0[1]),
      bd = Math.abs(rgb1[2]-rgb0[2]);

    return (Pr*rd + Pg*gd + Pb*bd) / manhMax;
  }

  // http://rgb2hsl.nichabi.com/javascript-function.php
  function rgb2hsl(r, g, b) {
    var max, min, h, s, l, d;
    r /= 255;
    g /= 255;
    b /= 255;
    max = Math.max(r, g, b);
    min = Math.min(r, g, b);
    l = (max + min) / 2;
    if (max == min) {
      h = s = 0;
    } else {
      d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break
      }
      h /= 6;
    }
//    h = Math.floor(h * 360)
//    s = Math.floor(s * 100)
//    l = Math.floor(l * 100)
    return {
      h: h,
      s: s,
      l: rgb2lum(r,g,b),
    };
  }

  function hueGroup(hue, segs) {
    var seg = 1/segs,
      haf = seg/2;

    if (hue >= 1 - haf || hue <= haf)
      return 0;

    for (var i = 1; i < segs; i++) {
      var mid = i*seg;
      if (hue >= mid - haf && hue <= mid + haf)
        return i;
    }
  }

  function satGroup(sat) {
    return sat;
  }

  function lumGroup(lum) {
    return lum;
  }

  function typeOf(val) {
    return Object.prototype.toString.call(val).slice(8,-1);
  }

  var sort = isArrSortStable() ? Array.prototype.sort : stableSort;

  // must be used via stableSort.call(arr, fn)
  function stableSort(fn) {
    var type = typeOf(this[0]);

    if (type == "Number" || type == "String") {
      var ord = {}, len = this.length, val;

      for (var i = 0; i < len; i++) {
        val = this[i];
        if (ord[val] || ord[val] === 0) continue;
        ord[val] = i;
      }

      return this.sort(function(a,b) {
        return fn(a,b) || ord[a] - ord[b];
      });
    }
    else {
      var ord = this.map(function(v){return v});

      return this.sort(function(a,b) {
        return fn(a,b) || ord.indexOf(a) - ord.indexOf(b);
      });
    }
  }

  // test if js engine's Array#sort implementation is stable
  function isArrSortStable() {
    var str = "abcdefghijklmnopqrstuvwxyz";

    return "xyzvwtursopqmnklhijfgdeabc" == str.split("").sort(function(a,b) {
      return ~~(str.indexOf(b)/2.3) - ~~(str.indexOf(a)/2.3);
    }).join("");
  }

  // returns uniform pixel data from various img
  // TODO?: if array is passed, createimagedata, createlement canvas? take a pxlen?
  function getImageData(img, width) {
    var can, ctx, imgd, buf8, buf32, height;

    switch (typeOf(img)) {
      case "HTMLImageElement":
        can = document.createElement("canvas");
        can.width = img.naturalWidth;
        can.height = img.naturalHeight;
        ctx = can.getContext("2d");
        ctx.drawImage(img,0,0);
      case "Canvas":
      case "HTMLCanvasElement":
        can = can || img;
        ctx = ctx || can.getContext("2d");
      case "CanvasRenderingContext2D":
        ctx = ctx || img;
        can = can || ctx.canvas;
        imgd = ctx.getImageData(0, 0, can.width, can.height);
      case "ImageData":
        imgd = imgd || img;
        width = imgd.width;
        if (typeOf(imgd.data) == "CanvasPixelArray")
          buf8 = new Uint8Array(imgd.data);
        else
          buf8 = imgd.data;
      case "Array":
      case "CanvasPixelArray":
        buf8 = buf8 || new Uint8Array(img);
      case "Uint8Array":
      case "Uint8ClampedArray":
        buf8 = buf8 || img;
        buf32 = new Uint32Array(buf8.buffer);
      case "Uint32Array":
        buf32 = buf32 || img;
        buf8 = buf8 || new Uint8Array(buf32.buffer);
        width = width || buf32.length;
        height = buf32.length / width;
    }

    return {
      can: can,
      ctx: ctx,
      imgd: imgd,
      buf8: buf8,
      buf32: buf32,
      width: width,
      height: height,
    };
  }

  // partitions a rect of wid x hgt into
  // array of bboxes of w0 x h0 (or less)
  function makeBoxes(wid, hgt, w0, h0) {
    var wnum = ~~(wid/w0), wrem = wid%w0,
      hnum = ~~(hgt/h0), hrem = hgt%h0,
      xend = wid-wrem, yend = hgt-hrem;

    var bxs = [];
    for (var y = 0; y < hgt; y += h0)
      for (var x = 0; x < wid; x += w0)
        bxs.push({x:x, y:y, w:(x==xend?wrem:w0), h:(y==yend?hrem:h0)});

    return bxs;
  }

  // iterates @bbox within a parent rect of width @wid; calls @fn, passing index within parent
  function iterBox(bbox, wid, fn) {
    var b = bbox,
      i0 = b.y * wid + b.x,
      i1 = (b.y + b.h - 1) * wid + (b.x + b.w - 1),
      cnt = 0, incr = wid - b.w + 1, i = i0;

    do {
      fn.call(this, i);
      i += (++cnt % b.w == 0) ? incr : 1;
    } while (i <= i1);
  }

  // returns array of hash keys sorted by their values
  function sortedHashKeys(obj, desc) {
    var keys = [];

    for (var key in obj)
      keys.push(key);

    return sort.call(keys, function(a,b) {
      return desc ? obj[b] - obj[a] : obj[a] - obj[b];
    });
  }

  // expose
  this.RgbQuant = RgbQuant;

  // expose to commonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RgbQuant;
  }

}).call(this);/*! 
 * quantize.js Copyright 2008 Nick Rabinowitz.
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

// fill out a couple protovis dependencies
/*!
 * Block below copied from Protovis: http://mbostock.github.com/protovis/
 * Copyright 2010 Stanford Visualization Group
 * Licensed under the BSD License: http://www.opensource.org/licenses/bsd-license.php
 */
if (!pv) {
    var pv = {
        map: function(array, f) {
          var o = {};
          return f
              ? array.map(function(d, i) { o.index = i; return f.call(o, d); })
              : array.slice();
        },
        naturalOrder: function(a, b) {
            return (a < b) ? -1 : ((a > b) ? 1 : 0);
        },
        sum: function(array, f) {
          var o = {};
          return array.reduce(f
              ? function(p, d, i) { o.index = i; return p + f.call(o, d); }
              : function(p, d) { return p + d; }, 0);
        },
        max: function(array, f) {
          return Math.max.apply(null, f ? pv.map(array, f) : array);
        }
    }
}
 
/**
 * Basic Javascript port of the MMCQ (modified median cut quantization)
 * algorithm from the Leptonica library (http://www.leptonica.com/).
 * Returns a color map you can use to map original pixels to the reduced
 * palette. Still a work in progress.
 * 
 * @author Nick Rabinowitz
 * @example

// array of pixels as [R,G,B] arrays
var myPixels = [[190,197,190], [202,204,200], [207,214,210], [211,214,211], [205,207,207]
                // etc
                ];
var maxColors = 4;

var cmap = MMCQ.quantize(myPixels, maxColors);
var newPalette = cmap.palette();
var newPixels = myPixels.map(function(p) { 
    return cmap.map(p); 
});
 
 */
var MMCQ = (function() {
    // private constants
    var sigbits = 5,
        rshift = 8 - sigbits,
        maxIterations = 1000,
        fractByPopulations = 0.75;
    
    // get reduced-space color index for a pixel
    function getColorIndex(r, g, b) {
        return (r << (2 * sigbits)) + (g << sigbits) + b;
    }
    
    // Simple priority queue
    function PQueue(comparator) {
        var contents = [],
            sorted = false;
        
        function sort() {
            contents.sort(comparator);
            sorted = true;
        }
        
        return {
            push: function(o) {
                contents.push(o);
                sorted = false;
            },
            peek: function(index) {
                if (!sorted) sort();
                if (index===undefined) index = contents.length - 1;
                return contents[index];
            },
            pop: function() {
                if (!sorted) sort();
                return contents.pop();
            },
            size: function() {
                return contents.length;
            },
            map: function(f) {
                return contents.map(f);
            },
            debug: function() {
                if (!sorted) sort();
                return contents;
            }
        };
    }
    
    // 3d color space box
    function VBox(r1, r2, g1, g2, b1, b2, histo) {
        var vbox = this;
        vbox.r1 = r1;
        vbox.r2 = r2;
        vbox.g1 = g1;
        vbox.g2 = g2;
        vbox.b1 = b1;
        vbox.b2 = b2;
        vbox.histo = histo;
    }
    VBox.prototype = {
        volume: function(force) {
            var vbox = this;
            if (!vbox._volume || force) {
                vbox._volume = ((vbox.r2 - vbox.r1 + 1) * (vbox.g2 - vbox.g1 + 1) * (vbox.b2 - vbox.b1 + 1));
            }
            return vbox._volume;
        },
        count: function(force) {
            var vbox = this,
                histo = vbox.histo;
            if (!vbox._count_set || force) {
                var npix = 0,
                    i, j, k;
                for (i = vbox.r1; i <= vbox.r2; i++) {
                    for (j = vbox.g1; j <= vbox.g2; j++) {
                        for (k = vbox.b1; k <= vbox.b2; k++) {
                             index = getColorIndex(i,j,k);
                             npix += (histo[index] || 0);
                        }
                    }
                }
                vbox._count = npix;
                vbox._count_set = true;
            }
            return vbox._count;
        },
        copy: function() {
            var vbox = this;
            return new VBox(vbox.r1, vbox.r2, vbox.g1, vbox.g2, vbox.b1, vbox.b2, vbox.histo);
        },
        avg: function(force) {
            var vbox = this,
                histo = vbox.histo;
            if (!vbox._avg || force) {
                var ntot = 0,
                    mult = 1 << (8 - sigbits),
                    rsum = 0,
                    gsum = 0,
                    bsum = 0,
                    hval,
                    i, j, k, histoindex;
                for (i = vbox.r1; i <= vbox.r2; i++) {
                    for (j = vbox.g1; j <= vbox.g2; j++) {
                        for (k = vbox.b1; k <= vbox.b2; k++) {
                             histoindex = getColorIndex(i,j,k);
                             hval = histo[histoindex] || 0;
                             ntot += hval;
                             rsum += (hval * (i + 0.5) * mult);
                             gsum += (hval * (j + 0.5) * mult);
                             bsum += (hval * (k + 0.5) * mult);
                        }
                    }
                }
                if (ntot) {
                    vbox._avg = [~~(rsum/ntot), ~~(gsum/ntot), ~~(bsum/ntot)];
                } else {
                    console.log('empty box');
                    vbox._avg = [
                        ~~(mult * (vbox.r1 + vbox.r2 + 1) / 2),
                        ~~(mult * (vbox.g1 + vbox.g2 + 1) / 2),
                        ~~(mult * (vbox.b1 + vbox.b2 + 1) / 2)
                    ];
                }
            }
            return vbox._avg;
        },
        contains: function(pixel) {
            var vbox = this,
                rval = pixel[0] >> rshift;
                gval = pixel[1] >> rshift;
                bval = pixel[2] >> rshift;
            return (rval >= vbox.r1 && rval <= vbox.r2 &&
                    gval >= vbox.g1 && rval <= vbox.g2 &&
                    bval >= vbox.b1 && rval <= vbox.b2);
        }
    };
    
    // Color map
    function CMap() {
        this.vboxes = new PQueue(function(a,b) { 
            return pv.naturalOrder(
                a.vbox.count()*a.vbox.volume(), 
                b.vbox.count()*b.vbox.volume()
            ) 
        });;
    }
    CMap.prototype = {
        push: function(vbox) {
            this.vboxes.push({
                vbox: vbox,
                color: vbox.avg()
            });
        },
        palette: function() {
            return this.vboxes.map(function(vb) { return vb.color });
        },
        size: function() {
            return this.vboxes.size();
        },
        map: function(color) {
            var vboxes = this.vboxes;
            for (var i=0; i<vboxes.size(); i++) {
                if (vboxes.peek(i).vbox.contains(color)) {
                    return vboxes.peek(i).color;
                }
            }
            return this.nearest(color);
        },
        nearest: function(color) {
            var vboxes = this.vboxes,
                d1, d2, pColor;
            for (var i=0; i<vboxes.size(); i++) {
                d2 = Math.sqrt(
                    Math.pow(color[0] - vboxes.peek(i).color[0], 2) +
                    Math.pow(color[1] - vboxes.peek(i).color[1], 2) +
                    Math.pow(color[1] - vboxes.peek(i).color[1], 2)
                );
                if (d2 < d1 || d1 === undefined) {
                    d1 = d2;
                    pColor = vboxes.peek(i).color;
                }
            }
            return pColor;
        },
        forcebw: function() {
            // XXX: won't  work yet
            var vboxes = this.vboxes;
            vboxes.sort(function(a,b) { return pv.naturalOrder(pv.sum(a.color), pv.sum(b.color) )});
            
            // force darkest color to black if everything < 5
            var lowest = vboxes[0].color;
            if (lowest[0] < 5 && lowest[1] < 5 && lowest[2] < 5)
                vboxes[0].color = [0,0,0];
            
            // force lightest color to white if everything > 251
            var idx = vboxes.length-1,
                highest = vboxes[idx].color;
            if (highest[0] > 251 && highest[1] > 251 && highest[2] > 251)
                vboxes[idx].color = [255,255,255];
        }
    };
    
    // histo (1-d array, giving the number of pixels in
    // each quantized region of color space), or null on error
    function getHisto(pixels) {
        var histosize = 1 << (3 * sigbits),
            histo = new Array(histosize),
            index, rval, gval, bval;
        pixels.forEach(function(pixel) {
            rval = pixel[0] >> rshift;
            gval = pixel[1] >> rshift;
            bval = pixel[2] >> rshift;
            index = getColorIndex(rval, gval, bval);
            histo[index] = (histo[index] || 0) + 1;
        });
        return histo;
    }
    
    function vboxFromPixels(pixels, histo) {
        var rmin=1000000, rmax=0, 
            gmin=1000000, gmax=0, 
            bmin=1000000, bmax=0, 
            rval, gval, bval;
        // find min/max
        pixels.forEach(function(pixel) {
            rval = pixel[0] >> rshift;
            gval = pixel[1] >> rshift;
            bval = pixel[2] >> rshift;
            if (rval < rmin) rmin = rval;
            else if (rval > rmax) rmax = rval;
            if (gval < gmin) gmin = gval;
            else if (gval > gmax) gmax = gval;
            if (bval < bmin) bmin = bval;
            else if (bval > bmax)  bmax = bval;
        });
        return new VBox(rmin, rmax, gmin, gmax, bmin, bmax, histo);
    }
    
    function medianCutApply(histo, vbox) {
        if (!vbox.count()) return;
        
        var rw = vbox.r2 - vbox.r1 + 1,
            gw = vbox.g2 - vbox.g1 + 1,
            bw = vbox.b2 - vbox.b1 + 1,
            maxw = pv.max([rw, gw, bw]);
        // only one pixel, no split
        if (vbox.count() == 1) {
            return [vbox.copy()]
        }
        /* Find the partial sum arrays along the selected axis. */
        var total = 0,
            partialsum = [],
            lookaheadsum = [],
            i, j, k, sum, index;
        if (maxw == rw) {
            for (i = vbox.r1; i <= vbox.r2; i++) {
                sum = 0;
                for (j = vbox.g1; j <= vbox.g2; j++) {
                    for (k = vbox.b1; k <= vbox.b2; k++) {
                        index = getColorIndex(i,j,k);
                        sum += (histo[index] || 0);
                    }
                }
                total += sum;
                partialsum[i] = total;
            }
        }
        else if (maxw == gw) {
            for (i = vbox.g1; i <= vbox.g2; i++) {
                sum = 0;
                for (j = vbox.r1; j <= vbox.r2; j++) {
                    for (k = vbox.b1; k <= vbox.b2; k++) {
                        index = getColorIndex(j,i,k);
                        sum += (histo[index] || 0);
                    }
                }
                total += sum;
                partialsum[i] = total;
            }
        }
        else {  /* maxw == bw */
            for (i = vbox.b1; i <= vbox.b2; i++) {
                sum = 0;
                for (j = vbox.r1; j <= vbox.r2; j++) {
                    for (k = vbox.g1; k <= vbox.g2; k++) {
                        index = getColorIndex(j,k,i);
                        sum += (histo[index] || 0);
                    }
                }
                total += sum;
                partialsum[i] = total;
            }
        }
        partialsum.forEach(function(d,i) { 
            lookaheadsum[i] = total-d 
        });
        function doCut(color) {
            var dim1 = color + '1',
                dim2 = color + '2', 
                left, right, vbox1, vbox2, d2, count2=0;
            for (i = vbox[dim1]; i <= vbox[dim2]; i++) {
                if (partialsum[i] > total / 2) {
                    vbox1 = vbox.copy();
                    vbox2 = vbox.copy();
                    left = i - vbox[dim1];
                    right = vbox[dim2] - i;
                    if (left <= right)
                        d2 = Math.min(vbox[dim2] - 1, ~~(i + right / 2));
                    else d2 = Math.max(vbox[dim1], ~~(i - 1 - left / 2));
                    // avoid 0-count boxes
                    while (!partialsum[d2]) d2++;
                    count2 = lookaheadsum[d2];
                    while (!count2 && partialsum[d2-1]) count2 = lookaheadsum[--d2];
                    // set dimensions
                    vbox1[dim2] = d2;
                    vbox2[dim1] = vbox1[dim2] + 1;
                    console.log('vbox counts:', vbox.count(), vbox1.count(), vbox2.count());
                    return [vbox1, vbox2];
                }
            }
        
        }
        // determine the cut planes
        return maxw == rw ? doCut('r') :
            maxw == gw ? doCut('g') :
            doCut('b');
    }

    function quantize(pixels, maxcolors) {
        // short-circuit
        if (!pixels.length || maxcolors < 2 || maxcolors > 256) {
            console.log('wrong number of maxcolors');
            return false;
        }
        
        // XXX: check color content and convert to grayscale if insufficient
        
        var histo = getHisto(pixels),
            histosize = 1 << (3 * sigbits);
        
        // check that we aren't below maxcolors already
        var nColors = 0;
        histo.forEach(function() { nColors++ });
        if (nColors <= maxcolors) {
            // XXX: generate the new colors from the histo and return
        }
        
        // get the beginning vbox from the colors
        var vbox = vboxFromPixels(pixels, histo),
            pq = new PQueue(function(a,b) { return pv.naturalOrder(a.count(), b.count()) });
        pq.push(vbox);
        
        // inner function to do the iteration
        function iter(lh, target) {
            var ncolors = 1,
                niters = 0,
                vbox;
            while (niters < maxIterations) {
                vbox = lh.pop();
                if (!vbox.count())  { /* just put it back */
                    lh.push(vbox);
                    niters++;
                    continue;
                }
                // do the cut
                var vboxes = medianCutApply(histo, vbox),
                    vbox1 = vboxes[0],
                    vbox2 = vboxes[1];
                    
                if (!vbox1) {
                    console.log("vbox1 not defined; shouldn't happen!");
                    return;
                }
                lh.push(vbox1);
                if (vbox2) {  /* vbox2 can be null */
                    lh.push(vbox2);
                    ncolors++;
                }
                if (ncolors >= target) return;
                if (niters++ > maxIterations) {
                    console.log("infinite loop; perhaps too few pixels!");
                    return;
                }
            }
        }
        
        // first set of colors, sorted by population
        iter(pq, fractByPopulations * maxcolors);
        // console.log(pq.size(), pq.debug().length, pq.debug().slice());
        
        // Re-sort by the product of pixel occupancy times the size in color space.
        var pq2 = new PQueue(function(a,b) { 
            return pv.naturalOrder(a.count()*a.volume(), b.count()*b.volume()) 
        });
        while (pq.size()) {
            pq2.push(pq.pop());
        }
        
        // next set - generate the median cuts using the (npix * vol) sorting.
        iter(pq2, maxcolors - pq2.size());
        
        // calculate the actual colors
        var cmap = new CMap();
        while (pq2.size()) {
            cmap.push(pq2.pop());
        }
        
        return cmap;
    }
    
    return {
        quantize: quantize
    }
})();(function(global) {

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

global.Swatch = Swatch = (function() {
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

global.Vibrant = Vibrant = (function() {
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
    if (hsl[2] < 0.5)
      return false
    return hsl[0] < 50 || hsl[0] > 63
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


})(this);(function (global){
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
debugger
  console.info(swatches, string)
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
  var adjusted, b, contrast, t, yiq;
  contrast = Contrast(bg, text);
  t = text.getHsl();
  b = bg.getHsl();
  yiq = YIQ(bg);
  if (contrast < 4 || (yiq < 100 && contrast < 8)) {
    if (contrast > 2.6 && yiq > 100) {
      if (t[2] > b[2]) {
        adjusted = new Swatch(Vibrant.hslToRgb(t[0], t[1], (b[2] + 0.05) * 7));
      } else {
        adjusted = new Swatch(Vibrant.hslToRgb(t[0], t[1], (b[2] + 0.05) / 7));
      }
    } else {
      if (yiq < 150) {
        adjusted = new Swatch([255, 255, 255], 0);
      } else {
        adjusted = new Swatch([0, 0, 0], 0);
      }
    }
  }
  return [text, contrast, adjusted];
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
        return Contrast(result.background, a) > 1.1;
      }, fallback);
    } else if (property === 'accent') {
      colors = Find(swatches, order, luma, saturation, result, function(a) {
        return Contrast(result.background, a) > 1 &&
               Contrast(result.foreground, a) > 1.8;
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
      result[property + 'AAA'] = matrix[color][0][2] || matrix[color][0][0];
      result[property + 'AA'] = matrix[color][1][2] || matrix[color][1][0];
    }
  }
  return result;
};

Space = ("DM+DM DM+LM DV+M  DV+V DV+LV\n"+ 
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
prefix + " {\n" +
"  background-color: " + this.foreground + ";\n" +
"  color: " + this.foregroundAAA + ";\n" +
"  outline-color: " + this.accent + ";\n" +
"}\n" +
prefix + " .toolbar svg {\n" +
"  background-color: " + this.background + ";\n" +
"  border-color: " + this.background + ";\n" +
"}\n" +
prefix + " .toolbar {\n" +
"  color: " + this.accent + ";\n" +
"}\n" +
prefix + " h1,\n" +
prefix + " h2,\n" +
prefix + " h3 {\n" +
"  color: " + this.foregroundAA + ";\n" +
"}\n" +
prefix + " img:before {\n" +
"  color: " + this.background + ";\n" +
"}\n" +
prefix + " img:after {\n" +
"  color: " + this.foreground + ";\n" +
"}\n" +
prefix + " a, " + prefix + ":after {\n" +
"  color: " + this.accent + ";\n" +
"  border-color: " + this.background + ";\n" +
"  outline-color: " + this.foregroundAA + ";\n" +
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

})(this);// https://github.com/nodeca/pica
// https://github.com/nodeca/pica/blob/master/lib/js/resize_array.js
// LICENSE: MIT

//Authors
//
//Vitaly Puzrin @puzrin
//Alexander Rodin @a-rodin
//@d08ble
//Loïc Faure-Lacroix @llacroix

resizeImage = (function() {

// High speed resize with tuneable speed/quality ratio

'use strict';


// Precision of fixed FP values
var FIXED_FRAC_BITS = 14;


//
// Presets for quality 0..3. Filter functions + window size
//
var FILTER_INFO = [
  { // Nearest neibor (Box)
    win: 0.5,
    filter: function (x) {
      return (x >= -0.5 && x < 0.5) ? 1.0 : 0.0;
    }
  },
  { // Hamming
    win: 1.0,
    filter: function (x) {
      if (x <= -1.0 || x >= 1.0) { return 0.0; }
      if (x > -1.19209290E-07 && x < 1.19209290E-07) { return 1.0; }
      var xpi = x * Math.PI;
      return ((Math.sin(xpi) / xpi) *  (0.54 + 0.46 * Math.cos(xpi / 1.0)));
    }
  },
  { // Lanczos, win = 2
    win: 2.0,
    filter: function (x) {
      if (x <= -2.0 || x >= 2.0) { return 0.0; }
      if (x > -1.19209290E-07 && x < 1.19209290E-07) { return 1.0; }
      var xpi = x * Math.PI;
      return (Math.sin(xpi) / xpi) * Math.sin(xpi / 2.0) / (xpi / 2.0);
    }
  },
  { // Lanczos, win = 3
    win: 3.0,
    filter: function (x) {
      if (x <= -3.0 || x >= 3.0) { return 0.0; }
      if (x > -1.19209290E-07 && x < 1.19209290E-07) { return 1.0; }
      var xpi = x * Math.PI;
      return (Math.sin(xpi) / xpi) * Math.sin(xpi / 3.0) / (xpi / 3.0);
    }
  }
];

function clampTo8(i) { return i < 0 ? 0 : (i > 255 ? 255 : i); }

function toFixedPoint(num) { return Math.round(num * ((1 << FIXED_FRAC_BITS) - 1)); }


// Calculate convolution filters for each destination point,
// and pack data to Int16Array:
//
// [ shift, length, data..., shift2, length2, data..., ... ]
//
// - shift - offset in src image
// - length - filter length (in src points)
// - data - filter values sequence
//
function createFilters(quality, srcSize, destSize, scale, offset) {

  var filterFunction = FILTER_INFO[quality].filter;

  var scaleInverted = 1.0 / scale;
  var scaleClamped  = Math.min(1.0, scale); // For upscale

  // Filter window (averaging interval), scaled to src image
  var srcWindow = FILTER_INFO[quality].win / scaleClamped;

  var destPixel, srcPixel, srcFirst, srcLast, filterElementSize,
      floatFilter, fxpFilter, total, pxl, idx, floatVal, filterTotal, filterVal;
  var leftNotEmpty, rightNotEmpty, filterShift, filterSize;

  var maxFilterElementSize = Math.floor((srcWindow + 1) * 2);
  var packedFilter    = new Int16Array((maxFilterElementSize + 2) * destSize);
  var packedFilterPtr = 0;

  // For each destination pixel calculate source range and built filter values
  for (destPixel = 0; destPixel < destSize; destPixel++) {

    // Scaling should be done relative to central pixel point
    srcPixel = (destPixel + 0.5) * scaleInverted + offset;

    srcFirst = Math.max(0, Math.floor(srcPixel - srcWindow));
    srcLast  = Math.min(srcSize - 1, Math.ceil(srcPixel + srcWindow));

    filterElementSize = srcLast - srcFirst + 1;
    floatFilter = new Float32Array(filterElementSize);
    fxpFilter = new Int16Array(filterElementSize);

    total = 0.0;

    // Fill filter values for calculated range
    for (pxl = srcFirst, idx = 0; pxl <= srcLast; pxl++, idx++) {
      floatVal = filterFunction(((pxl + 0.5) - srcPixel) * scaleClamped);
      total += floatVal;
      floatFilter[idx] = floatVal;
    }

    // Normalize filter, convert to fixed point and accumulate conversion error
    filterTotal = 0;

    for (idx = 0; idx < floatFilter.length; idx++) {
      filterVal = floatFilter[idx] / total;
      filterTotal += filterVal;
      fxpFilter[idx] = toFixedPoint(filterVal);
    }

    // Compensate normalization error, to minimize brightness drift
    fxpFilter[destSize >> 1] += toFixedPoint(1.0 - filterTotal);

    //
    // Now pack filter to useable form
    //
    // 1. Trim heading and tailing zero values, and compensate shitf/length
    // 2. Put all to single array in this format:
    //
    //    [ pos shift, data length, value1, value2, value3, ... ]
    //

    leftNotEmpty = 0;
    while (leftNotEmpty < fxpFilter.length && fxpFilter[leftNotEmpty] === 0) {
      leftNotEmpty++;
    }

    if (leftNotEmpty < fxpFilter.length) {
      rightNotEmpty = fxpFilter.length - 1;
      while (rightNotEmpty > 0 && fxpFilter[rightNotEmpty] === 0) {
        rightNotEmpty--;
      }

      filterShift = srcFirst + leftNotEmpty;
      filterSize = rightNotEmpty - leftNotEmpty + 1;

      packedFilter[packedFilterPtr++] = filterShift; // shift
      packedFilter[packedFilterPtr++] = filterSize; // size

      packedFilter.set(fxpFilter.subarray(leftNotEmpty, rightNotEmpty + 1), packedFilterPtr);
      packedFilterPtr += filterSize;
    } else {
      // zero data, write header only
      packedFilter[packedFilterPtr++] = 0; // shift
      packedFilter[packedFilterPtr++] = 0; // size
    }
  }
  return packedFilter;
}

// Convolve image in horizontal directions and transpose output. In theory,
// transpose allow:
//
// - use the same convolver for both passes (this fails due different
//   types of input array and temporary buffer)
// - making vertical pass by horisonltal lines inprove CPU cache use.
//
// But in real life this doesn't work :)
//
function convolveHorizontally(src, dest, srcW, srcH, destW, filters) {

  var r, g, b, a;
  var filterPtr, filterShift, filterSize;
  var srcPtr, srcY, destX, filterVal;
  var srcOffset = 0, destOffset = 0;

  // For each row
  for (srcY = 0; srcY < srcH; srcY++) {
    filterPtr  = 0;

    /*eslint-disable space-infix-ops*/

    // Apply precomputed filters to each destination row point
    for (destX = 0; destX < destW; destX++) {
      // Get the filter that determines the current output pixel.
      filterShift = filters[filterPtr++];
      filterSize  = filters[filterPtr++];

      srcPtr = (srcOffset + (filterShift * 4))|0;

      r = g = b = a = 0;

      // Apply the filter to the row to get the destination pixel r, g, b, a
      for (; filterSize > 0; filterSize--) {
        filterVal = filters[filterPtr++];

        // Use reverse order to workaround deopts in old v8 (node v.10)
        // Big thanks to @mraleph (Vyacheslav Egorov) for the tip.
        a = (a + filterVal * src[srcPtr + 3])|0;
        b = (b + filterVal * src[srcPtr + 2])|0;
        g = (g + filterVal * src[srcPtr + 1])|0;
        r = (r + filterVal * src[srcPtr])|0;
        srcPtr = (srcPtr + 4)|0;
      }

      // Bring this value back in range. All of the filter scaling factors
      // are in fixed point with FIXED_FRAC_BITS bits of fractional part.
      //
      // (!) Add 1/2 of value before clamping to get proper rounding. In other
      // case brightness loss will be noticeable if you resize image with white
      // border and place it on white background.
      //
      dest[destOffset + 3] = clampTo8((a + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      dest[destOffset + 2] = clampTo8((b + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      dest[destOffset + 1] = clampTo8((g + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      dest[destOffset]     = clampTo8((r + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      destOffset = (destOffset + srcH * 4)|0;
    }

    destOffset = ((srcY + 1) * 4)|0;
    srcOffset  = ((srcY + 1) * srcW * 4)|0;
  }
}

// Technically, convolvers are the same. But input array and temporary
// buffer can be of different type (especially, in old browsers). So,
// keep code in separate functions to avoid deoptimizations & speed loss.

function convolveVertically(src, dest, srcW, srcH, destW, filters) {

  var r, g, b, a;
  var filterPtr, filterShift, filterSize;
  var srcPtr, srcY, destX, filterVal;
  var srcOffset = 0, destOffset = 0;

  // For each row
  for (srcY = 0; srcY < srcH; srcY++) {
    filterPtr  = 0;

    /*eslint-disable space-infix-ops*/

    // Apply precomputed filters to each destination row point
    for (destX = 0; destX < destW; destX++) {
      // Get the filter that determines the current output pixel.
      filterShift = filters[filterPtr++];
      filterSize  = filters[filterPtr++];

      srcPtr = (srcOffset + (filterShift * 4))|0;

      r = g = b = a = 0;

      // Apply the filter to the row to get the destination pixel r, g, b, a
      for (; filterSize > 0; filterSize--) {
        filterVal = filters[filterPtr++];

        // Use reverse order to workaround deopts in old v8 (node v.10)
        // Big thanks to @mraleph (Vyacheslav Egorov) for the tip.
        a = (a + filterVal * src[srcPtr + 3])|0;
        b = (b + filterVal * src[srcPtr + 2])|0;
        g = (g + filterVal * src[srcPtr + 1])|0;
        r = (r + filterVal * src[srcPtr])|0;
        srcPtr = (srcPtr + 4)|0;
      }

      // Bring this value back in range. All of the filter scaling factors
      // are in fixed point with FIXED_FRAC_BITS bits of fractional part.
      //
      // (!) Add 1/2 of value before clamping to get proper rounding. In other
      // case brightness loss will be noticeable if you resize image with white
      // border and place it on white background.
      //
      dest[destOffset + 3] = clampTo8((a + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      dest[destOffset + 2] = clampTo8((b + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      dest[destOffset + 1] = clampTo8((g + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      dest[destOffset]     = clampTo8((r + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      destOffset = (destOffset + srcH * 4)|0;
    }

    destOffset = ((srcY + 1) * 4)|0;
    srcOffset  = ((srcY + 1) * srcW * 4)|0;
  }
}


function resetAlpha(dst, width, height) {
  var ptr = 3, len = (width * height * 4)|0;
  while (ptr < len) { dst[ptr] = 0xFF; ptr = (ptr + 4)|0; }
}


function resize(options) {
  var src   = options.src;
  var srcW  = options.width;
  var srcH  = options.height;
  var destW = options.toWidth;
  var destH = options.toHeight;
  var scaleX = options.scaleX || options.toWidth / options.width;
  var scaleY = options.scaleY || options.toHeight / options.height;
  var offsetX = options.offsetX || 0;
  var offsetY = options.offsetY || 0;
  var dest  = options.dest || new Uint8Array(destW * destH * 4);
  var quality = typeof options.quality === 'undefined' ? 3 : options.quality;
  var alpha = options.alpha || false;

  if (srcW < 1 || srcH < 1 || destW < 1 || destH < 1) { return []; }

  var filtersX = createFilters(quality, srcW, destW, scaleX, offsetX),
      filtersY = createFilters(quality, srcH, destH, scaleY, offsetY);

  var tmp  = new Uint8Array(destW * srcH * 4);

  // To use single function we need src & tmp of the same type.
  // But src can be CanvasPixelArray, and tmp - Uint8Array. So, keep
  // vertical and horizontal passes separately to avoid deoptimization.

  convolveHorizontally(src, tmp, srcW, srcH, destW, filtersX);
  convolveVertically(tmp, dest, srcH, destW, destH, filtersY);

  // That's faster than doing checks in convolver.
  // !!! Note, canvas data is not premultipled. We don't need other
  // alpha corrections.

  if (!alpha) {
    resetAlpha(dest, destW, destH);
  }

  return dest;
}

  return resize;
})();// glur/mono16
// https://github.com/nodeca/glur
// License: MIT
// Andrey Tupitsin @anrd83
// Alexander Rodin @a-rodin
// Vitaly Puzrin @puzrin


// Calculate Gaussian blur of an image using IIR filter
// The method is taken from Intel's white paper and code example attached to it:
// https://software.intel.com/en-us/articles/iir-gaussian-blur-filter
// -implementation-using-intel-advanced-vector-extensions

var blurMono16 = (function() {

var a0, a1, a2, a3, b1, b2, left_corner, right_corner;

function gaussCoef(sigma) {
  if (sigma < 0.5) {
    sigma = 0.5;
  }

  var a = Math.exp(0.726 * 0.726) / sigma,
      g1 = Math.exp(-a),
      g2 = Math.exp(-2 * a),
      k = (1 - g1) * (1 - g1) / (1 + 2 * a * g1 - g2);

  a0 = k;
  a1 = k * (a - 1) * g1;
  a2 = k * (a + 1) * g1;
  a3 = -k * g2;
  b1 = 2 * g1;
  b2 = -g2;
  left_corner = (a0 + a1) / (1 - b1 - b2);
  right_corner = (a2 + a3) / (1 - b1 - b2);

  // Attempt to force type to FP32.
  return new Float32Array([ a0, a1, a2, a3, b1, b2, left_corner, right_corner ]);
}

function convolveMono16(src, out, line, coeff, width, height) {
  // takes src image and writes the blurred and transposed result into out

  var prev_src, curr_src, curr_out, prev_out, prev_prev_out;
  var src_index, out_index, line_index;
  var i, j;
  var coeff_a0, coeff_a1, coeff_b1, coeff_b2;

  for (i = 0; i < height; i++) {
    src_index = i * width;
    out_index = i;
    line_index = 0;

    // left to right
    prev_src = src[src_index];
    prev_prev_out = prev_src * coeff[6];
    prev_out = prev_prev_out;

    coeff_a0 = coeff[0];
    coeff_a1 = coeff[1];
    coeff_b1 = coeff[4];
    coeff_b2 = coeff[5];

    for (j = 0; j < width; j++) {
      curr_src = src[src_index];

      curr_out = curr_src * coeff_a0 +
                 prev_src * coeff_a1 +
                 prev_out * coeff_b1 +
                 prev_prev_out * coeff_b2;

      prev_prev_out = prev_out;
      prev_out = curr_out;
      prev_src = curr_src;

      line[line_index] = prev_out;
      line_index++;
      src_index++;
    }

    src_index--;
    line_index--;
    out_index += height * (width - 1);

    // right to left
    prev_src = src[src_index];
    prev_prev_out = prev_src * coeff[7];
    prev_out = prev_prev_out;
    curr_src = prev_src;

    coeff_a0 = coeff[2];
    coeff_a1 = coeff[3];

    for (j = width - 1; j >= 0; j--) {
      curr_out = curr_src * coeff_a0 +
                 prev_src * coeff_a1 +
                 prev_out * coeff_b1 +
                 prev_prev_out * coeff_b2;

      prev_prev_out = prev_out;
      prev_out = curr_out;

      prev_src = curr_src;
      curr_src = src[src_index];

      out[out_index] = line[line_index] + prev_out;

      src_index--;
      line_index--;
      out_index -= height;
    }
  }
}


function blurMono16(src, width, height, radius) {
  // Quick exit on zero radius
  if (!radius) { return; }

  var out      = new Uint16Array(src.length),
      tmp_line = new Float32Array(Math.max(width, height));

  var coeff = gaussCoef(radius);

  convolveMono16(src, out, tmp_line, coeff, width, height, radius);
  convolveMono16(out, src, tmp_line, coeff, height, width, radius);
}

  return blurMono16
})();// Unsharp mask filter
//
// http://stackoverflow.com/a/23322820/1031804
// USM(O) = O + (2 * (Amount / 100) * (O - GB))
// GB - gaussian blur.
//
// Image is converted from RGB to HSL, unsharp mask is applied to the
// lightness channel and then image is converted back to RGB.

unsharpImage = (function() {

'use strict';

function getLightness(img, width, height) {
  var size = width * height;
  var out = new Uint16Array(size);
  var r, g, b, min, max;
  for (var i = 0; i < size; i++) {
    r = img[4 * i];
    g = img[4 * i + 1];
    b = img[4 * i + 2];
    max = (r >= g && r >= b) ? r : (g >= b && g >= r) ? g : b;
    min = (r <= g && r <= b) ? r : (g <= b && g <= r) ? g : b;
    out[i] = (max + min) * 257 >> 1;
  }
  return out;
}

function unsharp(img, width, height, amount, radius, threshold) {
  var r, g, b;
  var h, s, l;
  var min, max;
  var m1, m2, hShifted;
  var diff, iTimes4;

  if (amount === 0 || radius < 0.5) {
    return;
  }
  if (radius > 2.0) {
    radius = 2.0;
  }

  var lightness = getLightness(img, width, height);

  var blured = new Uint16Array(lightness); // copy, because blur modify src

  blurMono16(blured, width, height, radius);

  /* eslint-disable space-infix-ops */
  var amountFp = (amount / 100 * 0x1000 + 0.5)|0;
  var thresholdFp = (threshold * 257)|0;

  var size = width * height;

  for (var i = 0; i < size; i++) {
    diff = 2 * (lightness[i] - blured[i]);

    if (Math.abs(diff) >= thresholdFp) {
      iTimes4 = i * 4;
      r = img[iTimes4];
      g = img[iTimes4 + 1];
      b = img[iTimes4 + 2];

      // convert RGB to HSL
      // take RGB, 8-bit unsigned integer per each channel
      // save HSL, H and L are 16-bit unsigned integers, S is 12-bit unsigned integer
      // math is taken from here: http://www.easyrgb.com/index.php?X=MATH&H=18
      // and adopted to be integer (fixed point in fact) for sake of performance
      max = (r >= g && r >= b) ? r : (g >= r && g >= b) ? g : b; // min and max are in [0..0xff]
      min = (r <= g && r <= b) ? r : (g <= r && g <= b) ? g : b;
      l = (max + min) * 257 >> 1; // l is in [0..0xffff] that is caused by multiplication by 257

      if (min === max) {
        h = s = 0;
      } else {
        s = (l <= 0x7fff) ?
          (((max - min) * 0xfff) / (max + min))|0 :
          (((max - min) * 0xfff) / (2 * 0xff - max - min))|0; // s is in [0..0xfff]
        // h could be less 0, it will be fixed in backward conversion to RGB, |h| <= 0xffff / 6
        h = (r === max) ? (((g - b) * 0xffff) / (6 * (max - min)))|0
          : (g === max) ? 0x5555 + ((((b - r) * 0xffff) / (6 * (max - min)))|0) // 0x5555 == 0xffff / 3
          : 0xaaaa + ((((r - g) * 0xffff) / (6 * (max - min)))|0); // 0xaaaa == 0xffff * 2 / 3
      }

      // add unsharp mask mask to the lightness channel
      l += (amountFp * diff + 0x800) >> 12;
      if (l > 0xffff) {
        l = 0xffff;
      } else if (l < 0) {
        l = 0;
      }

      // convert HSL back to RGB
      // for information about math look above
      if (s === 0) {
        r = g = b = l >> 8;
      } else {
        m2 = (l <= 0x7fff) ? (l * (0x1000 + s) + 0x800) >> 12 :
          l  + (((0xffff - l) * s + 0x800) >>  12);
        m1 = 2 * l - m2 >> 8;
        m2 >>= 8;
        // save result to RGB channels
        // R channel
        hShifted = (h + 0x5555) & 0xffff; // 0x5555 == 0xffff / 3
        r = (hShifted >= 0xaaaa) ? m1 // 0xaaaa == 0xffff * 2 / 3
          : (hShifted >= 0x7fff) ?  m1 + ((m2 - m1) * 6 * (0xaaaa - hShifted) + 0x8000 >> 16)
          : (hShifted >= 0x2aaa) ? m2 // 0x2aaa == 0xffff / 6
          : m1 + ((m2 - m1) * 6 * hShifted + 0x8000 >> 16);
        // G channel
        hShifted = h & 0xffff;
        g = (hShifted >= 0xaaaa) ? m1 // 0xaaaa == 0xffff * 2 / 3
          : (hShifted >= 0x7fff) ?  m1 + ((m2 - m1) * 6 * (0xaaaa - hShifted) + 0x8000 >> 16)
          : (hShifted >= 0x2aaa) ? m2 // 0x2aaa == 0xffff / 6
          : m1 + ((m2 - m1) * 6 * hShifted + 0x8000 >> 16);
        // B channel
        hShifted = (h - 0x5555) & 0xffff;
        b = (hShifted >= 0xaaaa) ? m1 // 0xaaaa == 0xffff * 2 / 3
          : (hShifted >= 0x7fff) ?  m1 + ((m2 - m1) * 6 * (0xaaaa - hShifted) + 0x8000 >> 16)
          : (hShifted >= 0x2aaa) ? m2 // 0x2aaa == 0xffff / 6
          : m1 + ((m2 - m1) * 6 * hShifted + 0x8000 >> 16);
      }

      img[iTimes4] = r;
      img[iTimes4 + 1] = g;
      img[iTimes4 + 2] = b;
    }
  }
}

unsharp.lightness = getLightness
return unsharp;

})();if (this.Editor) {
  Editor.Worker = function(editor, data, callback) {
    if (!editor.workers) {
      editor.workers = [];
      editor.idleWorkers = [];
      editor.workerQueue = [];
    }

    var worker = editor.idleWorkers.pop()
    if (!worker) {
      if (editor.workers.length < Editor.Worker.max) {
        var worker = new Worker('worker.images.js');
        editor.workers.push(worker);
      } else {
        editor.workerQueue.push(data, callback)
      }
    }
    if (worker)
      Editor.Worker.process(editor, worker, data, callback)
    return editor.worker;
  }
  Editor.Worker.max  = 2;

  Editor.Worker.process = function(editor, worker, data, callback) {
    var listener = function(e) {
      callback.call(editor, e.data)

      worker.removeEventListener('message', listener);

      var cb = editor.workerQueue.pop()
      if (cb) {
        Editor.Worker.process(editor, worker, editor.workerQueue.pop(), cb)
      } else {
        editor.idleWorkers.push(worker)
        clearTimeout(editor.killWorkers)
        editor.killWorkers = setTimeout(function() {
          editor.idleWorkers.forEach(function(worker, index) {
            if (index > 0) {
              var i = editor.workers.indexOf(worker)
              if (i > -1) 
                editor.workers.splice(i, 1)
              worker.terminate()
            }
          });
          editor.idleWorkers = []
        }, 5000)
      }
    };
    worker.addEventListener('message', listener);
    worker.postMessage(data)
  }
} else {
  self.addEventListener('message', function(e) {
    var data = e.data;

    var palette = Palette(data)

    // send data to main thread to put unto canvas
    postMessage(palette.toString());
  }, false);
}

