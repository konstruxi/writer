function Editor(content) {


  // Turn off automatic editor creation first.
  CKEDITOR.disableAutoInline = true;
  var editor = CKEDITOR.inline(content, {
    extraPlugins: 'structural',
    floatSpaceDockedOffsetY: 10
  });
  editor.on('uiSpace', function() {
    arguments[0].data.html = arguments[0].data.html.replace('>Insert/Remove Bulleted List<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M8 21c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM8 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 24c-1.67 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.33-3-3-3zm6 5h28v-4H14v4zm0-12h28v-4H14v4zm0-16v4h28v-4H14z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Insert/Remove Numbered List<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M4 34h4v1H6v2h2v1H4v2h6v-8H4v2zm2-18h2V8H4v2h2v6zm-2 6h3.6L4 26.2V28h6v-2H6.4l3.6-4.2V20H4v2zm10-12v4h28v-4H14zm0 28h28v-4H14v4zm0-12h28v-4H14v4z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Decrease Indent<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M22 34h20v-4H22v4zM6 24l8 8V16l-8 8zm0 18h36v-4H6v4zM6 6v4h36V6H6zm16 12h20v-4H22v4zm0 8h20v-4H22v4z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add heading<',  '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M10 8v6h11v24h6V14h11V8z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add title<',    '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M10 8v6h11v24h6V14h11V8z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add subtitle<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M10 8v6h11v24h6V14h11V8z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Bold<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M31.2 21.58c1.93-1.35 3.3-3.53 3.3-5.58 0-4.51-3.49-8-8-8H14v28h14.08c4.19 0 7.42-3.4 7.42-7.58 0-3.04-1.73-5.63-4.3-6.84zM20 13h6c1.66 0 3 1.34 3 3s-1.34 3-3 3h-6v-6zm7 18h-7v-6h7c1.66 0 3 1.34 3 3s-1.34 3-3 3z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Italic<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M20 8v6h4.43l-6.86 16H12v6h16v-6h-4.43l6.86-16H36V8z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add clear<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M6.54 10L4 12.55l13.94 13.94L13 38h6l3.14-7.32L33.46 42 36 39.45 7.09 10.55 6.54 10zM12 10v.36L17.64 16h4.79l-1.44 3.35 4.2 4.2L28.43 16H40v-6H12z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add paragraph<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M6.54 10L4 12.55l13.94 13.94L13 38h6l3.14-7.32L33.46 42 36 39.45 7.09 10.55 6.54 10zM12 10v.36L17.64 16h4.79l-1.44 3.35 4.2 4.2L28.43 16H40v-6H12z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Block Quote<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M12 34h6l4-8V14H10v12h6zm16 0h6l4-8V14H26v12h6z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add link<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M7.8 24c0-3.42 2.78-6.2 6.2-6.2h8V14h-8C8.48 14 4 18.48 4 24s4.48 10 10 10h8v-3.8h-8c-3.42 0-6.2-2.78-6.2-6.2zm8.2 2h16v-4H16v4zm18-12h-8v3.8h8c3.42 0 6.2 2.78 6.2 6.2s-2.78 6.2-6.2 6.2h-8V34h8c5.52 0 10-4.48 10-10s-4.48-10-10-10z"/></svg>' + '<')
    
  }, null, null, 20);


  editor.on('key', function(e) {
    if (e.data.keyCode == 13) {
      if (!editor.stylesnapshot)
        editor.stylesnapshot = snapshotStyles(editor);
      var selection = editor.getSelection()
      var range = selection.getRanges()[ 0 ]
      var container = range.startContainer.$
      if (isEmptyParagraph(container))
      for (; container.parentNode; container = container.parentNode) {
        if (container.parentNode.firstElementChild != container)
          break;
        if (container.parentNode.lastElementChild != container)
          break;
        return false;
      }
    }
    if (e.data.keyCode == 8) {
      editor.stylesnapshot = snapshotStyles(editor);
      var selection = editor.getSelection()
      var range = selection.getRanges()[ 0 ]
      if (range.startOffset > 0 || range.startOffset != range.endOffset) return;
      var container = range.startContainer.$
      for (; container.parentNode; container = container.parentNode) {
        if (container.parentNode.firstChild != container)
          break;
        // remove manual section boundary
        if (container.parentNode.tagName == 'SECTION') {
          if (container.parentNode.classList.contains('forced')) {
            container.parentNode.classList.remove('forced');
            //fix();
            return false;
          }
        }
      }
      return true;
    }
    console.log(e.data.keyCode)
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
    //requestAnimationFrame(function() {
    //  var range = editor.getSelection().getRanges()[0];
    //  if (range)
    //    setActiveSection(range.startContainer.$)
    //  repositionPicker(editor)
    //})
    
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
    
    debugger
    snapshotStyles(editor)
    
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

  function replaceContents(editor, options) {
    var selection = editor.getSelection()
    var iterator = selection.getRanges()[0].createIterator();
    var elements = []
    var bookmark = selection.createBookmarks()
    for (var element; element = iterator.getNextParagraph();) {
      var el = element.$;
      if (el.parentNode.tagName == 'BLOCKQUOTE')
        el = el.parentNode;
      elements.push(el);
    }
    for (var e, i = 0; e = elements[i++];) {
      var tag = e.tagName;
      switch (e.tagName) {
        case 'UL': case 'OL':
          if (options.lists) {
            while (e.firstChild)
              e.parentNode.insertBefore(e.firstChild, e)
            e.parentNode.removeChild(e);
          }
          break;
        case 'LI': case 'H1': case 'H2': case 'H3':
          if ((e.tagName == 'LI' && options.lists) ||
              (e.tagName.charAt(0) == 'H' && options.titles)) {
            var p = document.createElement('p')
            while (e.firstChild)
              p.appendChild(e.firstChild)
            e.parentNode.replaceChild(p, e);
          }
          break;
        case 'BLOCKQUOTE':
          if (options.quotes && e.firstElementChild && e.firstElementChild.tagName == 'P') {
            while (e.firstChild)
              e.parentNode.insertBefore(e.firstChild, e)
            e.parentNode.removeChild(e);
          }


      }
    }
    selection.selectBookmarks(bookmark);
  }
  editor.on('instanceReady', function() {
    editor.commands.paragraph.on('exec', function() {
      editor.stylesnapshot = snapshotStyles(editor);
    })
    editor.commands.heading.on('exec', function() {
      editor.stylesnapshot = snapshotStyles(editor);
      replaceContents(editor, {lists: true, quotes: true})
    })
    editor.commands.subtitle.on('exec', function() {
      editor.stylesnapshot = snapshotStyles(editor);
      replaceContents(editor, {lists: true, quotes: true})
    })
    editor.commands.title.on('exec', function() {
      editor.stylesnapshot = snapshotStyles(editor);
      replaceContents(editor, {lists: true, quotes: true})
    })
    editor.commands.bulletedlist.on('exec', function() {
      editor.stylesnapshot = snapshotStyles(editor);
      replaceContents(editor, {titles: true, quotes: true})
    }, null, null, 0)
    editor.commands.numberedlist.on('exec', function() {
      editor.stylesnapshot = snapshotStyles(editor);
      replaceContents(editor, {titles: true, quotes: true})
    })
    editor.commands.blockquote.on('exec', function() {
      editor.stylesnapshot = snapshotStyles(editor);
      replaceContents(editor, {titles: true, lists: true})
    })
    editor.commands.outdent.on('exec', function() {
      editor.stylesnapshot = snapshotStyles(editor);
    })
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
  document.addEventListener('selectionchange', function(e) {
    if (!editor.dragging) {
      requestAnimationFrame(function() {
        //editor.selectionChange( 1 );
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
        onDrag(editor, e)
        break;
      case 'touchend': case 'mouseup':
        editor.dragstarted = null;
        content.removeEventListener('ontouchstart' in document.documentElement ? 'touchmove' : 'mousemove', editor)
        document.removeEventListener('ontouchstart' in document.documentElement ? 'touchend' : 'mouseup', editor)
        onDragEnd(editor, e)
        break;
    }
  }
  content.addEventListener('ontouchstart' in document.documentElement ? 'touchstart' : 'mousedown', editor)

  window.addEventListener('scroll', function() {
    updateToolbar(editor)
  })

  editor.measure = function() {
    this.offsetHeight = editor.element.$.offsetHeight;
    this.offsetWidth  = editor.element.$.offsetHeight;
    this.offsetTop  = editor.element.$.offsetTop;
    this.offsetLeft  = editor.element.$.offsetLeft;
  }
  Editor.elements.push(content)
  Editor.editors.push(editor)
  return editor;
}
Editor.elements = []
Editor.editors = []

Editor.get = function(el) {
  for (; el; el = el.parentNode) {
    var index = Editor.elements.indexOf(el);
    if (index > -1)
      return Editor.editors[index]
  }
}

onDragStart = function(editor, e) {
  var target = e.target;
  if (target.tagName == 'SECTION') {
    var top = 0;
    var left = 0;

    for (; target; target = target.offsetParent) {
      left += target.offsetLeft;
      top += target.offsetTop;
    }
    // dragging
    if (top > e.pageY) {
      document.body.classList.add('dragging');
      editor.fire('saveSnapshot')
      editor.stylesnapshot = snapshotStyles(editor)
      editor.dragbookmark = editor.getSelection().createBookmarks();
      editor.dragging = e.target;
      editor.dragtop = top;
      editor.dragstart = e.pageY;
      editor.dragzone.style.width = editor.dragging.offsetWidth;
      editor.dragzone.style.left = left + 'px'
      editor.dragzone.style.height = 10 + 'px';
      editor.dragzone.style.top = e.pageY - 5 + 'px'
      document.body.appendChild(editor.dragzone)
      e.preventDefault()
      e.stopPropagation()


      // focus editor initially
      var selection = editor.getSelection();
      if (!selection.getRanges()[0]) {
        var range = editor.createRange()
        var target = e.target;
        while (target.firstElementChild)
          target = target.firstElementChild;
        range.moveToElementEditStart(new CKEDITOR.dom.element(target));
        range.select()
      }

      return true;
    }
  }
}
onDrag = function(editor, e) {
  var y = editor.dragstart - e.pageY;
  if (editor.dragstart - e.pageY > 0) {
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
  if (editor.dragged) {
    var dragging = editor.dragging;
    var dragged = editor.dragged;
    var dragstart = editor.dragstart
    document.body.classList.remove('dragging');
    //requestAnimationFrame(function() {
      var section = document.createElement('section')

      if (!dragging.classList.contains('forced'))
        section.classList.add('new')

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
        if (children.length === dragged.length) {
          var target = dragging.previousSibling;
        }
        else {
          editor.justdropped = dragging
          var target = section
        }
        for (var i = 0; i < children.length; i++) {
          if (dragged.indexOf(children[i]) == -1 || target != section)
            target.appendChild(children[i])
        }
        dragging.classList.add('forced')
        target.classList.add('forced');
        dragging.parentNode.insertBefore(section, dragging.nextSibling)
      }
      editor.fire('saveSnapshot')

  }


  editor.justdragged = dragging;
  setTimeout(function() {
    editor.justdragged = undefined;
    editor.justdropped = undefined;
    editor.dragbookmark = undefined;
  }, 50)

  editor.dragzone.style.height = '';
  editor.dragzone.style.top = '';
      
  editor.dragging = undefined;
  editor.dragged = undefined
  e.preventDefault()
  e.stopPropagation()

}

// clean up empty content if it's not in currently focused section
function onCursorMove(editor, force, blur) {
  if (editor.dontanimate) return;
  clearTimeout(editor.clearcursor)
  cancelAnimationFrame(editor.clearcursor)
  editor.clearcursor = setTimeout(function() {
    editor.clearcursor = requestAnimationFrame(function() {

    var selection = editor.getSelection();
    var selected = selection.getStartElement();
    if (selected) selected = selected.$;
    var children = Array.prototype.slice.call(editor.element.$.children);
    var snapshot = false;
    editor.fire('lockSnapshot');
    for (var i = 0; i < children.length; i++) {
      var inside = isInside(selected, children[i]);
      if (selected && inside) {
        if (editor.section != children[i]) {
          if (editor.section)
            editor.section.classList.remove('focused')
          editor.section = children[i]
          editor.section.classList.add('focused')
          setActiveSection(editor.section, true)
          updateToolbar(editor)
        }
      }
      if (!selected || force || !inside) {
        if (isEmptyParagraph(children[i])) {
          if (!snapshot) 
            snapshot = editor.stylesnapshot = snapshotStyles(editor)
          if (selected) 
            if (inside) {
              if (!before && !after) {
                var before = children[i].previousElementSibling;
                var after = children[i].nextElementSibling;
              }
            } else if (!bookmark)
              var bookmark = selection.createBookmarks();

          children[i].parentNode.removeChild(children[i])
        } else {
          var els = Array.prototype.slice.call(children[i].getElementsByTagName('*'));
          for (var j = 0; j < els.length; j++) {
            if (isEmptyParagraph(els[j])) {
              if (selected) 
                if (!before && !after && isInside(selected, els[j])) {
                  var before = els[j].previousElementSibling;
                  var after = els[j].nextElementSibling;
                } else if (!bookmark) { 
                  var bookmark = selection.createBookmarks();
                }

              if (!snapshot) 
                snapshot = editor.stylesnapshot = snapshotStyles(editor)

              els[j].parentNode.removeChild(els[j])

            }
          }
        }
      }
    }
    if (before || after) {
      //var range = editor.createRange();
      //if (before)
      //  range.moveToElementEditEnd( new CKEDITOR.dom.element(before) );
      //else
      //  range.moveToElementEditStart( new CKEDITOR.dom.element(after) )
      //range.select( true );
    } else if (bookmark)
      try {
        editor.getSelection().selectBookmarks(bookmark);
      } catch(e) {}

    editor.fire('unlockSnapshot');
  })
  }, 50)

}

// returns newly selected section
split = function(editor, root) {
  var children = Array.prototype.slice.call(root.childNodes);
  var selection = editor.getSelection()
  var bookmark = editor.dragbookmark || selection.createBookmarks();
  var last;
  var prev;
  var selected = selection.getStartElement();
  if (selected) selected = selected.$;

  for (var p = selected; p; p = p.parentNode) {
    if (p.tagName == 'SECTION')
      var result = p;
  }

  context = {}
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (child.tagName == 'SECTION') {
      if (child.classList.contains('forced'))
        last = child;
      var current = child;
      var grandchildren = Array.prototype.slice.call(child.childNodes);
      for (var j = 0; j < grandchildren.length; j++) {
        last = place(last, prev, grandchildren[j], current, root, selected, context)
        if (last === current) {
          current = undefined;
        }
        prev = grandchildren[j];
      }
      if (current) {
        current.parentNode.removeChild(current)
      }
      continue;
    }

    last = place(last, prev, child, null, root, null, context)
    prev = child;
  }

  // restore selection
  var range = editor.createRange();
  if (selected) {
    if (context.reselected) {
      try {
        var bm = context.reselected;
        range.moveToElementEditStart( new CKEDITOR.dom.element(context.reselected ) );
        range.select( true );
      } catch(e) {
      }
    } else if (!bookmark[0]) {
      return
    } else {
      var bm = bookmark[0].startNode.$;
      for (; bm.parentNode; bm = bm.parentNode) {
        if (bm == editor.element.$) {
          editor.getSelection().selectBookmarks(bookmark);
          break;
        }
      }
    }
    
    if (bookmark[0].startNode.$.parentNode)
      bookmark[0].startNode.$.parentNode.removeChild(bookmark[0].startNode.$)
  }


  var selection = editor.getSelection()
  var selected = selection.getStartElement();
  if (selected) selected = selected.$;
  while (selected) {
    if (selected === result)
      return;
    selected = selected.parentNode
  }
  return result;
}

analyze = function(node) {
  var tags = [];
  var titles = 0;
  var texts = 0;
  for (var i = 0; i < node.children.length; i++) {
    var child = node.children[i];
    switch (child.tagName) {
      case 'H1': case 'H2':
        if (child.textContent.length)
          tags.push('has-title')
        titles += child.textContent.length;
        break;

      case 'BLOCKQUOTE':
        texts += child.textContent.length;
        tags.push('has-quote');
        break;

      case 'UL': case 'OL':
        texts += child.textContent.length;
        tags.push('has-list');
        break;

      case 'P': case 'A':
        var img = child.getElementsByTagName('img')[0]
        if (img) {
          tags.push('has-image', 'has-palette-' + img.getAttribute('uid'))
        } else if (child.textContent.length) {
          texts += child.textContent.length;
          tags.push('has-text')
        }
        break;

      case 'IMG':
        tags.push('has-image', 'has-palette-' + child.getAttribute('uid'))


    }
  }
  if (texts && texts < 200)
    tags.push('has-short-text')
  else if (texts > 600)
    tags.push('has-long-text');

  if (titles && titles < 30)
    tags.push('has-short-title')
  else if (titles > 100)
    tags.push('has-long-title');

  var list = Array.prototype.slice.call(node.classList)
  for (var i = 0; i < list.length; i++) {
    if (list[i].indexOf('has-') == 0) {
      if (tags.indexOf(list[i]) == -1)
        node.classList.remove(list[i])
    }
  }
  for (var i = 0; i < tags.length; i++)
    node.classList.add(tags[i])
}

var patterns = {
  'two-images': [
    {'has-image': true, 'has-long-text': false},
    {'has-image': true, 'has-long-text': false}
  ],
  'one-quote': [
    {'has-quote': true, 'has-text': false}
  ]
}

function match(element, conditions) {
  if (!element) return;
  for (var klass in conditions)
    if (element.classList.contains(klass) != conditions[klass])
      return false;
  return true;
}


function group(content) {
  var current;
  var sections = Array.prototype.slice.call(content.children);
  outer: for (var i = 0; i < sections.length; i++) {
    for (var name in patterns) {
      var pattern = patterns[name];
      for (var j = 0; j < pattern.length; j++)
        if (!match(sections[i + j], pattern[j]))
          break;
      if (j == pattern.length) {
        for (var k = 0; k < pattern.length; k++) {
          sections[i + k].setAttribute('index', k)
          sections[i + k].setAttribute('pattern', name)
        }
        i += j - 1;
        continue outer;
      }
    }
    if (sections[i].getAttribute('pattern')) {
      sections[i].removeAttribute('pattern')
      sections[i].removeAttribute('index')
    }
  }
}

isEmptyParagraph = function(child) {
  if (child.tagName == 'IMG' || child.tagName == 'BR')
    return false;
  //if (child.tagName == 'P') {
    var text = child.textContent
    for (var i = 0; i < text.length; i++)
      switch (text.charAt(i)) {
        case '&nbsp;': case ' ': case '\n': case '\r': case '\t': case "​": case " ": case " ":
          break;
        default:
          return false;
      }
  //}
  return child.nodeType != 1 || !child.querySelector('img, video, iframe');
}

isInside = function(element, another) {
  while (element) {
    if (element == another)
      return true;
    element = element.parentNode
  }
}
place = function(parent, previous, child, current, root, selected, context) {
  if (previous) {
    // start a new line after empty paragraph
    if (selected) {
      if (previous.parentNode.firstChild == previous && isEmptyParagraph(previous)) {
        if (isInside(selected, previous)) {
          if (!current) {
            var removed = previous
            if (context.reselected == previous)
              context.reselected = undefined
            previous.parentNode.removeChild(previous)
            previous = undefined
          }
        } else if (selected.previousSibling == previous && isEmptyParagraph(selected)) {
          if (selected.parentNode.lastChild == child) {
            previous.parentNode.removeChild(previous)
            if (context.reselected == previous)
              context.reselected = undefined
            return parent;
          } else {
            var inserted = previous
            //editor.dontanimate = true;
          }
        } else if (isInside(selected, child)){
          var focused = previous;
        }
      // prepending a header into a section, which will split
      }/* else if (current && previous.parentNode != current && current.firstElementChild == child && child.nextElementSibling && needsSplitterBetween(child, child.nextElementSibling)) {
        //editor.dontanimate = true;
      }*/

      if (!focused && !removed && (isInside(selected, child) && isEmptyParagraph(previous))) {
        
        var section = document.createElement('section');
        if (parent.parentNode)
          parent.parentNode.insertBefore(section, parent.nextSibling);
        section.appendChild(child)
        section.classList.add('forced')

        if (inserted) {
          if (!context.reselected)
            context.reselected = previous;
        } else {
          if (isEmptyParagraph(child)) 
            if (!context.reselected || context.reselected == previous) 
              context.reselected = child; 

          previous.parentNode.removeChild(previous)
        }

        return section;
      }
    }
    if (needsSplitterBetween(previous, child)) {
      // if header is in the beginning of chapter,
      // shift focus to previous section
      if (child && isEmptyParagraph(child) && previous && !isEmptyParagraph(previous))
        context.reselected = child;

      var section = (current || document.createElement('section'));
      if (parent.parentNode) 
        if (section.parentNode != parent.parentNode || section.previousSibling != parent)
          parent.parentNode.insertBefore(section, parent.nextSibling);
      if (current) {
        if (current.firstChild != child)
          section.insertBefore(child, section.firstChild)
      } else if (section.previousSibling != previous) {
        section.appendChild(child); 
      }


      return section;
    }
  }
  
  if (!parent) parent = current || document.createElement('section')
  if (!parent.parentNode)
    root.appendChild(parent);
  if (child.parentNode != parent || (previous && previous.parentNode == parent && child.previousSibling != previous)) {
    parent.insertBefore(child, previous && previous.nextSibling)
  }
  if (removed ? removed == selected : focused) {
    if (!context.reselected)
      context.reselected = focused || child;
  }
  return parent;  

}

function needsSplitterBetween(left, right) {
  return (right.tagName == 'H1' && (!left || left.tagName != 'IMG' || left.previousElementSibling)) 
      || (right.tagName == 'H2' && (!left || (left.tagName != 'H1' && (left.tagName != 'IMG' || left.previousElementSibling))))
}

function snapshotStyles(editor, reset) {

  var elements = Array.prototype.slice.call(editor.element.$.getElementsByTagName('*'));
  if (reset) {
    editor.element.$.classList.remove('moving')
    editor.element.$.style.height = '';
    for (var i = 0; i < elements.length; i++) {
      elements[i].style.height = ''
      elements[i].style.width = ''
      elements[i].style.top = ''
      elements[i].style.left = ''
      elements[i].style.fontSize = ''
      elements[i].style.transition = 'none'
      elements[i].classList.remove('moving')
    }
  }
  var dimensions = []
  for (var i = 0; i < elements.length; i++) {
    var box = {top: 0, left: 0, 
      height: elements[i].offsetHeight, width: elements[i].offsetWidth, parent: elements[i].parentNode}
    for (var parent = elements[i]; parent && (parent != editor.element.$); parent = parent.offsetParent) {
      box.top += parent.offsetTop;
      box.left += parent.offsetLeft;
    }
    dimensions.push(box)
  }
  editor.measure();
  

  var selection = editor.getSelection()
  var range = selection.getRanges()[0];
  if (range) {
    var iterator = selection.getRanges()[0].createIterator();
    var selection = []
    for (var element; element = iterator.getNextParagraph();) {
      var selected = element.$;
      if (selected) {
        var fontSize = window.getComputedStyle(selected)['font-size'];
        selection.push(selected, fontSize)
      }
    }
  }
    
  return [elements, dimensions, selection, editor.element.$.offsetHeight];
}

function fix(editor, mutation, observer) {
  var snapshot = editor.stylesnapshot || snapshotStyles(editor);
  editor.stylesnapshot = undefined;


  editor.fire( 'lockSnapshot');
  var content = editor.element.$;
  var section = split(editor, content) || editor.justdropped
  for (var i = 0; i < content.children.length; i++)
    analyze(content.children[i])
  group(content)


  animate(editor, snapshot, section);

  if (observer)
    observer.takeRecords()

  editor.fire( 'unlockSnapshot' );
}

  
function animate(editor, snapshot, section, callback) {
  elements = snapshot[0];
  dimensions = snapshot[1];

  var update = snapshotStyles(editor, true);
  var all = update[0]
  var current = update[1];
  editor.styleupdate = update;

  // dont restart animation on phones to avoid flickering
  if (editor.animating && window.innerWidth < 600) {
    updateToolbar(editor, true)
    togglePicker(editor, true)
    return
  }

  if (snapshot[2] && update[2]) {
    for (var i = 0; i < update[2].length; i += 2) {
      var before = snapshot[2][i];
      var beforeSize = snapshot[2][i + 1];
      var after = update[2][i];
      var afterSize = update[2][i + 1];

      if (elements.indexOf(after) == -1 && all.indexOf(before) == -1) {
        var morphing = true;
        after.style.fontSize = beforeSize;
        after.style.transition = 'none'
        elements.push(after)
        dimensions.push(dimensions[elements.indexOf(before)])
      }
    }
    editor.element.$.classList.add('moving')
    editor.element.$.style.height = snapshot[3] + 'px';

  }
  updateToolbar(editor, true)
  togglePicker(editor, true)
  
  var repositioned = false;
  var content = editor.element.$;
  for (var i = 0; i < content.children.length; i++) {
    repositioned = shift(content.children[i], current, all, dimensions, elements, content, 0, 0, repositioned)
  }


  cancelAnimationFrame(editor.animating);
  editor.animating = requestAnimationFrame(function() {
      editor.fire( 'lockSnapshot');
      editor.element.$.style.transition = '';
      editor.element.$.style.height = update[3] + 'px';

      for (var i = 0; i < all.length; i++) {
        all[i].style.transition = '';
      }


      if (morphing) {
        for (var i = 0; i < update[2].length; i += 2) {
          update[2][i].style.transition = ''
          update[2][i].style.fontSize = update[2][i + 1];
        }
      }

      var repositioned = false;
      for (var i = 0; i < content.children.length; i++) {
        repositioned = shift(content.children[i], current, all, [], [], content, 0, 0, repositioned)
      }

      editor.fire( 'unlockSnapshot' )

      clearTimeout(editor.resetstyles)
      editor.resetstyles = setTimeout(function() {
        editor.animating = null
        editor.styleupdate = null
        editor.fire( 'lockSnapshot');
        editor.element.$.style.height = '';
        editor.element.$.classList.remove('moving')
        var all = Array.prototype.slice.call(content.getElementsByTagName('*'));
        for (var i = 0; i < all.length; i++) {
          all[i].classList.remove('moving')
          all[i].style.height = ''
          all[i].style.width = ''
          all[i].style.left = ''
          all[i].style.top = ''
          all[i].style.fontSize = ''
        }
        editor.fire( 'unlockSnapshot' )
      }, 300)
    })

};


function shift(element, to, all, from, elements, root, parentX, parentY, repositioned, diffX, diffY, p) {
  var f = from[elements.indexOf(element)]
  var t = to[all.indexOf(element)]
  if (!t) return;

  if (f) {
    diffX = (diffX || 0) + t.left - f.left;
    diffY = (diffY || 0) + t.top - f.top;
    var shiftX = f.left - (parentX || 0);
    var shiftY = f.top - (parentY || 0);
    var posX = shiftX;
    var posY = shiftY;
    var posX = f.left;
    var posY = f.top;

  } else {
    diffX = 0;
    diffY = 0
    var shiftX = t.left - (p ? p.left : 0) ;
    var shiftY = t.top - (p ? p.top : 0);
    var posX = t.left;
    var posY = t.top;
  }

  var repos = false;
  for (var i = 0; i < element.children.length; i++) {
    repos = shift(element.children[i], to, all, from, elements, root, posX, posY, repos, - diffX, - diffY, t)
  }
  if (element.parentNode.tagName == 'SECTION' || 
    element.parentNode === root || 
    element.parentNode.tagName == 'OL' ||
    element.parentNode.tagName == 'UL' ||
    element.parentNode.tagName == 'BLOCKQUOTE') {
    if (elements.length 
        ?  (!f || repos|| repositioned  || (Math.abs(diffX) + Math.abs(diffY) > 5)
            || (f && (Math.abs(f.height - t.height) + Math.abs(f.width - t.width)) > 5))
        : element.classList.contains('moving')) {
      if (!repositioned)
        repositioned = 1;
      element.classList.add('moving')
      element.style.left = Math.floor(shiftX) + 'px'
      element.style.top = Math.floor(shiftY) + 'px'
      element.style.height = (f && f.height || t.height) + 'px'
      element.style.width = (f && f.width || t.width) + 'px'
    }
  }

  return repositioned || !!repos;
}


CKEDITOR.plugins.add( 'structural', {
  init: function(editor) {

    var observer = new MutationObserver( function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === 'childList') {
          for (var j = 0; j < m.removedNodes.length; j++)
            if (m.removedNodes[j].nodeType == 1 &&
                m.removedNodes[j].tagName != 'SPAN')
              return fix(editor, mutations[i], observer);
          for (var j = 0; j < m.addedNodes.length; j++)
            if (m.addedNodes[j].nodeType == 1 &&
                m.addedNodes[j].tagName != 'SPAN')
              return fix(editor, mutations[i], observer);
        } else {
          if (m.target != editor.element.$
              && ((m.attributeName == 'class'
                && ((m.oldValue 
                  && (m.oldValue.indexOf('forced') > -1) != (m.target.className.indexOf('forced') > -1)))))) {
            return fix(editor, mutations[i], observer);
          }
        }
      }
    } );
    observer.observe( editor.element.$ , {
      attributes: true,
      childList: true,
      subtree: true,
      attributeOldValue: true,
      attributeFilter: ['class']
    });





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
    if (!url) {
      url = prompt('Enter url:')
      if (url.indexOf('//') == -1)
        url = 'http://' + url;
    }
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
    if (url.indexOf('//') == -1)
      url = 'http://' + url;
  }

  element.setAttribute('href', url)
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
  if (y > 0) {
    var previous = editor.dragging.previousSibling;
    if (previous) {
      var top = editor.dragtop - (editor.dragging.offsetTop - previous.offsetTop)
      var height = previous.offsetHeight
      for (var i = 0, children = previous.childNodes, child; child = children[i++];)
        if (child.offsetTop + child.offsetHeight / 2 > height - y)
          result.push(child)
    }
  } else {
    var next = editor.dragging
    var top = editor.dragtop + (next.offsetTop - editor.dragging.offsetTop)
    var height = next.offsetHeight
    for (var i = 0, children = next.childNodes, child; child = children[i++];)
      if (child.offsetTop + child.offsetHeight / 2 < - y)
        result.push(child)
  }
  return result
}

function updateToolbar(editor, force) {
  var selection = editor.getSelection();
  if (!selection) return;

  clearTimeout(editor.hidingButtons);
  editor.hidingButtons = setTimeout(function() {
  requestAnimationFrame(function() {

  var range = selection.getRanges()[0];
  if (!range || !range.startContainer) return;
  var start = range.startContainer.$;
  while (!start.tagName || start.tagName == 'STRONG' || start.tagName == 'EM' || start.tagName == 'SPAN' || start.tagName == 'A')
    start = start.parentNode;

  var startSection = start;
  while (startSection && startSection.tagName != 'SECTION')
    startSection = startSection.parentNode;

  var end = range.endContainer.$;
  while (!end.tagName || end.tagName == 'STRONG' || end.tagName == 'EM' || end.tagName == 'SPAN' || end.tagName == 'A')
    end = end.parentNode;

  var endSection = end;
  while (endSection && endSection.tagName != 'SECTION')
    endSection = endSection.parentNode;


  var sectionStyle = window.getComputedStyle(startSection);
  var sectionAfterStyle = window.getComputedStyle(startSection, ':after');

  // use final keyframe positions when animating
  if (editor.animating && editor.styleupdate) {
    var index = editor.styleupdate[0].indexOf(start);
    var indexS = editor.styleupdate[0].indexOf(startSection);
    if (index > -1 && indexS > -1) {
      var offsetHeight = editor.styleupdate[1][index].height;
      var sectionOffsetTop = editor.styleupdate[1][indexS].top;
      var offsetTop = editor.styleupdate[1][index].top + editor.offsetTop;
      var offsetLeft = editor.styleupdate[1][indexS].left + editor.offsetLeft;
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

  formatting.style.top= Math.max( offsetTop,
                          Math.min( window.scrollY + window.innerHeight - 20,
                            Math.min( offsetTop + start.offsetHeight,
                              Math.max(window.scrollY + 20, offsetTop + offsetHeight / 2)))) + 'px';


  formattingStyle.textContent = 
  " #formatting { color: " + sectionAfterStyle['color'] + "; background-color: " + sectionStyle['background-color'] + " }" + 
  " #formatting .cke_button { background-color: " + sectionStyle['background-color'] + "  }" +
" #formatting .picker:after { background-color: " + sectionAfterStyle['border-color'] + "  }" + 
" #formatting .picker:before { background-color: " + sectionAfterStyle['background-color'] + "  }" + 
" #formatting:before { background-color: " + sectionAfterStyle['outline-color'] + "  }"; 

  formatting.style.left = offsetLeft + 'px';
  formatting.style.display = 'block';

  var ui = editor.ui.instances
  if (range.startOffset != range.endOffset && start == end) {
    if (ui.Bold._.state == 2 && ui.Italic._.state == 2 && 
      ui.title._.state == 2 && ui.subtitle._.state == 2 && ui.heading._.state == 2) {
      var button = 'Bold'
    } else if (ui.Italic._.state == 2) {
      var button = 'Italic'
    } else {
      var button = 'clear';
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

  if (!button) return;
  var buttons = formatting.querySelectorAll('.cke .cke_button');
  var target = 'cke_button__' + button.toLowerCase()
  for (var i = 0, el; el = buttons[i++];) {
    if (el.classList.contains(target)) {
      el.removeAttribute('hidden')
    } else if (!el.classList.contains('cke_button__link')) {
      el.setAttribute('hidden', 'hidden')
    }
  }
  //for (editor.ui.instances.title._)

  console.log(button)
  });
}, 50)
}




