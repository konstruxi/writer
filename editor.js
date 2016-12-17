document.documentElement.className += 
    (("ontouchstart" in document.documentElement) ? ' touch' : ' no-touch');





function Editor(content) {
  CKEDITOR.dom.range.prototype.scrollIntoView = 
  CKEDITOR.dom.selection.prototype.scrollIntoView = function(){}


  // Turn off automatic editor creation first.
  CKEDITOR.disableAutoInline = true;
  var editor = CKEDITOR.inline(content, {
    extraPlugins: 'structural',
    floatSpaceDockedOffsetY: 10
  });


  // animations fire up many dom chages each frame, 
  // so undo snapshot needs to be locked during animations
  // but should temporarily unlock on user input
  editor.on('key', function(e) {
    if (editor.snapshot)
      editor.snapshot.unlock()
  }, null, null, -100);
  editor.on('exec', function(e) {
    if (editor.snapshot)
      editor.snapshot.unlock()
  }, null, null, -100);
  editor.on('beforePaste', function(e) {
    if (editor.snapshot)
      editor.snapshot.unlock()
  }, null, null, -100);
  editor.on('saveSnapshot', function(e) {
    console.log('snapshot', e)
    if (editor.snapshot)
      editor.snapshot.relock()
  }, null, null, 100);

  Editor.measure(editor);
  editor.on('contentDom', function() {
    Editor.measure(editor);


    var images = editor.element.$.getElementsByTagName('img');
    for (var i = 0, image; image = images[i++];) {
      Editor.Image(editor, image, Editor.Image.applyChanges)
    }

  })
  editor.on('uiSpace', function() {
    arguments[0].data.html = arguments[0].data.html.replace('>Insert/Remove Bulleted List<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M8 21c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM8 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 24c-1.67 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.33-3-3-3zm6 5h28v-4H14v4zm0-12h28v-4H14v4zm0-16v4h28v-4H14z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Insert/Remove Numbered List<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M4 34h4v1H6v2h2v1H4v2h6v-8H4v2zm2-18h2V8H4v2h2v6zm-2 6h3.6L4 26.2V28h6v-2H6.4l3.6-4.2V20H4v2zm10-12v4h28v-4H14zm0 28h28v-4H14v4zm0-12h28v-4H14v4z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Decrease Indent<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M22 34h20v-4H22v4zM6 24l8 8V16l-8 8zm0 18h36v-4H6v4zM6 6v4h36V6H6zm16 12h20v-4H22v4zm0 8h20v-4H22v4z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add heading<',  '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M5 8v6h10v24h6V14h10V8H5zm38 10H25v6h6v14h6V24h6v-6z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add title<',    '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M5 8v6h10v24h6V14h10V8H5zm38 10H25v6h6v14h6V24h6v-6z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add subtitle<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M5 8v6h10v24h6V14h10V8H5zm38 10H25v6h6v14h6V24h6v-6z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Bold<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M31.2 21.58c1.93-1.35 3.3-3.53 3.3-5.58 0-4.51-3.49-8-8-8H14v28h14.08c4.19 0 7.42-3.4 7.42-7.58 0-3.04-1.73-5.63-4.3-6.84zM20 13h6c1.66 0 3 1.34 3 3s-1.34 3-3 3h-6v-6zm7 18h-7v-6h7c1.66 0 3 1.34 3 3s-1.34 3-3 3z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Italic<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M20 8v6h4.43l-6.86 16H12v6h16v-6h-4.43l6.86-16H36V8z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add clear<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M6.54 10L4 12.55l13.94 13.94L13 38h6l3.14-7.32L33.46 42 36 39.45 7.09 10.55 6.54 10zM12 10v.36L17.64 16h4.79l-1.44 3.35 4.2 4.2L28.43 16H40v-6H12z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add paragraph<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M6.54 10L4 12.55l13.94 13.94L13 38h6l3.14-7.32L33.46 42 36 39.45 7.09 10.55 6.54 10zM12 10v.36L17.64 16h4.79l-1.44 3.35 4.2 4.2L28.43 16H40v-6H12z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Block Quote<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M12 34h6l4-8V14H10v12h6zm16 0h6l4-8V14H26v12h6z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add link<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M7.8 24c0-3.42 2.78-6.2 6.2-6.2h8V14h-8C8.48 14 4 18.48 4 24s4.48 10 10 10h8v-3.8h-8c-3.42 0-6.2-2.78-6.2-6.2zm8.2 2h16v-4H16v4zm18-12h-8v3.8h8c3.42 0 6.2 2.78 6.2 6.2s-2.78 6.2-6.2 6.2h-8V34h8c5.52 0 10-4.48 10-10s-4.48-10-10-10z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add filters<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="-2 -1 28 28"><path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-1l1.25-2.75L16 13l-2.75-1.25L12 9l-1.25 2.75L8 13l2.75 1.25z"/></svg>' + '<')
  }, null, null, 20);


  editor.on('key', function(e) {
    if (e.data.keyCode == 13) {
      var selection = editor.getSelection()
      var range = selection.getRanges()[ 0 ]
      if (range) {
        var container = Editor.Section.get(range.startContainer.$);
        var first = Editor.Section.getFirstChild(container);
        if (!first || (Editor.Content.isEmpty(first) && !first.nextElementSibling)) {
          return false;
        }
      }
      if (editor.snapshot)
        editor.snapshot.selected = Editor.Snapshot.rememberSelected(editor)
    }
    if (e.data.keyCode == 8) {
      var selection = editor.getSelection()
      var range = selection.getRanges()[ 0 ]
      if (!range || !range.checkStartOfBlock()) return;
      var container = range.startContainer.$
      for (; container.parentNode; container = container.parentNode) {
        if (Editor.Section.getFirstChild(container.parentNode).firstChild != container)
          break;
        // remove manual section boundary
        if (container.parentNode.tagName == 'SECTION') {
          if (container.parentNode.classList.contains('forced')) {
            container.parentNode.classList.remove('forced');
            Editor.Section(editor);
            return false;
          }
        }
      }
      return true;
    }
    if (e.data.keyCode >= 37 && e.data.keyCode <= 40) {
      setTimeout(function() {
        onCursorMove(editor)
        requestAnimationFrame(function() {
          updateToolbar(editor)
        })
      }, 50)
    }
  }, null, null, -10);

  editor.on( 'selectionChange', function( evt ) {
    if ( editor.readOnly )
      return;

    onCursorMove(editor)
    updateToolbar(editor)
    requestAnimationFrame(function() {
      var range = editor.getSelection().getRanges()[0];
      if (range)
        setActiveSection(range.startContainer.$)
    })
    
  } );
  editor.on( 'focus', function(e) {
    Editor.lastFocused =
    Editor.focused = editor;
  })
  editor.on( 'blur', function( evt ) {
    if (Editor.focused === editor)
      Editor.focused = null;
    onCursorMove(editor, true, true)
  } );
  editor.on('paste', function(e) {
    onCursorMove(editor, true)
  })
  editor.on('beforePaste', function(e) {
    Array.prototype.forEach.call(e.data.dataTransfer.$.items, function(item) {
      var file = item.getAsFile();
      if (file) {
        console.error('Load one file!')
        Editor.Image(editor, file, Editor.Image.applyChanges, Editor.Image.insert);
      }
    });
    //snapshotStyles(editor)

    if (e.data.dataTransfer) {
      var data = e.data.dataTransfer.getData('text/plain');
      if (data.match(/^\s*(?:https?|mailto):\/\/[^\s]+\s*$/)) {
        var selection = editor.getSelection();
        var range = selection.getRanges()[0];
        if (range) {
          setLink(editor, data)
          return false
        }
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

  editor.on('instanceReady', function() {
    editor.commands.paragraph.on('exec', function() {
      editor.snapshot.selected = Editor.Snapshot.rememberSelected(editor)
      //editor.stylesnapshot = snapshotStyles(editor);
    })
    editor.commands.heading.on('exec', function() {
      //editor.stylesnapshot = snapshotStyles(editor);
      Editor.Content.cleanSelection(editor, {lists: true, quotes: true})
      editor.snapshot.selected = Editor.Snapshot.rememberSelected(editor)
    })
    editor.commands.subtitle.on('exec', function() {
      //editor.stylesnapshot = snapshotStyles(editor);
      Editor.Content.cleanSelection(editor, {lists: true, quotes: true})
      editor.snapshot.selected = Editor.Snapshot.rememberSelected(editor)
    })
    editor.commands.title.on('exec', function() {
      //editor.stylesnapshot = snapshotStyles(editor);
      Editor.Content.cleanSelection(editor, {lists: true, quotes: true})
      editor.snapshot.selected = Editor.Snapshot.rememberSelected(editor)
    })
    editor.commands.bulletedlist.on('exec', function() {
      //editor.stylesnapshot = snapshotStyles(editor);
      Editor.Content.cleanSelection(editor, {titles: true, quotes: true})
      editor.snapshot.selected = Editor.Snapshot.rememberSelected(editor)
    }, null, null, 1)
    editor.commands.numberedlist.on('exec', function() {
      //editor.stylesnapshot = snapshotStyles(editor);
      Editor.Content.cleanSelection(editor, {titles: true, quotes: true})
      editor.snapshot.selected = Editor.Snapshot.rememberSelected(editor)
    })
    editor.commands.blockquote.on('exec', function() {
      //editor.stylesnapshot = snapshotStyles(editor);
      Editor.Content.cleanSelection(editor, {titles: true, lists: true})
      editor.snapshot.selected = Editor.Snapshot.rememberSelected(editor)
    })
    editor.commands.outdent.on('exec', function() {
      //editor.stylesnapshot = snapshotStyles(editor);
      editor.snapshot.selected = Editor.Snapshot.rememberSelected(editor)
    }, null, null, 1)
    editor.commands.bold.on('exec', function() {
      if (editor.commands.italic.state == 1)
        editor.ui.instances.Italic.click(editor)
    })
    editor.commands.italic.on('exec', function() {
      if (editor.commands.bold.state == 1)
        editor.ui.instances.Bold.click(editor)
    })
  })


  editor.dragging = null;
  editor.dragstart = null;
  editor.dragged = null
  editor.dragzone = document.createElement('div')
  editor.dragzone.id = 'dragzone'

  content.addEventListener('mouseup', function(e) {
    if (!editor.dragging) {
      requestAnimationFrame(function() {
        //editor.selectionChange( 1 );
        updateToolbar(editor)
      })
    }
  })
  content.addEventListener('touchend', function(e) {

    //onCursorMove(editor)
  })
  document.addEventListener('selectionchange', function(e) {
    if (!editor.dragging) {
      requestAnimationFrame(function() {
        //editor.selectionChange( 1 );
        onCursorMove(editor)
        updateToolbar(editor)
      })
      //requestAnimationFrame(function() {
      //  updateToolbar(editor)
      //  setActiveSection(editor.getSelection().getRanges()[0].startContainer.$)
      //  repositionPicker(editor)
      //})
    }
  })
  editor.handleEvent = function(e) {
    switch (e.type) {
      case 'touchstart': case 'mousedown':
        editor.dragstarted = onDragStart(editor, e);
        if (editor.dragstarted) {
          content.addEventListener('ontouchstart' in document.documentElement ? 'touchmove' : 'mousemove', editor)
          document.addEventListener('ontouchstart' in document.documentElement ? 'touchend' : 'mouseup', editor)
        }
        break;
      case 'touchmove': case 'mousemove':
        if (onDrag(editor, e)) {
          editor.dragtime = null
        }
        break;
      case 'touchend': case 'mouseup':
        editor.dragstarted = null;
        document.body.classList.remove('dragging');
        content.removeEventListener('ontouchstart' in document.documentElement ? 'touchmove' : 'mousemove', editor)
        document.removeEventListener('ontouchstart' in document.documentElement ? 'touchend' : 'mouseup', editor)
        onDragEnd(editor, e)
        break;
    }
  }
  content.addEventListener('ontouchstart' in document.documentElement ? 'touchstart' : 'mousedown', editor)

  window.addEventListener('scroll', function() {
    Editor.measure(editor, true)
    if (editor.snapshot)
      editor.snapshot.updateVisibility()
    updateToolbar(editor, true)
  })
  window.addEventListener('resize', function() {
    onEditorResize(editor)
    if (editor.snapshot)
      editor.snapshot.updateVisibility()
  })


  Editor.elements.push(content)
  Editor.editors.push(editor)

  if (!content.id)
    content.id = 'editor-' + ++Editor.uid

  onEditorResize(editor)
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

onEditorResize = function(editor) {
  if (!editor.stylesheet) {
    editor.stylesheet = document.createElement('style');
    document.body.appendChild(editor.stylesheet)
  }
  Editor.measure(editor)
  editor.stylesheet.textContent = '#' + editor.element.$.id + ' section:after{' + 
    'border-left-width: calc(' + (editor.offsetLeft + 16) + 'px + 1rem); ' +
    'left: calc(-' + (editor.offsetLeft + 16) + 'px - 1rem); ' +
    'border-right-width: calc(' + (window.innerWidth - editor.offsetLeft - editor.offsetWidth) + 'px + 1rem); ' +
    'right: calc(-' + (window.innerWidth - editor.offsetLeft - editor.offsetWidth) + 'px - 1rem); ' +
  '}'
}

onDragStart = function(editor, e) {
  var target = e.target;
  while (target && target.tagName != 'DIV')
    target = target.parentNode;
  if (target && target.classList.contains('toolbar'))
    target = target.parentNode;
  else
    return;
  if (target.tagName == 'SECTION') {
    var top = 0;
    var left = 0;

    for (var t = target; t; t = t.offsetParent) {
      left += t.offsetLeft;
      top += t.offsetTop;
    }
    // dragging
    //if (top > e.pageY) {
      document.body.classList.add('dragging');
      editor.fire('saveSnapshot')
      //editor.stylesnapshot = snapshotStyles(editor)
      editor.dragbookmark = editor.getSelection().createBookmarks();
      editor.dragging = target;
      editor.dragtop = top;
      editor.dragstart = e.pageY;
      editor.dragtime = new Date()
      editor.dragblocked = undefined
      editor.dragzone.style.width = editor.dragging.offsetWidth;
      editor.dragzone.style.left = left + 'px'
      editor.dragzone.style.height = 10 + 'px';
      document.body.appendChild(editor.dragzone)
      if (e.type != 'touchstart')
        e.preventDefault()
      e.stopPropagation()


      return true;
    //}
  }
}
onDrag = function(editor, e) {
  var y = editor.dragstart - e.pageY;
  if (editor.dragtime) {
    // let touch scroll first
    if ((new Date - editor.dragtime) < (e.type == 'touchmove' ? 100 : 0)) {
     editor.dragblocked = true;
    } else {

      // focus editor initially
      var selection = editor.getSelection();
      if (!selection.getRanges()[0]) {
        var range = editor.createRange()
        var focus = Editor.Section.getEditStart(editor.dragging);
        range.moveToElementEditStart(new CKEDITOR.dom.element(focus));
        range.select()
      }
    }
    editor.dragtime = null
     
  }
  if (editor.dragblocked) {
    return false;
  }
  if (Math.abs(y) < 3) {
    e.preventDefault()
    return false;
  }

  if (y > 0) {
    editor.dragzone.style.top = Math.max(
      editor.dragging.previousSibling ? editor.dragstart - 7 - editor.dragging.previousSibling.offsetHeight : 0,
      editor.dragstart - y - 5
    ) + 'px'
  } else {
    editor.dragzone.style.top = Math.min(
      editor.dragstart + editor.dragging.offsetHeight,
      editor.dragstart - y - 5
    ) + 'px'
  }

  var elements = getElementsAffectedByDrag(editor, e);
  for (var i = 0; i < elements.length; i++)
    elements[i].classList.add('moved')
  if (editor.dragged)
    for (var i = 0; i < editor.dragged.length; i++)
      if (elements.indexOf(editor.dragged[i]) == -1)
        editor.dragged[i].classList.remove('moved')
  editor.dragged = elements;
  e.preventDefault()
  e.stopPropagation()

}

onDragEnd = function(editor, e) {
  if (!editor.dragblocked)
  if (editor.dragged && (Math.abs(editor.dragstart - e.pageY) > 3)) {
    var dragging = editor.dragging;
    var dragged = editor.dragged;
    var dragstart = editor.dragstart

    var section = Editor.Section.build(editor)

    if (dragstart - e.pageY > 0) {
      dragging.classList.remove('forced')
      section.classList.add('forced');
      if (dragged.length)
        dragging.parentNode.insertBefore(section, dragging)

      for (var i = 0; i < dragged.length; i++) {
        section.appendChild(dragged[i])
        dragged[i].classList.remove('moved')
      }
      editor.justdropped = section.previousSibling
    } else {

      for (var i = 0; i < dragged.length; i++) {
        dragged[i].classList.remove('moved')
      }
      var children = Array.prototype.slice.call(dragging.children)
      if (children.length === dragged.length + 1) {
        var target = dragging.previousSibling;
      }
      else {
        editor.justdropped = dragging
        var target = section
      }
      for (var i = 0; i < children.length; i++) {
        if ((dragged.indexOf(children[i]) == -1 || target != section) && !children[i].classList.contains('toolbar'))
          target.appendChild(children[i])
      }
      //dragging.classList.add('forced')
      target.classList.add('forced');
      dragging.parentNode.insertBefore(section, dragging.nextSibling)
    }
    var focused = dragged[dragged.length - 1];
    editor.fire('saveSnapshot')
  } else {
    /*
    var bookmark = editor.dragbookmark[0];
    if (bookmark && bookmark.startNode.$.parentNode)
      bookmark.startNode.$.parentNode.removeChild(editor.dragbookmark[0].startNode.$)
    editor.dragbookmark = undefined;
    */
    var target = e.target;
    while (target && target.tagName != 'svg')
      target = target.parentNode;
    if (target) {
      if (target.classList.contains('split')) {
        var a = Editor.Section.getFirstChild(editor.dragging);
        var b = editor.dragging.previousElementSibling 
             && Editor.Section.getFirstChild(editor.dragging.previousElementSibling);

        if ((!a || !Editor.Content.isEmpty(a)) 
         && (!b || !Editor.Content.isEmpty(b))) {
          var sect = Editor.Section.build(editor);
          sect.classList.add('forced')
          var focused = document.createElement('p');
          sect.appendChild(focused);
          editor.dragging.parentNode.insertBefore(sect, editor.dragging);
          if (sect.nextElementSibling)
            sect.nextElementSibling.classList.add('forced')
        }
      }
    }
  }

  editor.justdragged = dragging;
  editor.refocusing = focused;
  Editor.Content.cleanEmpty(editor)

  setTimeout(function() {
    editor.justdragged = undefined;
    editor.justdropped = undefined;
    editor.dragbookmark = undefined;
    editor.refocusing = undefined;
  }, 50)

  editor.dragzone.style.height = '';
  editor.dragzone.style.top = '';
      
  editor.dragging = undefined;
  editor.dragged = undefined
  editor.dragblocked = undefined;
  editor.dragtime = undefined;
  e.preventDefault()
  e.stopPropagation()

}


// clean up empty content if it's not in currently focused section
function onCursorMove(editor, force, blur) {
  if (editor.dontanimate || editor.clearcursor) return;
  editor.clearcursor = setTimeout(function() {
    editor.clearcursor = requestAnimationFrame(function() {
      editor.clearcursor = null;
      Editor.Content.cleanEmpty(editor, force, blur)
    })
  }, 100)

}


Editor.measure = function(editor, scroll) {
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



Editor.isBoxVisible = function(editor, box) {
  var top = box.top;
  var bottom = box.top + box.height
  var topmost = editor.scrollY - editor.offsetTop - editor.innerHeight / 16
  var bottomost = editor.scrollY + editor.innerHeight - editor.offsetTop + editor.innerHeight / 16;

  return ((top >= topmost && top    <= bottomost)
    || (bottom >= topmost && bottom <= bottomost)
    ||    (top <= topmost && bottom >= bottomost))

}

  

CKEDITOR.plugins.add( 'structural', {
  init: function(editor) {
    Editor.Section.observe(editor);

    function addButton(commandName, toolbar, styles, forms) {

      editor.ui.addButton(commandName, { // add new button and bind our command
          label: 'Add ' + commandName,
          title: commandName,
          command: commandName,
          toolbar: toolbar,
          click: typeof styles == 'function' && styles || undefined
      });

      if (forms) {
        style = new CKEDITOR.style(styles)
        editor.attachStyleStateChange( style, function( state ) {
              !editor.readOnly && editor.getCommand( commandName ).setState( state );
            } );

        return editor.addCommand( commandName, new CKEDITOR.styleCommand( style, {
              contentForms: forms
            } ) )
      } else {

      }

    }

    addButton('title', 'structural', { element: 'h1'}, ['h1'])
    addButton('subtitle', 'structural', { element: 'h2'}, ['h2'])
    addButton('heading', 'structural', { element: 'h3'}, ['h3'])
    addButton('paragraph', 'structural', { element: 'p'}, ['p'])
    addButton('link', 'structural', function(e) {
      setLink(editor, null)
    })
    addButton('clear', 'basicstyles', function() {

      if (editor.commands.italic.state == 1)
        editor.ui.instances.Italic.click(editor)
      if (editor.commands.bold.state == 1)
        editor.ui.instances.Bold.click(editor)
    })
    addButton('filters', 'basicstyles', function() {
      alert('set up filters')
    })

  }
})

function setLink(editor, url) {
  editor.fire('saveSnapshot')
  var selection = editor.getSelection();
  var selector = selection.getStartElement()
  var element;

  if(selector) {
     element = selector.getAscendant( 'a', true );
  }

  if ( !element || element.getName() != 'a' ) {
    if (!url)
      url = prompt('Enter url:')
    var text = selection.getSelectedText();
    element = editor.document.createElement( 'a' );
    var youtube;
    if (!text && ((youtube = youtube_parser(url)))) {
      var img = document.createElement('img')
      img.src = "http://img.youtube.com/vi/" + youtube + "/maxresdefault.jpg"
      element.$.appendChild(img)
    } else if (url.match(/\.jpg|\.gif|\.png/)) {
      var img = document.createElement('img')
      img.src = url
      element.$.appendChild(img)
    } else if (!text) {
      text = url.split('://')[1];
    }
    if (text)
      element.$.textContent = text
    element.setAttribute("target","_blank")
    editor.insertElement(element)
  } else {
    if (url == null)
      url = prompt('Enter url:', element.$.href)
  }

  if (url) {
    if (url.indexOf('//') == -1)
      url = 'http://' + url;
    element.setAttribute('href', url)
  } else {
    while (element.$.firstChild)
      element.$.parentNode.insertBefore(element.$.firstChild, element.$)
    element.$.parentNode.removeChild(element.$)
  }
  editor.fire('saveSnapshot')

}
function youtube_parser(url){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
}
function getElementsAffectedByDrag(editor, e) {
  var y = editor.dragstart - e.pageY;
  var result = []
  
  var target = e.target;
  while (target && target.tagName != 'SECTION')
    target = target.parentNode;
  if (!target) return result;


  if (y > 0) {
    var previous = target;
    if (previous) {
      var top = editor.dragtop - (editor.dragging.offsetTop - previous.offsetTop)
      var height = previous.offsetHeight
      for (var i = 0, children = previous.childNodes, child; child = children[i++];)
        if (!child.classList || !child.classList.contains('toolbar'))
          if (child.offsetTop + Math.min(70, child.offsetHeight / 2) > height - y)
            result.push(child)
    }
  } else {
    var next = target
    var top = editor.dragtop + (next.offsetTop - editor.dragging.offsetTop)
    var height = next.offsetHeight
    for (var i = 0, children = next.childNodes, child; child = children[i++];)
      if (!child.classList || !child.classList.contains('toolbar'))
        if (child.offsetTop + Math.min(70, child.offsetHeight / 2) < - y)
          result.push(child)
  }
  
  var width = target.offsetWidth;
  dragzone.style.left = target.offsetLeft + editor.offsetLeft + 'px';
  dragzone.style.width = width + 'px';

  return result
}

function rightNow(callback) {
  callback()
}


function updateToolbar(editor, force) {
  var selection = editor.getSelection();
  if (!selection) return;

  if (editor.hidingButtons) return;
  editor.hidingButtons = (force ? rightNow : setTimeout)(function() {
    editor.hidingButtons = null;
  var range = selection.getRanges()[0];
  if (!range || !range.startContainer) return;
  var start = Editor.Content.getEditableAscender(range.startContainer.$);

  var startSection = start;
  while (startSection && startSection.tagName != 'SECTION')
    startSection = startSection.parentNode;

  var end = Editor.Content.getEditableAscender(range.endContainer.$);

  var endSection = end;
  while (endSection && endSection.tagName != 'SECTION')
    endSection = endSection.parentNode;

  if (!startSection) return;
  var sectionStyle = window.getComputedStyle(startSection);
  var sectionAfterStyle = window.getComputedStyle(startSection, ':after');

  // use final keyframe positions when animating
  if (editor.snapshot) {
    var index = editor.snapshot.elements.indexOf(start);
    var indexS = editor.snapshot.elements.indexOf(startSection);
    if (index > -1 && indexS > -1) {
      var offsetHeight = editor.snapshot.dimensions[index].height;
      var sectionOffsetTop = editor.snapshot.dimensions[indexS].top;
      var offsetTop = editor.snapshot.dimensions[index].top + editor.offsetTop;
      var offsetLeft = editor.snapshot.dimensions[indexS].left + editor.offsetLeft;
    } else {
      return;
    }
  // place at currently selected element mid-point
  } else {
    var offsetHeight = start.offsetHeight
    var offsetTop = 0;
    var offsetLeft = 0;
    var sectionOffsetTop = 0;
    for (var el = start; el; el = el.offsetParent)
      offsetTop += el.offsetTop;
    for (var el = startSection; el; el = el.offsetParent) {
      sectionOffsetTop += el.offsetTop;
      offsetLeft += el.offsetLeft;
    }
  }

  var ui = editor.ui.instances
  if (range.startOffset != range.endOffset && start == end) {

    var iterator = selection.getRanges()[0].createIterator();
    iterator.enforceRealBlocks = false;
    var paragraph = iterator.getNextParagraph();
    if (paragraph && paragraph.is('img') || 
      (paragraph.is('p') && paragraph.$.getElementsByTagName('img')[0])) {
      var button = 'filters'
    } else {
      if (ui.Bold._.state == 2 && ui.Italic._.state == 2 && 
        ui.title._.state == 2 && ui.subtitle._.state == 2 && ui.heading._.state == 2) {
        var button = 'Bold'
      } else if (ui.Italic._.state == 2) {
        var button = 'Italic'
      } else {
        var button = 'clear';
      }
    }

  } else {
    var section = start;
    while (section && section.tagName != 'SECTION')
      section = section.parentNode;
    if (!section) return;

    if (start.textContent.length < 120 && start == end) {
      if (ui.title._.state == 2 && ui.subtitle._.state == 2 && ui.heading._.state == 2) {
        var button = 'title'
      } else if (ui.subtitle._.state == 2 && ui.heading._.state == 2) {
        var button = 'subtitle'
      } else if (ui.heading._.state == 2) {
        var button = 'heading'
      } else {
        var button = 'paragraph'
      }
    } else {
      if (startSection == endSection && ui.Blockquote._.state == 2 && ui.BulletedList._.state == 2 && ui.NumberedList._.state == 2) {
        var button = 'Blockquote'  
      } else if (ui.BulletedList._.state == 2 && ui.NumberedList._.state == 2) {
        var button = 'BulletedList'
      } else if (ui.NumberedList._.state == 2) {
        var button = 'NumberedList'
      } else {
        var button = 'Outdent'
      }
    }
  }


  (force ? rightNow : requestAnimationFrame)(function() {

  var top = Math.max( offsetTop,
                          Math.min( editor.scrollY + editor.innerHeight - 54,
                            Math.min( offsetTop + offsetHeight,
                              Math.max(editor.scrollY + 54, offsetTop + offsetHeight / 2)))) + 'px';

  var left = offsetLeft + 'px';
  
  formatting.style.display = 'block';

  formatting.style.position  = 'absolute' 
  formatting.style.left = left;
  formatting.style.top = top;

  if (force && button == editor.currentButton) return;
  editor.currentButton = button;
  
  setUIColors(sectionStyle, sectionAfterStyle);
  
  var buttons = formatting.querySelectorAll('.cke .cke_button');
  var target = 'cke_button__' + button.toLowerCase()
  for (var i = 0, el; el = buttons[i++];) {
    if (el.classList.contains(target)) {
      el.removeAttribute('hidden')
    } else if (!el.classList.contains('cke_button__link')) {
      el.setAttribute('hidden', 'hidden')
    } else {
      if (range.startContainer.getAscendant( 'a', true )) {
        el.classList.add('actual')
      } else {
        el.classList.remove('actual')
      }
    }
  }
  //for (editor.ui.instances.title._)


  });
}, 75)
}



function setUIColors(sectionStyle, sectionAfterStyle) {
  //if (!formattingStyle.sheet.cssRules.length) {
  //  formattingStyle.sheet.insertRule('#formatting {}', 0);
  //  formattingStyle.sheet.insertRule('#formatting .cke_button {}', 1);
  //  formattingStyle.sheet.insertRule('#formatting:before {}', 2);
  //}
  /*
  formattingStyle.sheet.cssRules[0].style.color = sectionAfterStyle['color'];
  formattingStyle.sheet.cssRules[0].style.backgroundColor = sectionStyle['background-color'];
  formattingStyle.sheet.cssRules[1].style.backgroundColor = sectionStyle['background-color'];
  formattingStyle.sheet.cssRules[2].style.backgroundColor = sectionAfterStyle['outline-color'];
*/
  var text = "#formatting { color: " + sectionAfterStyle['color'] + "; background-color: " + sectionStyle['background-color'] + " }" + 
  "#formatting .cke_button { background-color: " + sectionStyle['background-color'] + "  }" +
  "#formatting .picker:after { background-color: " + sectionAfterStyle['border-color'] + "  }" + 
  "#formatting .picker:before { background-color: " + sectionAfterStyle['background-color'] + "  }" + 
  "#formatting:before { background-color: " + sectionAfterStyle['outline-color'] + "  }"; 

  if (formattingStyle.textContent != text)
    formattingStyle.textContent = text;
}

