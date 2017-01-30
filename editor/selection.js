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
      clearTimeout(editor.changingselection);
      Editor.Selection.fix(editor)
      editor.changingselection = setTimeout(function() {
        Editor.Selection.onChange(editor)
      }, 30);
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
  content.addEventListener('mousedown', function(e) {
    for (var p = e.target; p; p = p.parentNode) {
      if (p.tagName == 'PICTURE') {
        Editor.Selection.selectPicture(editor, p, true);
        Editor.Selection.onChange(editor, true, true)
        e.preventDefault();
        e.stopPropagation();
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
  //var prev = editor.previouslySelectedRange;
  //editor.previouslySelectedRange = range;

  if (!range) return
  for (var p = range.startContainer.$; p; p = p.parentNode) {
    switch (p.tagName) {
      case 'PICTURE':
        return Editor.Selection.selectPicture(editor, p)
      case 'X-DIV': case 'svg': case 'use':
        return Editor.Selection.moveToFollowingParagraph(editor, range);    
    }
  }

  if (editor.selectedPicture) {
  
  //  editor.selectedPicture.classList.remove('selected')
    editor.selectedPicture = null;
  }
}
Editor.Selection.moveToNewParagraphAfterPicture = function(editor, range) {

  if (!range) range = editor.getSelection().getRanges()[0]
  if (!range) return;
  var start = range.startContainer;

  var picture = start.getAscendant('picture', true);
  if (!picture) {
    var picture = range.getEnclosedNode();
    if (!picture || !Editor.Content.isPicture(picture.$))
      return;
  } 

  ascender = picture.getAscendant('a') || picture;
  while (ascender && !ascender.getParent().is('section'))
    ascender = ascender.getParent()

  var paragraph = new CKEDITOR.dom.element('p')
  paragraph.insertAfter(ascender);
  range.moveToPosition( paragraph, CKEDITOR.POSITION_AFTER_START );
  range.select()
  return range
}

Editor.Selection.moveToAfterParagraph = function(editor, range) {
  if (!range) range = editor.getSelection().getRanges()[0]
  var ascender = range.startContainer.getAscendant(CKEDITOR.dtd.$avoidNest, true)
  if (ascender) {
    ascender = ascender.getAscendant('blockquote') || ascender;
    range.moveToPosition( ascender, CKEDITOR.POSITION_AFTER_END );
    range.select()
    return range;
  }
}


Editor.Selection.selectPicture = function(editor, picture, force) {
  if (editor.selectedPicture == picture && !force)
    return;
  var selection = editor.getSelection();
  var range = selection.getRanges()[0] || editor.createRange();


  range.setStartAt( new CKEDITOR.dom.element(picture), CKEDITOR.POSITION_AFTER_START );
  range.setEndAt( new CKEDITOR.dom.element(picture), CKEDITOR.POSITION_BEFORE_END );


//  picture.classList.add('selected')
  editor.selectedPicture = picture;
  range.select()
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


// clean up empty content if it's not in currently focused section
Editor.Selection.onChange = function(editor, force, blur) {
  editor.fire('customSelectionChange')
  Editor.Content.cleanEmpty(editor)
  Editor.Chrome.update(editor)

}

Editor.Selection.remember = function(editor) {

  if (!editor.dragbookmark && editor.focusManager.hasFocus)
    editor.dragbookmark = editor.getSelection().createBookmarks();

}

Editor.Selection.restore = function(editor, bookmark) {
  if (!bookmark) {
    bookmark = editor.dragbookmark;
    editor.dragbookmark = null;
  }
  if (bookmark && bookmark[0]) {
    var bm = bookmark[0].startNode.$;
    for (; bm.parentNode; bm = bm.parentNode) {
      if (bm == editor.element.$) {
        editor.getSelection().selectBookmarks(bookmark);
        break;
      }
    }
  }
}


Editor.Selection.check = function(editor, callback) {
  var selection = editor.getSelection()
  if (!selection) return;
  var range = selection.getRanges()[0];
  if (!range) return;

  var el = range.startContainer.$;
  for (; el && el != editor.element.$; el = el.parentNode)
    if (el.nodeType == 1 && callback.call(editor, el))
      return true;

}