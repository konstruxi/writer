


var style = document.createElement('style')
document.body.appendChild(style);


Editor.Image = function(image) {
  if (image.getAttribute('uid')) 
    return image;
  image.setAttribute('uid', ++Editor.Image.uid)
  image.onload = function() {
  }
  if (image.complete)
    Editor.Image.process(image)
  else
    image.onload = Editor.Image.process
}
Editor.Image.uid = 0

Editor.Image.process = function(image) {
  if (this.tagName == 'IMG')
    image = this;

  var generator = Palette(image)
  console.log(generator.toString())
  var result = generator('DV+V')
  style.textContent += result.toString('.content section.has-palette-' + image.getAttribute('uid'))
}


var images = document.getElementsByTagName('img');
for (var i = 0, image; image = images[i++];) {
  Editor.Image(image)
}