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
  editor.on('instanceReady', function() {
    if (editor.doNotParseInitially) {
      editor.editable().status = 'ready';
      editor.fire( 'dataReady' );
      editor._.editable.fixInitialSelection();
      //editor.undoManager.save()
    }
  })
  editor.on('contentDom', function() {
    Editor.Container(editor, content)
    var images = editor.element.$.getElementsByTagName('img');
    for (var i = 0, image; image = images[i++];) {
      Editor.Image(editor, image, Editor.Image.applyChanges)
    }
  })

  editor.onGlobalSelectionChange = function(e) {
    if (!editor.element) return;
    if (editor.justcleaned) return;
    if (!editor.dragging) {
      clearTimeout(editor.changingselection);
      Editor.Selection.fix(editor)
      editor.changingselection = setTimeout(function() {
        Editor.Selection.onChange(editor)
      }, 30);
    }
  }

  editor.onGlobalMouseDown = function(e) {
    if (!editor.element) return;
    if (!e.target.nodeType || e.target.tagName == 'svg' || e.target.tagName == 'use' || (e.target.classList && e.target.classList.contains('toolbar'))) {
      //if (editor.focusManager.hasFocus) {
        for (var p = e.target; p; p = p.parentNode) {
          if (p == editor.element.$)
            e.preventDefault()
        }
      //}
    }
  }


  // custom events to detach dom events 
  editor.on('attachElement', function(e) {
    //editor.element.$ = e.data;
    editor.element.$.setAttribute('contenteditable', 'true');
    Editor.Pointer(editor, content)
    document.addEventListener('selectionchange', editor.onGlobalSelectionChange)

    // dont change focus/selection on button click
    document.addEventListener('mousedown', editor.onGlobalMouseDown, true)

  })
  editor.on('detachElement', function(e) {
    Editor.Content.cleanEmpty(editor, true, true);
    editor.element.$.removeAttribute('contenteditable')
    Array.prototype.forEach.call(editor.element.$.querySelectorAll('[tabindex]'), function(el) {
      el.removeAttribute('tabindex')
    })
    //editor.element.$ = null;
    editor.gestures.destroy();
    document.removeEventListener('selectionchange', editor.onGlobalSelectionChange)
    document.removeEventListener('mousedown', editor.onGlobalMouseDown)
    editor.observer.disconnect()
    Editor.Container.detach(editor)
    formatting.setAttribute('hidden', 'hidden')
    editor.destroy(true)
  })


  Editor.Keys(editor, content)
  Editor.Clipboard(editor, content)
  Editor.Chrome(editor, content)
  Editor.Selection(editor, content)
  
  editor.fire('attachElement', content);

  editor.on('focus', function() {
    if (editor.snapshot)
      editor.snapshot.options.editor = editor;
  })
  editor.on('blur', function() {
    if (editor.snapshot)
      editor.snapshot.options.editor = null;
  })

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
  