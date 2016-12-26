

Editor.Pointer = function(editor, content) {
  delete Hammer.defaults.cssProps.userSelect;

  editor.pointer = new Hammer(content, {
    
  })

  editor.pointer.on('tap', function(e) {
    for (var p = e.target; p; p = p.parentNode)
      if (p.classList) 
        if (p.classList.contains('enlarge')) {
          var section = Editor.Section.get(p);
          Editor.Section.enlarge(editor, section);
          e.preventDefault()
          return
        } else if (p.classList.contains('shrink')) {
          var section = Editor.Section.get(p);
          Editor.Section.shrink(editor, section);
          e.preventDefault()
          return
        }
  })

  editor.dragging = null;
  editor.dragstart = null;
  editor.dragged = null
  editor.dragzone = document.createElement('div')
  editor.dragzone.id = 'dragzone'

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

  editor.on('drop', function(e) {
    // disallow pasting block content into paragraphs and headers
    var html = e.data.dataTransfer.getData('text/html')
    console.log('drop', html)
    if (html && html.match(/<(?:li|h1|h2|h3|p|ul|li|blockquote|picture|img)/i)) {
      Editor.Selection.moveToEditablePlace(editor, e.data.dropRange);
      e.data.dropRange = editor.getSelection().getRanges()[0]
      e.data.target = e.data.dropRange.startContainer;
    }
    Editor.Selection.onChange(editor, true)
  })
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
