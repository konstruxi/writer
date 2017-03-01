


Editor.Image = function(editor, image, onImageProcessed, onImageLoaded, arg) {
  if (!editor) return;
  if (!image.tagName) {
    var file = image;
    var image = new Image;
  } 
  editor.fire('lockSnapshot');

  if (!image.getAttribute('uid')) {
    image.setAttribute('uid', ++Editor.Image.uid);
  } else if (image.parentNode.classList.contains('loading')
          || image.parentNode.classList.contains('processed')) {
    return image;
  }

  if (image.src && image.src.indexOf(':0') > -1)
    Editor.Image.proxy(editor, image.getAttribute('foreign-src'), image)
  var timestart = new Date;
  if (file) {
    image.onload = function() {
      Editor.Image.onLoaded(editor, this, onImageProcessed, file)
    }
    image.src = URL.createObjectURL(file);
    (editor.images || (editor.images = {}))[image.src] = file;
  } else if (image.complete && image.src && image.naturalWidth) {
    Editor.Image.onLoaded(editor, image, onImageProcessed)
  } else {
    image.onload = function() {
      Editor.Image.onLoaded(editor, this, onImageProcessed)
    }
  }

  if (onImageLoaded)
    onImageLoaded.call(editor, image, arg)
  editor.fire('unlockSnapshot');

  return image;
}

Editor.Image.proxy = function(editor, src, callback, dontTryFirst) {
  var x = new XMLHttpRequest();
  // try fetching youtube hires thumbnails first, if that fails use standard definition
  if (src.indexOf('ytimg.com') > -1 && src.indexOf('hqdefault') > -1 && !dontTryFirst) {
    var tryFirst = src.replace('hqdefault', 'maxresdefault')
  }
  x.open('GET', 'http://cors-anywhere.herokuapp.com/' + (tryFirst || src));
  x.responseType = 'blob';
  x.onload = callback;
  x.send();
  if (typeof callback == 'function') {
    x.onload = callback;
  } else if (callback) {
    x.onload = function() {
      if (x.status == 404 && tryFirst) {
        return Editor.Image.proxy(editor, src, callback, true);
      }
      var blob = new Blob([x.response], {type: x.getResponseHeader('Content-Type')});
      editor.fire('lockSnapshot');
      callback.src = URL.createObjectURL(blob);
      editor.fire('unlockSnapshot');
    }
  }
}
Editor.Image.storage = {}

Editor.Image.onLoaded = function(editor, image, callback, file) {

  var width = image.naturalWidth || parseInt(image.getAttribute('width')) || width;
  var height = image.naturalHeight || parseInt(image.getAttribute('height')) || height;

  if (height >= width * 1.2) {
    image.parentNode.classList.add('portrait');
  } else if (width >= height * 1.2) {
    image.parentNode.classList.add('landscape');
  }
  //image.style.width =  width + 'px';
  //image.style.height =  height + 'px';


  editor.fire('lockSnapshot');
  if (image.parentNode.classList.contains('added')) {
    editor.snapshot.invalidate(function() {
      image.parentNode.setAttribute('uid', image.getAttribute('uid'));
      image.setAttribute('width', width);
      image.setAttribute('height', height);
      image.parentNode.classList.remove('loading');
      image.parentNode.style.maxWidth =  width + 'px';
      image.parentNode.style.maxHeight =  height + 'px';
    })
  } else {
    image.parentNode.setAttribute('uid', image.getAttribute('uid'));
    image.setAttribute('width', width);
    image.setAttribute('height', height);
    image.parentNode.style.maxWidth =  width + 'px';
    image.parentNode.style.maxHeight =  height + 'px';
  }
  Editor.Image.schedule(editor, image, callback, file)

  editor.fire('unlockSnapshot');
}

Editor.Image.schedule = function(editor, image, callback, file) {
  var width = image.naturalWidth || parseInt(image.getAttribute('width'))
  var height = image.naturalHeight || parseInt(image.getAttribute('height'))
  var cache = Editor.Image.storage[image.getAttribute('uid')];
  if (cache) {
    console.log('Use cached processed data: ', 'ms. ', cache,  width + 'x' +  height)
    callback.call(editor, cache, image)
  }
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, width, height);
  var data = ctx.getImageData(0, 0, width, height);
  var timestart = new Date;
  Editor.Worker(editor, data, function(result) {
    if (result.resized) {
      console.time('Image: Drawing resized image');
      //var blob = Bitmap.createBlob(result.resized.data, result.resized.width, result.resized.height)
      var imageData = ctx.createImageData(result.resized.width, result.resized.height)
      imageData.data.set(result.resized.data);
      image.setAttribute('width', result.resized.width);
      image.setAttribute('height', result.resized.height)
      canvas.width = result.resized.width;
      canvas.height = result.resized.height;
      ctx.putImageData(imageData, 0, 0)
      debugger
      if (canvas.toBlob) {

        var blob = canvas.toBlob(function(blob) {
          debugger
          blob.name = editor.images[image.src].name
          blob.lastModified = editor.images[image.src].lastModified
          URL.revokeObjectURL(image.src);
          delete editor.images[image.src];
          image.src = URL.createObjectURL(blob);
          editor.images[image.src] = blob;
          console.timeEnd('Image: Drawing resized image');
        }, 'image/png', 0.95)
      } else {
//        image.src = canvas.toDataURL('image/png', 0.95);
          console.timeEnd('Image: Drawing resized image');
      }
      canvas = ctx = imageData = null;
      result.resized = null;
    }
    Editor.Image.storage[image.getAttribute('uid')] = result;
    callback.call(editor, result, image)
  });
}

