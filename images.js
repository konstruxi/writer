


Editor.Image = function(editor, image, onImageProcessed, onImageLoaded) {
  if (!image.tagName) {
    var file = image;
    var image = new Image;
  } 

  if (!image.getAttribute('uid')) 
    image.setAttribute('uid', ++Editor.Image.uid);


  var timestart = new Date;
  onImageReady = function() {
    requestAnimationFrame(function() {

    var canvas = document.createElement('canvas');
    var width = parseInt(image.getAttribute('width')) || image.naturalWidth || width;
    var height = parseInt(image.getAttribute('height')) || image.naturalHeight || height;
    canvas.width = width;
    canvas.height = height;

    image.setAttribute('width', width);
    image.setAttribute('height', height);
    image.parentNode.classList.remove('loading');

    if (image.parentNode.classList.contains('added'))
      editor.snapshot.animate()

    setTimeout(function() {
      var ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, width, height);
      var data = ctx.getImageData(0, 0, width, height);
      if (file)
        console.log('Image loaded in: ', new Date - timestart, 'ms. ' + width + 'x' +  height)
      


      Editor.Worker(editor, data, function(result) {

        console.log('Image processed in: ', new Date - timestart, 'ms. ' + width + 'x' +  height)

        onImageProcessed.call(editor, result, image)
      });
    }, 10)

    })
  }
  if (file) {
    image.onload = onImageReady
    image.src = URL.createObjectURL(file);
  } else if (image.complete && image.src) {
    onImageReady()
  } else {
    image.onload = onImageReady
  }

  if (onImageLoaded)
    onImageLoaded.call(editor, image)

  return image;
}
Editor.Image.uid = 0

Editor.Image.applyChanges = function(data, image) {
  this.fire('lockSnapshot')
  image.setAttribute('palette', data.palette);
  console.error('crops', data)
  if (!Editor.Image.style) {


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
  
  image.style.maxWidth  = width + 'px';
  image.style.maxHeight = height + 'px';
  var ratio = width > height ? width / height : height / width;
  Editor.Image.style.textContent += result.toString('.content section.has-palette-' + image.getAttribute('uid'))
  Editor.Image.style.textContent += '.content section[pattern*="two-"] img[uid="' + image.getAttribute('uid') + '"] {' + 
    'left: -' + data.square.x / width * ratio * 100 + '%; ' +
    'top: -' + data.square.y / height * ratio * 100 + '%; ' +
    'width: ' + (height < width ? ratio : 1) * 100 + '%; ' +
  '}'
  
  updateToolbar(this)
  this.fire('unlockSnapshot')
}


Editor.Image.insert = function(image) {
  this.fire('lockSnapshot')
  if (!image.parentNode || !image.parentNode.tagName != 'PICTURE') {
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
    if (container.tagName == 'H1' || container.tagName == 'H2')
      container.parentNode.insertBefore(picture, container.nextSibling)
    else
      container.parentNode.insertBefore(picture, container)

  }
  var section = Editor.Section.get(image);
  if (section) {
    Editor.Section.analyze(section)
  }
  this.fire('unlockSnapshot')
}
