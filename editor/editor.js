document.documentElement.className += 
    (("ontouchstart" in document.documentElement) ? ' touch' : ' no-touch');





function Editor(content) {
  // Turn off automatic editor creation first.
  CKEDITOR.disableAutoInline = true;
  var editor = CKEDITOR.inline(content, {
    floatSpaceDockedOffsetY: 10
  });

  editor.on('loaded', function() {
    Editor.Commands(editor, content)
    Editor.DTD(editor, content);
    Editor.Section.observe(editor);
  }, null, null, -100)
  editor.on('contentDom', function() {
    var images = editor.element.$.getElementsByTagName('img');
    for (var i = 0, image; image = images[i++];) {
      Editor.Image(editor, image, Editor.Image.applyChanges)
    }
  })

  Editor.Keys(editor, content)
  Editor.Clipboard(editor, content)
  Editor.Chrome(editor, content)
  Editor.Container(editor, content)
  Editor.Selection(editor, content)
  Editor.Drag(editor, content)


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
  