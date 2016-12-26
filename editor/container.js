Editor.Container = function(editor) {
  window.addEventListener('scroll', function() {
    Editor.Container.onScroll(editor)
  })
  window.addEventListener('resize', function() {
    Editor.Container.onResize(editor)
  })
  editor.on('contentDom', function() {
    Editor.Container.measure(editor);
  })
  Editor.Container.onResize(editor, true)
  Editor.Container.onScroll(editor)
}

Editor.Container.onResize = function(editor, soft) {
  if (!editor.stylesheet) {
    editor.stylesheet = document.createElement('style');
    document.body.appendChild(editor.stylesheet)
  }
  Editor.Container.measure(editor)
  if (editor.snapshot)
    editor.snapshot.updateVisibility()
  Editor.Chrome.update(editor, true)
  if (!soft) {
    editor.snapshot = editor.snapshot.animate()
  }
}

Editor.Container.onScroll = function(editor) {
  Editor.Container.measure(editor, true)
  if (editor.snapshot)
    editor.snapshot.updateVisibility()
  Editor.Chrome.update(editor, true)
}

Editor.Container.measure = function(editor, scroll) {
  if (!scroll) {
    editor.offsetHeight = editor.element.$.offsetHeight;
    editor.offsetWidth  = editor.element.$.offsetWidth;
    editor.offsetTop    = editor.element.$.offsetTop;
    editor.offsetLeft   = editor.element.$.offsetLeft;
    editor.innerWidth   = window.innerWidth;
    editor.innerHeight  = window.innerHeight;
  }
  editor.scrollY      = window.scrollY;
  editor.box = {
    width: editor.offsetWidth,
    height: editor.offsetHeight,
    top: editor.offsetTop - window.scrollY,
    left: editor.offsetLeft - window.scrollX
  }
  editor.zoom = editor.offsetWidth / editor.box.width
}



Editor.Container.isBoxVisible = function(editor, box) {
  var top = box.top;
  var bottom = box.top + box.height
  var topmost = editor.scrollY - editor.offsetTop - editor.innerHeight / 16
  var bottomost = editor.scrollY + editor.innerHeight - editor.offsetTop + editor.innerHeight / 16;

  return ((top >= topmost && top    <= bottomost)
    || (bottom >= topmost && bottom <= bottomost)
    ||    (top <= topmost && bottom >= bottomost))

}