Editor.Image.uid = 0

Editor.Image.applyChanges = function(data, image) {
  this.fire('lockSnapshot')
  image.setAttribute('palette', data.palette);
  var section = Editor.Section.get(image);
  
  //console.error('crops', data)

  image.setAttribute('crop-x', data.square.x);
  image.setAttribute('crop-y', data.square.y);
  image.parentNode.classList.add('processed')

  var generator = Palette(image)
  var uid = image.getAttribute('uid');
  Editor.Style.store(this, 'palette', uid, generator)
  var schema = Editor.Style.get(this, section, 'schema', 'DV_V');
  var result = generator(schema)

  var width = parseInt(image.getAttribute('width'));
  var height = parseInt(image.getAttribute('height'));

  if (height >= width * 1.2) {
    image.parentNode.classList.add('portrait');
  } else if (width >= height * 1.2) {
    image.parentNode.classList.add('landscape');
  }
  var min = Math.min(parseInt(image.getAttribute('width')), parseInt(image.getAttribute('height')));
  
  //image.style.width  = width + 'px';
  //image.style.maxHeight = height + 'px';
  var ratio = width > height ? width / height : height / width;
  var styles = {};

  section.setAttribute('palette', uid);
  //Editor.Style(this, section, 'palette', uid)

  styles['picture[uid="' + uid + '"]'] = '.content section.small img[uid="' + uid + '"] {' + 
    'left: -' + data.square.x / width * ratio * 100 + '%; ' +
    'top: -' + data.square.y / height * ratio * 100 + '%; ' +
    'width: ' + (height < width ? ratio : 1) * 100 + '%; ' +
  '}\n picture[uid="' + uid + '"]:before {\n' +
  'padding-top: ' + parseFloat(((height / width) * 100).toFixed(3)) + '%; }\n'

  Editor.Style.write(this, section, styles);

  var section = Editor.Section.get(image);
  if (section) {
    Editor.Section.analyze(this, section)
    this.snapshot = this.snapshot.animate()
  }
  this.fire('unlockSnapshot')
}


Editor.Image.unload = function(editor, image) {
  var src = image.src;
  setTimeout(function() {
    URL.revokeObjectURL(src)
    if (editor.images)
      editor.images[src] = undefined
  }, 2000);
}

Editor.Image.register = function(editor, image) {
  Editor.Image(editor, image, Editor.Image.applyChanges)
}

Editor.Image.insert = function(image, hard) {
  this.fire('lockSnapshot')
  if (!image.parentNode || image.parentNode.tagName != 'PICTURE') {
    var picture = document.createElement('picture');
    picture.classList.add('added')
    if (image.parentNode)
      image.parentNode.replaceChild(picture, image);
    picture.appendChild(image)
  } else {
    var picture = image.parentNode;
  }
  picture.classList.add('loading')
  while (image.parentNode)
    image = image.parentNode;
  if (image != document) {
    var container = this.getSelection().getRanges()[0].startContainer.$;
    while (container.parentNode.tagName != 'SECTION')
      container = container.parentNode;
    if (hard) {
      hard = container.parentNode.getElementsByTagName('picture')[0];
    }

    //if (container.tagName == 'H1' || container.tagName == 'H2')
      var next = container.nextElementSibling
    //else
    //  var next = container;

    while (next && (next.tagName == 'HR' || Editor.Content.isPicture(next)))
      next = next.nextElementSibling;

    container.parentNode.insertBefore(picture, next)

    if (hard) {
      var hr = document.createElement('hr');
      hr.className = 'small'
      container.parentNode.insertBefore(hr, picture)
    }    
  }
  //var section = Editor.Section.get(image);
  //if (section) {
  //  Editor.Section.analyze(section)
  //}
  this.fire('unlockSnapshot')
};


