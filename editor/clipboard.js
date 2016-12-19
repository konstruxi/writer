Editor.Clipboard = function(editor) {
  editor.on('paste', function(e) {
    if (e.data.method == 'drop') return;
    console.log(e.data.dataValue)
    // disallow pasting block content into paragraphs and headers
    if (e.data.type == 'html' && e.data.dataValue.match(/<(?:li|h1|h2|h3|p|ul|li|blockquote|picture|img)/i)) {
      Editor.Selection.moveToEditablePlace(editor);
    }
    //Editor.Selection.onChange(editor, true)
  })

  editor.on('beforePaste', function(e) {

    var files = false;
    if (e.data.dataTransfer.$ && e.data.dataTransfer.$.items)
      Array.prototype.forEach.call(e.data.dataTransfer.$.items, function(item) {
        var file = item.getAsFile();
        if (file) {
          files = true;
          console.info('Loading one file!')
          Editor.Image(editor, file, Editor.Image.applyChanges, Editor.Image.insert);
        }
      });
    if (files)
      return false;
    //snapshotStyles(editor)

    var html = e.data.dataTransfer.getData('text/html')
    console.error('beforepaste', html)
    console.error('beforepaste', e.data.dataTransfer.getData('text/plain'))
    var data = e.data.dataTransfer.getData('text/plain');
    if (data.match(/^\s*(?:https?|mailto):\/\/[^\s]+\s*$/)) {
      var selection = editor.getSelection();
      var range = selection.getRanges()[0];
      if (range) {
        setLink(editor, data)
        return false
      }
    }
  })
  editor.on('paste', function(e) {
    //snapshotStyles(editor)
    var data = e.data.dataValue;
    if (data && data.match(/^\s*(?:https?|mailto):\/\/[^\s]+\s*$/)) {
      var selection = editor.getSelection();
      var range = selection.getRanges()[0];
      if (range) {
        setLink(editor, data)
        return false
      }
    }
  })
}