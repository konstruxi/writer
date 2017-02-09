document.documentElement.className += 
    (("ontouchstart" in document.documentElement) ? ' touch' : ' no-touch');





function Editor(content, options) {
  CKEDITOR.dom.domObject.prototype.is = function() { return false}
  CKEDITOR.dom.domObject.prototype.getParent = function() { return null}
  // Turn off automatic editor creation first.
  CKEDITOR.disableAutoInline = true;

  
  var editor = CKEDITOR.inline(content, {
    floatSpaceDockedOffsetY: 10
  });

  editor.options = options

  editor.on('loaded', function() {
    Editor.Commands(editor, content)
    Editor.DTD(editor, content);
    Editor.Observer(editor);
  }, null, null, -100)
  editor.on('contentDom', function() {
    Editor.Container(editor, content)
    var images = editor.element.$.getElementsByTagName('img');
    for (var i = 0, image; image = images[i++];) {
      Editor.Image(editor, image, Editor.Image.applyChanges)
    }
  })

  Editor.Pointer(editor, content)
  Editor.Keys(editor, content)
  Editor.Clipboard(editor, content)
  Editor.Chrome(editor, content)
  Editor.Selection(editor, content)


  Editor.elements.push(content)
  Editor.editors.push(editor)

  if (!content.id)
    content.id = 'editor-' + ++Editor.uid

  return editor;
}

Editor.uid = 0;
Editor.elements = []
Editor.editors = []

Editor.get = function(el) {
  for (; el; el = el.parentNode) {
    var index = Editor.elements.indexOf(el);
    if (index > -1)
      return Editor.editors[index]
  }
}
  