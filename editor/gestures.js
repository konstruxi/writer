

Editor.Pointer = function(editor, content) {
  delete Hammer.defaults.cssProps.userSelect;


  editor.gestures = new Hammer.Manager(document.body);

  editor.gestures.add(new Hammer.Pan({ threshold: 10, pointers: 1 }));

  editor.gestures.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));
  editor.gestures.add(new Hammer.Tap());

  //editor.gestures.add(new Hammer.Rotate({ threshold: 0 })).recognizeWith(editor.gestures.get('pan'));
  //editor.gestures.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([editor.gestures.get('pan'), editor.gestures.get('rotate')]);

  document.body.addEventListener('mousedown', function(e) {
    if (!e.target.nodeType || e.target.tagName == 'svg' || e.target.tagName == 'use') {
      e.preventDefault()
      return;
    }
  }, true)

  editor.gestures.current = null;

  editor.gestures.on('panstart', function(e) {
    editor.fire('lockSnapshot')
    // figure out if boundary can be moved or section itself should be moved
    if (e.target.classList && e.target.classList.contains('toolbar')) {
      e.preventDefault();
      var style = window.getComputedStyle(e.target);
      var section = Editor.Section.get(e.target);
      e.target.classList.add('dragging')
      document.body.classList.add('dragging')
      var foreground = section.getElementsByClassName('foreground')[0];
      var foregroundBox = editor.snapshot.get(foreground, true);

      var box = editor.snapshot.get(section)
      var before = Editor.Section.getSectionAbove(editor, section);
      if (before) {
        var beforeForeground = before.getElementsByClassName('foreground')[0];
        var beforeBox = editor.snapshot.get(beforeForeground, true);
        before.classList.add('above-the-fold')
      }
      section.classList.add('below-the-fold')
      editor.gestures.current = {
        before: before,
        beforeForeground: beforeForeground,
        beforeForegroundBox: beforeBox,
        beforeForegroundDistance: before && beforeBox.top + beforeBox.height - foregroundBox.top,

        above: before && Editor.Section.findMovableElements(before, section, true),
        below: before && Editor.Section.findMovableElements(section, before),

        section: section,
        foreground: foreground,
        foregroundBox: foregroundBox,
        button: e.target,
        buttonLeft: parseFloat(style.left) || 0,
        buttonTop:  parseFloat(style.top) || 0
      }
    }
    editor.fire('unlockSnapshot')
  })
  editor.gestures.on('pan', function(e) {
    var gesture = editor.gestures.current;
    if (!gesture) return;
    if (gesture.deltaY == null) {
      gesture.deltaY = e.deltaY
      gesture.deltaX = e.deltaX
    }



    editor.fire('lockSnapshot')

    var x = e.deltaX - gesture.deltaX
    var y = e.deltaY - gesture.deltaY

    gesture.button.style.left = gesture.buttonLeft + x + 'px'
    gesture.button.style.top  = gesture.buttonTop + y + 'px'


    if (gesture.beforeForeground) {
      // update styles
      if (y < 0) {
        if (y < gesture.beforeForegroundDistance + 10) {
          gesture.beforeForeground.style.height = gesture.beforeForegroundBox.height - gesture.beforeForegroundDistance - 10 + y + 'px'
        } else {
          gesture.beforeForeground.style.height = gesture.beforeForegroundBox.height + 'px';
        }
        gesture.foreground.style.top = gesture.foregroundBox.y + y + 'px'
        gesture.foreground.style.height = gesture.foregroundBox.height - y + 'px'
      } else {
        if (y > - gesture.beforeForegroundDistance - 10) {
          gesture.foreground.style.top = gesture.foregroundBox.y + gesture.beforeForegroundDistance + 10 + y + 'px'
          gesture.foreground.style.height = gesture.foregroundBox.height - gesture.beforeForegroundDistance - 10 - y + 'px'
        } else {
          gesture.foreground.style.top = gesture.foregroundBox.y + 'px';
          gesture.foreground.style.height = gesture.foregroundBox.height + 'px';
        }
        gesture.beforeForeground.style.height = gesture.beforeForegroundBox.height + y + 'px';
      }

      // update box dimensions in snapshot
      var box = editor.snapshot.get(gesture.foreground);
      var beforeBox = editor.snapshot.get(gesture.beforeForeground);
      gesture.before.classList.remove('below-the-fold')
      if (y < 0) {
        box.top = gesture.foregroundBox.top + y;
        box.y = gesture.foregroundBox.y + y;
        box.height = gesture.foregroundBox.height - y;

        if (y < gesture.beforeForegroundDistance + 10) {
          beforeBox.height = gesture.beforeForegroundBox.height - gesture.beforeForegroundDistance + 10 - y
        }
      } else {
        if (y > - gesture.beforeForegroundDistance - 10) {
          box.y = gesture.foregroundBox.y + gesture.beforeForegroundDistance + 10 + y
          box.top = gesture.foregroundBox.top + gesture.beforeForegroundDistance + 10 + y
          box.height = gesture.foregroundBox.height - gesture.beforeForegroundDistance + 10 + y
        }
        beforeBox.height = gesture.beforeForegroundBox.height + y  
      }

      console.log(gesture.above, box, gesture.above.filter(function(element) {
        return Editor.Container.isBoxIntersecting(box, editor.snapshot.get(element))
      }))
    }

    editor.fire('unlockSnapshot')
  })
  editor.gestures.on('panend', function(e) {
    var gesture = editor.gestures.current;
    if (!gesture) return;
    gesture.section.classList.remove('below-the-fold')
    editor.gestures.current = null;
    gesture.button.classList.remove('dragging')
    gesture.button.style.top = ''
    gesture.button.style.left = ''
    document.body.classList.remove('dragging')
    var x = e.deltaX - gesture.deltaX
    var y = e.deltaY - gesture.deltaY


    editor.snapshot = editor.snapshot.animate()
  })

  editor.gestures.on('tap', function(e) {
    var target = e.srcEvent.target.correspondingUseElement || 
                 e.srcEvent.target.correspondingElement || 
                 e.srcEvent.target;
    for (var p = target; p; p = p.parentNode)
      if (p.tagName == 'svg') 
        if (p.classList.contains('enlarge')) {
          Editor.Section.enlarge(editor, editor.currentToolbar);
          Editor.Chrome.Toolbar.close(editor)
          e.preventDefault()
          return
        } else if (p.classList.contains('shrink')) {
          Editor.Section.shrink(editor, editor.currentToolbar);
          Editor.Chrome.Toolbar.close(editor)
          e.preventDefault()
          return
        } else if (p.classList.contains('split')) {
          Editor.Section.insertBefore(editor, editor.currentToolbar);
          Editor.Chrome.Toolbar.close(editor)
          e.preventDefault()
          return
        } else if (p.classList.contains('toolbar')) {
          var section = Editor.Section.get(p);
          Editor.Chrome.Toolbar.open(editor, section, p);
          e.preventDefault()
          return
        }
  })

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



