


Editor.Image = function(editor, image, onImageProcessed, onImageLoaded, arg) {
  if (!editor) return;
  if (!image.tagName) {
    var file = image;
    var image = new Image;
  } 
  editor.fire('lockSnapshot');

  if (!image.getAttribute('uid')) {
    image.setAttribute('uid', Math.floor(Math.random() * 100000000000000));
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


  var width = parseInt(image.getAttribute('width'));
  var height = parseInt(image.getAttribute('height'));

  image.setAttribute('crop-x', data.square.x);
  image.setAttribute('crop-y', data.square.y);
  //image.setAttribute('crop-width', data.square.width);
  //image.setAttribute('crop-height', data.square.height);

  image.parentNode.classList.add('processed')

  var generator = Palette(image)
  var uid = image.getAttribute('uid');
  Editor.Style.store(this, 'palette', uid, generator)
  var schema = Editor.Style.get(this, section, 'schema', 'DV_V');
  var result = generator(schema)

  if (height >= width * 1.2) {
    image.parentNode.classList.add('portrait');
  } else if (width >= height * 1.2) {
    image.parentNode.classList.add('landscape');
  }
  var min = Math.min(parseInt(image.getAttribute('width')), parseInt(image.getAttribute('height')));
  
  //image.style.width  = width + 'px';
  //image.style.maxHeight = height + 'px';
  section.setAttribute('palette', uid);
  //Editor.Style(this, section, 'palette', uid)

  Editor.Image.crop(image);

  var section = Editor.Section.get(image);
  if (section) {
    Editor.Section.analyze(this, section)
    this.snapshot = this.snapshot.animate()
  }
  this.fire('unlockSnapshot')
}

Editor.Image.crop = function(image) {
  var cropX = parseInt(image.getAttribute('crop-x'));
  var cropY = parseInt(image.getAttribute('crop-y'));
  var width = parseInt(image.getAttribute('width'));
  var height = parseInt(image.getAttribute('height'));
  var uid = image.getAttribute('uid');
  var ratio = width > height ? width / height : height / width;
  Editor.Style.write(null, null, 'picture[uid="' + uid + '"]', function() {
    return '.content section.small img[uid="' + uid + '"], .sitemap header:not(:target) section img[uid="' + uid + '"] {' + 
      'left: -' + cropX / width * ratio * 100 + '%; ' +
      'top: -' + cropY / height * ratio * 100 + '%; ' +
      'width: ' + (height < width ? ratio : 1) * 100 + '%; ' +
    '}\n picture[uid="' + uid + '"]:before {\n' +
    'padding-top: ' + parseFloat(((height / width) * 100).toFixed(3)) + '%; }\n'
  });
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
