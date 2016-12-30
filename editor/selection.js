Editor.Selection = function(editor, content) {

  CKEDITOR.dom.range.prototype.scrollIntoView = 
  CKEDITOR.dom.selection.prototype.scrollIntoView = function(){}



  editor.on('key', function(e) {
    if (e.data.keyCode >= 37 && e.data.keyCode <= 40) {
      setTimeout(function() {
        Editor.Selection.onChange(editor)
      }, 50)
    }
  }, null, null, -10);

  document.addEventListener('selectionchange', function(e) {
    if (editor.justcleaned) return;
    if (!editor.dragging) {
      Editor.Selection.fix(editor)
      Editor.Selection.onChange(editor)
    }
  })
  editor.on( 'selectionChange', function( evt ) {
    if (editor.justcleaned) return;
    if ( editor.readOnly )
      return;
    Editor.Selection.onChange(editor)
    var range = editor.getSelection().getRanges()[0];
    if (range)
      Editor.Section.setActive(editor, range.startContainer.$)
    
  } );


  editor.on( 'focus', function(e) {
    Editor.lastFocused =
    Editor.focused = editor;
  })
  editor.on( 'blur', function( evt ) {
    if (Editor.focused === editor)
      Editor.focused = null;
    Editor.Selection.onChange(editor, true, true)
  } );

  // select image on tap on mobile
  editor.gestures.on('tap', function(e) {
    for (var p = e.target; p; p = p.parentNode) {
      if (p.tagName == 'IMG') {
        if (p.parentNode.parentNode.tagName == 'A')
          editor.getSelection().selectElement(new CKEDITOR.dom.element(p.parentNode))
        else
          editor.getSelection().selectElement(new CKEDITOR.dom.element(p))

        Editor.Selection.onChange(editor, true, true)
        //e.preventDefault();
        break;
      }
    }
  })

  // highlight crop area
  content.addEventListener('mousemove', function(e) {
    if (e.target.tagName == 'IMG' && e.metaKey) {
      var x = parseInt(e.target.getAttribute('crop-x'));
      var y = parseInt(e.target.getAttribute('crop-y'));
      if (x === x && y === y) {
        if (!Editor.cropper) {
          Editor.cropper = document.createElement('div');
          Editor.cropper.id = 'image-cropper';
        }
        if (!Editor.cropper.parentNode)
          document.body.appendChild(Editor.cropper)

        var offsetLeft = 0;
        var offsetTop = 0;
        for (var p = e.target; p; p = p.offsetParent) {
          offsetLeft += p.offsetLeft;
          offsetTop += p.offsetTop;
        }

        var width  = parseFloat(e.target.getAttribute('width')  || e.target.naturalWidth  || e.target.width);
        var height = parseFloat(e.target.getAttribute('height') || e.target.naturalHeight || e.target.height);
        var min = Math.min(height, width);
        var minActual = Math.min(e.target.offsetHeight, e.target.offsetWidth)
        var shiftX = x / min * minActual
        var shiftY = y / min * minActual;
        Editor.cropper.style.left = offsetLeft + shiftX + 'px';
        Editor.cropper.style.top = offsetTop + shiftY + 'px';
        Editor.cropper.style.width  = minActual + 'px';
        Editor.cropper.style.height = minActual + 'px';
      }
    } else if (Editor.cropper) {
      if (Editor.cropper.parentNode)
        Editor.cropper.parentNode.removeChild(Editor.cropper)
    }
  });
}

Editor.Selection.fix = function(editor) {
  var selection = editor.getSelection();
  var range = selection.getRanges()[0];
  if (!range) return
  for (var p = range.startContainer.$; p; p = p.parentNode) {
    switch (p.tagName) {
      case 'PICTURE':
        range.selectNodeContents(new CKEDITOR.dom.element(p))
        return range.select()
      case 'X-DIV': case 'svg': case 'use':
        return Editor.Selection.moveToFollowingParagraph(editor, range);    
    }
  }
}
Editor.Selection.moveToNewParagraphAfter = function(editor, range) {

   if (!range) range = editor.getSelection().getRanges()[0]
  var ascender = range.startContainer.getAscendant('picture', true) || range.startContainer;
  ascender = ascender.getAscendant('a') || ascender;
  while (ascender && !ascender.getParent().is('section'))
    ascender = ascender.getParent()

  var paragraph = new CKEDITOR.dom.element('p')
  paragraph.insertAfter(ascender);
  range.moveToPosition( paragraph, CKEDITOR.POSITION_AFTER_START );
  range.select()
}

Editor.Selection.moveToAfterParagraph = function(editor, range) {
  if (!range) range = editor.getSelection().getRanges()[0]
  var ascender = range.startContainer.getAscendant(CKEDITOR.dtd.$avoidNest, true)
  if (ascender) {
    ascender = ascender.getAscendant('blockquote') || ascender;
    range.moveToPosition( ascender, CKEDITOR.POSITION_AFTER_END );
    range.select()
  }
}

Editor.Selection.saveImageSelection = function(editor, range) {
  editor.getSelection().selectElement(range.startContainer)
}


Editor.Selection.moveToFollowingParagraph = function(editor, range) {
  if (!range) range = editor.getSelection().getRanges()[0]
  var ascender = range.startContainer.getAscendant(CKEDITOR.dtd.$avoidNest, true)
  if (ascender) {
    ascender = ascender.getAscendant('blockquote') || ascender;
    var next = ascender.getNext(function(node) {
      return node.is(CKEDITOR.dtd.$paragraphs)
    })
    if (next) {
      range.moveToPosition( next, CKEDITOR.POSITION_AFTER_START );
      range.select()
    } else {
      var paragraph = new CKEDITOR.dom.element('p')
      paragraph.insertAfter(ascender);
      range.moveToPosition( paragraph, CKEDITOR.POSITION_AFTER_START );
      range.select()
    }
  }
}


Editor.Selection.moveToEditablePlace = function(editor, range) {
 if (!range) range = editor.getSelection().getRanges()[0]
  // if typing within picture, move cursor to newly created paragraph next
  if (range.startContainer.getAscendant('picture', true) || Editor.Content.isPicture(range.startContainer.$)) {
    return Editor.Selection.moveToNewParagraphAfter(editor, range)
  // if pasting within block-level content, move cursor after
  } else {
    var ascender = Editor.Content.getEditableAscender(range.startContainer.$);
    //if (!ascender || !Editor.Content.isEmpty(ascender))
      return Editor.Selection.moveToAfterParagraph(editor, range)
  }
}

// clean up empty content if it's not in currently focused section
Editor.Selection.onChange = function(editor, force, blur) {
  editor.fire('customSelectionChange')

  Editor.Chrome.update(editor)
  if (editor.clearcursor) return;
  editor.clearcursor = setTimeout(function() {
    cancelAnimationFrame(editor.clearcursor)
    editor.clearcursor = requestAnimationFrame(function() {
      editor.clearcursor = null;
      editor.justchangedselection = true;

      if (editor.doNotBlur)
        return
      
      editor.justcleaned = setTimeout(function() {
        editor.justcleaned = null;
      }, 100)
      Editor.Content.cleanEmpty(editor, force, blur)
    })
  }, 100)

}