// Bitmap.js: Create bitmap from data blob
// https://github.com/uupaa/Bitmap.js/blob/master/lib/Bitmap.js
(function(global) {
"use strict";

// --- dependency modules ----------------------------------
//var Hash = global["Hash"];
//var Task = global["Task"];
//var Thread = global["Thread"];
//var TypedArray = global["TypedArray"];

// --- define / local variables ----------------------------
//var _isNodeOrNodeWebKit = !!global.global;
//var _runOnNodeWebKit =  _isNodeOrNodeWebKit &&  /native/.test(setTimeout);
//var _runOnNode       =  _isNodeOrNodeWebKit && !/native/.test(setTimeout);
//var _runOnWorker     = !_isNodeOrNodeWebKit && "WorkerLocation" in global;
//var _runOnBrowser    = !_isNodeOrNodeWebKit && "document" in global;

// --- class / interfaces ----------------------------------
var Bitmap = {
    "createBlob":   Bitmap_createBlob,      // Bitmap.createBlob(source:Uint8Array|Uint8ClampedArray, width:UINT16, height:UINT16):Blob

//{@dev
    "repository":   "https://github.com/uupaa/Bitmap.js", // GitHub repository URL. http://git.io/Help
//}@dev
};

// --- implements ------------------------------------------
function Bitmap_createBlob(source,   // @arg Uint8Array|Uint8ClampedArray
                           width,    // @arg UINT16 - bitmap width (need align 4)
                           height) { // @arg UINT16 - bitmap width (need align 4)
                                     // @ret Blob
    function _toUINT32L(v) { // UINT32 little endian
        return [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >>> 24) & 0xff];
    }
    function _toINT32L(v) { // INT32 little endian
        return [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff];
    }

    var BMP_HEADER_SIZE = 14;  // BITMAPFILEHEADER
    var DIB_HEADER_SIZE = 124; // BITMAPV5HEADER
    var DATA_OFFSET     = BMP_HEADER_SIZE + DIB_HEADER_SIZE;
    var DATA_SIZE       = source.length + 0; // including padding
    var FILE_SIZE       = BMP_HEADER_SIZE + DIB_HEADER_SIZE + DATA_SIZE;
    var NEGATIVE_HEIGHT = (~height) + 1;
    var SIGNATURE       = [0x42, 0x4d]; // "BM"

    var header = new Uint8Array(BMP_HEADER_SIZE + DIB_HEADER_SIZE);

    header.set(
        [].concat(
            // --- BITMAPFILEHEADER ---
            SIGNATURE,                  // bfType
            _toUINT32L(FILE_SIZE),      // bfSize
            [0x00, 0x00],               // bfReserved1
            [0x00, 0x00],               // bfReserved2
            _toUINT32L(DATA_OFFSET),    // bfOffBits
            // --- BITMAPV5HEADER ---
            _toUINT32L(DIB_HEADER_SIZE),// biSize
            _toUINT32L(width),          // biWidth
            _toINT32L(NEGATIVE_HEIGHT), // biHeight
            [0x01, 0x00],               // biPlanes
            [0x20, 0x00],               // biBitCount - 0x20 = 32bit
            [0x03, 0x00, 0x00, 0x00],   // biCompression - 0x03 = BI_BITFIELDS
            _toUINT32L(DATA_SIZE),      // biSizeImage
            [0x13, 0x0b, 0x00, 0x00],   // biXPixPerMeter - 0x0b13(2835) = 72DPI
            [0x13, 0x0b, 0x00, 0x00],   // biYPixPerMeter
            [0x00, 0x00, 0x00, 0x00],   // biClrUsed
            [0x00, 0x00, 0x00, 0x00],   // biCirImportant
            [0x00, 0x00, 0x00, 0xFF],   // red   bit mask(0xFF000000) RGBA
            [0x00, 0x00, 0xFF, 0x00],   // green bit mask(0x00FF0000) RGBA
            [0x00, 0xFF, 0x00, 0x00],   // blue  bit mask(0x0000FF00) RGBA
            [0xFF, 0x00, 0x00, 0x00],   // alpha bit mask(0x000000FF) RGBA
            [0x20, 0x6e, 0x69, 0x57]    // color name space - 0x57696e20 = "Win " (TODO: check)
            // remaining data all zero (TODO: check)
        ), 0);

    var blob = new Blob([ header, source ], { "type": "image/bmp" });

    return blob;
}

// --- validate / assertions -------------------------------
//{@dev
//function $valid(val, fn, hint) { if (global["Valid"]) { global["Valid"](val, fn, hint); } }
//function $type(obj, type) { return global["Valid"] ? global["Valid"].type(obj, type) : true; }
//function $keys(obj, str) { return global["Valid"] ? global["Valid"].keys(obj, str) : true; }
//function $some(val, str, ignore) { return global["Valid"] ? global["Valid"].some(val, str, ignore) : true; }
//function $args(fn, args) { if (global["Valid"]) { global["Valid"].args(fn, args); } }
//}@dev

// --- exports ---------------------------------------------
if (typeof module !== "undefined") {
    module["exports"] = Bitmap;
}
global["Bitmap" in global ? "Bitmap_" : "Bitmap"] = Bitmap; // switch module. http://git.io/Minify

})((this || 0).self || global); // WebModule idiom. http://git.io/WebModule

