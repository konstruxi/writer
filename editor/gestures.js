

Editor.Pointer = function(editor, content) {
  delete Hammer.defaults.cssProps.userSelect;


  editor.gestures = new Hammer.Manager(document.body);

  editor.gestures.add(new Hammer.Pan({ threshold: 1, pointers: 1 }));

  editor.gestures.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));
  editor.gestures.add(new Hammer.Tap());

  editor.gestures.add(new Hammer.Rotate({ threshold: 0 })).recognizeWith(editor.gestures.get('pan'));
  editor.gestures.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([editor.gestures.get('pan'), editor.gestures.get('rotate')]);

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
    for (var toolbar = e.target; toolbar; toolbar = toolbar.parentNode)
      if (toolbar.classList && toolbar.classList.contains('toolbar'))
        break;

    if (toolbar) {
      e.preventDefault();
      var section = Editor.Section.get(toolbar);
      console.log(toolbar, section)
      toolbar.classList.add('dragging')
      document.body.classList.add('dragging')
      var foreground = section.getElementsByClassName('foreground')[0];
      var foregroundBox = editor.snapshot.get(foreground, true);
      var box = editor.snapshot.get(section)

      // allow big sections to move their boundaries
      if (!section.classList.contains('small')) {
        var before = Editor.Section.getSectionAbove(editor, section);
        if (before && !before.classList.contains('small')) {
          var beforeForeground = before.getElementsByClassName('foreground')[0];
          var beforeBox = editor.snapshot.get(beforeForeground, true);
          before.classList.add('above-the-fold')
        } else {
          before = null;
        }
      }
      var link = toolbar.getElementsByTagName('use')[0];
      link.setAttributeNS("http://www.w3.org/1999/xlink", 'href', '#move-icon')
      section.classList.add('below-the-fold')
      editor.gestures.current = {
        before: before,
        beforePalette: before && Editor.Section.getPaletteName(before),
        beforeForeground: beforeForeground,
        beforeForegroundBox: beforeBox,
        beforeForegroundFinalBox: before && Object.create(beforeBox),
        beforeForegroundDistance: before && beforeBox.top + beforeBox.height - foregroundBox.top,

        above: before && Editor.Section.findMovableElements(before, section, true),
        below: before && Editor.Section.findMovableElements(section, before),

        section: section,
        sectionPalette: Editor.Section.getPaletteName(section),
        foreground: foreground,
        foregroundBox: foregroundBox,
        foregroundFinalBox: Object.create(foregroundBox),
        button: toolbar,
        buttonBox: editor.snapshot.get(toolbar)
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

    var anchor = Editor.Section.get(e.srcEvent.target);

    editor.fire('lockSnapshot')

    var x = e.deltaX - gesture.deltaX
    var y = e.deltaY - gesture.deltaY

    gesture.button.style.left = gesture.buttonBox.x - gesture.buttonBox.left + e.center.x + 16 + 'px'
    gesture.button.style.top = gesture.buttonBox.y - gesture.buttonBox.top + e.center.y + editor.scrollY - 4 + 'px'
    gesture.button.style.webkitTransform = gesture.button.style.transform = ''

    if (gesture.beforeForeground) {

      // update box dimensions in snapshot
      var box = gesture.foregroundFinalBox;
      var beforeBox = gesture.beforeForegroundFinalBox;
      gesture.before.classList.remove('below-the-fold')
      if (y < 0) {
        if (gesture.above.length) {
          if (y < gesture.beforeForegroundDistance + 10) {
            gesture.beforeForeground.style.height = gesture.beforeForegroundBox.height - gesture.beforeForegroundDistance - 10 + y + 'px'
          } else {
            gesture.beforeForeground.style.height = gesture.beforeForegroundBox.height + 'px';
          }
          box.top = gesture.foregroundBox.top + y;
          box.y = gesture.foregroundBox.y + y;
          box.height = gesture.foregroundBox.height - y;

          gesture.foreground.style.top = box.y + 'px'
          gesture.foreground.style.height = box.height + 'px'


          if (y < gesture.beforeForegroundDistance + 10) {
            beforeBox.height = gesture.beforeForegroundBox.height - (gesture.beforeForegroundDistance + 10 - y)
          }

          // mark selected elements
          gesture.currentAbove = gesture.above.filter(function(element) {
            if (anchor == gesture.before && 
              Editor.Container.isBoxIntersecting(box, editor.snapshot.get(element))) {
              element.classList.add('temp-' + gesture.sectionPalette)
              return element;
            } else {
              element.classList.remove('temp-' + gesture.sectionPalette)
            }
          })
        }
        if (gesture.below)
          gesture.currentBelow = gesture.below.filter(function(element) {
            element.classList.remove('temp-' + gesture.beforePalette)
          });
      } else {
        if (gesture.below.length) {
          if (y > - gesture.beforeForegroundDistance - 10) {
            gesture.foreground.style.top = gesture.foregroundBox.y + gesture.beforeForegroundDistance + 10 + y + 'px'
            gesture.foreground.style.height = gesture.foregroundBox.height - gesture.beforeForegroundDistance - 10 - y + 'px'
          } else {
            gesture.foreground.style.top = gesture.foregroundBox.y + 'px';
            gesture.foreground.style.height = gesture.foregroundBox.height + 'px';
          }
          gesture.beforeForeground.style.height = gesture.beforeForegroundBox.height + y + 'px';

          if (y > - gesture.beforeForegroundDistance - 10) {
            box.y = gesture.foregroundBox.y + (gesture.beforeForegroundDistance + 10 + y)
            box.top = gesture.foregroundBox.top + (gesture.beforeForegroundDistance + 10 + y)
            box.height = gesture.foregroundBox.height - (gesture.beforeForegroundDistance + 10 + y);
          }
          beforeBox.height = gesture.beforeForegroundBox.height + y  

          // mark selected elements
          gesture.currentBelow = gesture.below.filter(function(element) {
            if (Editor.Container.isBoxIntersecting(beforeBox, editor.snapshot.get(element))) {
              element.classList.add('temp-' + gesture.beforePalette)
              return element;
            } else {
              element.classList.remove('temp-' + gesture.beforePalette)
            }
          })
        }
        if (gesture.above)
          gesture.currentAbove = gesture.above.filter(function(element) {
            element.classList.remove('temp-' + gesture.sectionPalette)
          });
      }

    }

    editor.fire('unlockSnapshot')
  })
  editor.gestures.on('panend', function(e) {
    var gesture = editor.gestures.current;
    document.body.classList.remove('dragging')
    if (!gesture) return;

    var anchor = Editor.Section.get(e.srcEvent.target);
    gesture.section.classList.remove('below-the-fold')
    editor.gestures.current = null;
    gesture.button.classList.remove('dragging')
    gesture.button.style.top = ''
    gesture.button.style.left = ''
    var x = e.deltaX - gesture.deltaX
    var y = e.deltaY - gesture.deltaY
    var link = gesture.button.getElementsByTagName('use')[0];
    link.setAttributeNS("http://www.w3.org/1999/xlink", 'href', '#resize-section-icon')

    var isMovingContent = (gesture.currentBelow && gesture.currentBelow.length) ||
                          (gesture.currentAbove && gesture.currentAbove.length)

    if (!isMovingContent && (!anchor || anchor == gesture.section))
      return;
    editor.fire('saveSnapshot');


    if (isMovingContent) {
      if (gesture.before) {
        editor.dragbookmark = editor.getSelection().createBookmarks()
        var beforeBox = editor.snapshot.get(gesture.beforeForeground);
        var box = editor.snapshot.get(gesture.foreground);

        var first = Editor.Section.getFirstChild(gesture.section)
        var last = gesture.before.lastElementChild;
        if (gesture.currentAbove && gesture.currentAbove.length) {

          Editor.Snapshot.shiftChildren(editor, gesture.section, y)
          gesture.currentAbove.forEach(function(element) {
            gesture.section.insertBefore(element, first)
            gesture.section.classList.add('forced')
            element.classList.remove('temp-' + gesture.sectionPalette)
          })
        }
        box.y      = gesture.foregroundFinalBox.y;
        box.top    = gesture.foregroundFinalBox.top;
        box.height = gesture.foregroundFinalBox.height;
        beforeBox.height = gesture.beforeForegroundFinalBox.height;

        if (gesture.currentBelow && gesture.currentBelow.length) {

          gesture.currentBelow.forEach(function(element) {
            element.classList.remove('temp-' + gesture.beforePalette)
            gesture.before.insertBefore(element, last.nextSibling)
            gesture.before.classList.add('forced')
          })

          if (y > - gesture.beforeForegroundDistance - 10) {
            Editor.Snapshot.shiftChildren(editor, gesture.section, (gesture.beforeForegroundDistance + 10 + y))
          }
        }
      }
    } else if (anchor && anchor != gesture.section) {
      gesture.section.classList.add('forced');
      if (anchor.previousElementSibling == gesture.section)
        gesture.section.parentNode.insertBefore(gesture.section, anchor.nextElementSibling)
      else
        gesture.section.parentNode.insertBefore(gesture.section, anchor)

    }
    editor.fire('saveSnapshot');
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
        } else if (p.classList.contains('menu')) {
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


