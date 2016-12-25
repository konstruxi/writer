


Editor.Image = function(editor, image, onImageProcessed, onImageLoaded, arg) {
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
  } else if (image.complete && image.src) {
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

Editor.Image.proxy = function(editor, src, callback) {
  var x = new XMLHttpRequest();
  x.open('GET', 'http://cors-anywhere.herokuapp.com/' + src);
  x.responseType = 'blob';
  x.onload = callback;
  x.send();
  if (typeof callback == 'function') {
    x.onload = callback;
  } else if (callback) {
    x.onload = function() {
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

  //image.style.width =  width + 'px';
  //image.style.height =  height + 'px';


  editor.fire('lockSnapshot');
  if (image.parentNode.classList.contains('added')) {
    editor.snapshot.invalidate(function() {
      image.setAttribute('width', width);
      image.setAttribute('height', height);
      image.parentNode.classList.remove('loading');
      image.parentNode.style.maxWidth =  width + 'px';
      image.parentNode.style.maxHeight =  height + 'px';
    })
  } else {

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
    Editor.Image.storage[image.getAttribute('uid')] = result;
    callback.call(editor, result, image)
  });
}

Editor.Image.uid = 0

Editor.Image.applyChanges = function(data, img) {
  this.fire('lockSnapshot')
  var images = this.element.$.querySelectorAll('img[uid="' + img.getAttribute('uid') + '"]');
  for (var i = 0; i < images.length; i++) {
    var image = images[i];
    image.setAttribute('palette', data.palette);
    //console.error('crops', data)
    if (!Editor.Image.style) {
      Editor.Chrome.update(this)

      Editor.Image.style = document.createElement('style')
      document.body.appendChild(Editor.Image.style);
    }

    image.setAttribute('crop-x', data.square.x);
    image.setAttribute('crop-y', data.square.y);
    image.parentNode.classList.add('processed')

    var generator = Palette(image)
    var result = generator('DV+V')

    var width = parseInt(image.getAttribute('width'));
    var height = parseInt(image.getAttribute('height'));
    var min = Math.min(parseInt(image.getAttribute('width')), parseInt(image.getAttribute('height')));
    
    //image.style.width  = width + 'px';
    //image.style.maxHeight = height + 'px';
    var ratio = width > height ? width / height : height / width;
    Editor.Image.style.textContent += result.toString('.has-palette-' + image.getAttribute('uid'))
    Editor.Image.style.textContent += '.content section[pattern*="two-"] img[uid="' + image.getAttribute('uid') + '"] {' + 
      'left: -' + data.square.x / width * ratio * 100 + '%; ' +
      'top: -' + data.square.y / height * ratio * 100 + '%; ' +
      'width: ' + (height < width ? ratio : 1) * 100 + '%; ' +
    '}'
  }
  Editor.Chrome.update(this)
  this.fire('unlockSnapshot')
}

Editor.Image.unload = function(editor, image) {
  var src = image;
  setTimeout(function() {
    URL.revokeObjectURL(src)
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

    if (container.tagName == 'H1' || container.tagName == 'H2')
      var next = container.nextElementSibling
    else
      var next = container;

    while (next && (next.tagName == 'HR' || Editor.Content.isPicture(next)))
      next = next.nextElementSibling;

    container.parentNode.insertBefore(picture, next)

    if (hard) {
      var hr = document.createElement('hr');
      container.parentNode.insertBefore(hr, picture)
    }    
  }
  //var section = Editor.Section.get(image);
  //if (section) {
  //  Editor.Section.analyze(section)
  //}
  this.fire('unlockSnapshot')
}
