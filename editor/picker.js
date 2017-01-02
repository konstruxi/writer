Editor.Picker = function(editor, section, type, callback) {
  editor.currentSection = section;
  if (!editor.picker) {
    editor.picker = document.createElement('div');
    editor.picker.classList.add('picker');
  } else {
    while (editor.picker.lastChild)
      editor.picker.removeChild(editor.picker.lastChild)
  }
  if (!editor.pickerStyles) {
    editor.pickerStyles = document.createElement('style');
    document.body.appendChild(editor.pickerStyles)
  }
  editor.picker.setAttribute('type', type);
  var offsetWidth = section.offsetWidth;
  var offsetHeight = section.offsetHeight;
  var containers = [];
  var styles = '';
  for (var x = 0; x < 3; x++) {
    for (var y = 0; y < 3; y++) {
      var clone = section.cloneNode(true)
      var container = document.createElement('div');
      clone.id = 'clone-' + x + '-' + y
      container.classList.add('content')
      container.classList.add('preview')
      container.appendChild(clone)
      editor.picker.appendChild(container);
      clone.style.cssText = ''

      container.style.left = x * 33.3333 + '%';
      container.style.top = y * 33.3333 + '%';
      clone.style.width = offsetWidth + 'px';
      clone.style.height = offsetHeight + 'px';
      clone.classList.add('clone');
      var colors = callback(editor, section, clone, x - 1, y - 1);
      container.setAttribute('value', colors.x + '_' + colors.y)
      styles += colors.toString('clone#' + clone.id) + '\n'

      containers.push(container)
    }
    editor.picker.removeAttribute('hidden', 'hidden')
  }
  editor.pickerStyles.textContent = styles

  document.body.appendChild(editor.picker);
  requestAnimationFrame(function() {
    var text  = editor.picker.querySelector('h1,h2,h3,ul,ol,p') || editor.picker.querySelector('picture');
    var offsetLeft = text ? text.offsetLeft : 50;
    var offsetTop = text ? text.offsetTop : 50;
    for (var i = 0; i < containers.length; i++) {
      containers[i].scrollTop = offsetTop - 50;
      containers[i].scrollLeft = offsetLeft - 50;
    }
  })
};

Editor.Picker.Schema = function(editor, section, clone, x, y) {
  var palette = Editor.Style.get(editor, section, 'palette');
  var generator = Editor.Style.retrieve(editor, 'palette', palette)
  var schema = Editor.Style.get(editor, section, 'schema')
  return generator(schema, x, y, true)
}

Editor.Picker.choose = function(editor, section) {
  editor.picker.setAttribute('hidden', 'hidden')
  Editor.Style.set(editor, editor.currentSection, 
                   editor.picker.getAttribute('type'), 
                   section.getAttribute('value'), null,
                   editor.currentSection.classList.contains('starred'))
  editor.currentSection = null;
}