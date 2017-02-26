Editor.Container = function(editor) {
  editor.onWindowScroll = function() {
    Editor.Container.onScroll(editor)
  };
  editor.onWindowResize =  function() {
    Editor.Container.onResize(editor)
  };

  window.addEventListener('scroll', editor.onWindowScroll)
  window.addEventListener('resize', editor.onWindowResize)
  editor.on('contentDom', function() {
    Editor.Container.measure(editor);
  })
  Editor.Container.onResize(editor, true)
  Editor.Container.onScroll(editor)
}

Editor.Container.detach = function(editor) {
  window.removeEventListener('scroll', editor.onWindowScroll)
  window.removeEventListener('resize', editor.onWindowResize)
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
    editor.snapshot.updateVisibility(true)
  Editor.Chrome.update(editor, true)
}

Editor.Container.measure = function(editor, scroll) {
  if (!scroll) {
    editor.offsetHeight = editor.element.$.offsetHeight;
    editor.offsetWidth  = editor.element.$.offsetWidth;
    editor.offsetTop    = editor.element.$.offsetTop;
    editor.offsetLeft   = editor.element.$.offsetLeft;
    for (var offsetParent = editor.element.$; offsetParent = offsetParent.offsetParent;) {
      editor.offsetTop += offsetParent.offsetTop;
      editor.offsetLeft += offsetParent.offsetLeft;
    }
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



Editor.Container.isBoxIntersecting = function(box, another) {
  if (!another || !box) return false;
  var top = box.currentTop != null ? box.currentTop : box.top;
  var height = box.currentHeight != null ? box.currentHeight : box.height;
  var bottom = top + height
  var topmost = another.top 
  var bottomost = another.top + another.height;

  var left = box.currentLeft != null ? box.currentLeft : box.left;
  var width = box.currentWidth != null ? box.currentWidth : box.width;
  var right = left + width
  var leftmost = another.left
  var rightmost = another.left + another.width;

  return ((top >= topmost  && top    <= bottomost)
    || (bottom >= topmost  && bottom <= bottomost)
    ||    (top <= topmost  && bottom >= bottomost))
    &&  ((left >= leftmost && left   <= rightmost)
    ||  (right >= leftmost && right  <= rightmost)
    ||   (left <= leftmost && right  >= rightmost))

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
