


Editor.Image = function(editor, image, onImageProcessed, onImageLoaded) {
  if (!image.tagName) {
    var file = image;
    var image = new Image;
  } 

  if (!image.getAttribute('uid')) 
  image.setAttribute('uid', ++Editor.Image.uid);


  var timestart = new Date;
  onImageReady = function() {
    var canvas = document.createElement('canvas');
    var width = image.naturalWidth || width;
    var height = image.naturalHeight || height;
    canvas.width = width;
    canvas.height = height;

    if (onImageLoaded)
      onImageLoaded.call(editor, image)
    var ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, width, height);
    var data = ctx.getImageData(0, 0, width, height);
    if (file)
      console.log('Image loaded in: ', new Date - timestart, 'ms. ' + width + 'x' +  height)
    
    Editor.Worker(editor, data, function(result) {

      console.log('Image processed in: ', new Date - timestart, 'ms. ' + width + 'x' +  height)

      onImageProcessed.call(editor, result, image)
    });
  }
  if (file) {
    image.onload =onImageReady
    image.src = URL.createObjectURL(file);
  } else if (image.complete)
    onImageReady()

  return image;
}
Editor.Image.uid = 0

Editor.Image.applyChanges = function(data, image) {
  image.setAttribute('palette', data);
  
  if (!Editor.Image.style) {


    Editor.Image.style = document.createElement('style')
    document.body.appendChild(Editor.Image.style);
  }

  var generator = Palette(image)
  var result = generator('M+V')
  Editor.Image.style.textContent += result.toString('.content section.has-palette-' + image.getAttribute('uid'))
}


Editor.Image.insert = function(img) {
  this.getSelection().getRanges()[0].insertNode(new CKEDITOR.dom.element(img))
}