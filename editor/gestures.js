

Editor.Pointer = function(editor, content) {
  delete Hammer.defaults.cssProps.userSelect;



  editor.gestures = new Hammer.Manager(document.body, {
    touchAction: ('ontouchend' in document.body) ? 'pan-x pan-y' : 'compute'
  });

  editor.gestures.add(new Hammer.Pan({ threshold: 1, pointers: 1 }));

  editor.gestures.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));
  editor.gestures.add(new Hammer.Tap());

  //editor.gestures.add(new Hammer.Rotate({ threshold: 0 })).recognizeWith(editor.gestures.get('pan'));
  //editor.gestures.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([editor.gestures.get('pan'), editor.gestures.get('rotate')]);

  // dont change focus/selection on button click
  document.body.addEventListener('mousedown', function(e) {
    if (!e.target.nodeType || e.target.tagName == 'svg' || e.target.tagName == 'use' || (e.target.classList && e.target.classList.contains('toolbar'))) {
      //if (editor.focusManager.hasFocus) {
        e.preventDefault()
      //}
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
      section.classList.add('below-the-fold')
      var gesture = editor.gestures.current = {
        section: section,
        sectionPalette: Editor.Section.getPaletteName(section),
        foreground: foreground,
        foregroundBox: foregroundBox,
        foregroundFinalBox: Object.create(foregroundBox),
        button: toolbar,
        buttonBox: editor.snapshot.get(toolbar),
        link: link
      }
      if (before) {
        gesture.before = before
        gesture.beforePalette = Editor.Section.getPaletteName(before)
        gesture.beforeForeground = beforeForeground
        gesture.beforeForegroundBox = beforeBox
        gesture.beforeForegroundFinalBox = Object.create(beforeBox)
        gesture.beforeForegroundDistance = beforeBox.top + beforeBox.height - foregroundBox.top
        gesture.above = Editor.Section.findMovableElements(before, section, true)
        gesture.below = Editor.Section.findMovableElements(section, before)

        gesture.above.forEach(function(el) {
          var box = editor.snapshot.get(el);
          if (!gesture.topmost || box.top < gesture.topmost)
            gesture.topmost = box.top;
        })

        gesture.below.forEach(function(el) {
          var box = editor.snapshot.get(el);
          if (!gesture.bottomost || box.top + box.height > gesture.bottomost)
            gesture.bottomost = box.top + box.height;
        })
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

    var action = '#move-icon'

    if (e.srcEvent.type == 'touchmove') {
      var myLocation = e.srcEvent.changedTouches[0];
      var realTarget = document.elementFromPoint(myLocation.clientX, myLocation.clientY);
      var anchor = Editor.Section.get(realTarget);
      gesture.anchorShiftX = -36
      gesture.anchorShiftY = -18
    } else {
      var anchor = Editor.Section.get(e.target);
      gesture.anchorShiftX = 0
      gesture.anchorShiftY = 0
    }
    gesture.anchor = anchor

    editor.fire('lockSnapshot')

    var x = e.deltaX - gesture.deltaX
    var y = e.deltaY - gesture.deltaY

    gesture.button.style.left = gesture.buttonBox.x + x + gesture.anchorShiftX + 'px'
    gesture.button.style.top = gesture.buttonBox.y + y + gesture.anchorShiftY + 'px'
    gesture.button.style.webkitTransform = gesture.button.style.transform = ''

    // reset resizing if dragged too much
    if (gesture.topmost && gesture.buttonBox.top + y + 64 < gesture.topmost) {
      y = -1;
    }
    if  (gesture.bottomost && gesture.buttonBox.top + y - 64 > gesture.bottomost) {
      y = 0;
    }
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
            if (Editor.Container.isBoxIntersecting(box, editor.snapshot.get(element))) {
              action = '#move-down-icon'
              Editor.Section.forEachClass(gesture.sectionPalette, element, 'add')
              return element;
            } else {
              Editor.Section.forEachClass(gesture.sectionPalette, element, 'remove')
            }
          })
        }
        gesture.currentBelow = gesture.below.filter(function(element) {
          Editor.Section.forEachClass(gesture.beforePalette, element, 'remove')
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
              action = '#move-up-icon'
              Editor.Section.forEachClass(gesture.beforePalette, element, 'add')
              return element;
            } else {
              Editor.Section.forEachClass(gesture.beforePalette, element, 'remove')
            }
          })
        }
        gesture.currentAbove = gesture.above.filter(function(element) {
          Editor.Section.forEachClass(gesture.sectionPalette, element, 'remove')
        });
      }

    }

    gesture.link.setAttributeNS("http://www.w3.org/1999/xlink", 'href', action)
    editor.fire('unlockSnapshot')
  })
  editor.gestures.on('panend', function(e) {
    var gesture = editor.gestures.current;
    document.body.classList.remove('dragging')
    if (!gesture) return;

    gesture.section.classList.remove('below-the-fold')
    editor.gestures.current = null;
    gesture.button.classList.remove('dragging')
    gesture.button.style.top = ''
    gesture.button.style.left = ''
    var x = e.deltaX - gesture.deltaX
    var y = e.deltaY - gesture.deltaY
    var buttonBox = editor.snapshot.get(gesture.button);
    gesture.buttonBox.x  = gesture.buttonBox.x + x + gesture.anchorShiftX 
    gesture.buttonBox.left  = gesture.buttonBox.left + x + gesture.anchorShiftX
    gesture.buttonBox.y  = gesture.buttonBox.y + y + gesture.anchorShiftY
    gesture.buttonBox.top  = gesture.buttonBox.top + y + gesture.anchorShiftY

    gesture.link.setAttributeNS("http://www.w3.org/1999/xlink", 'href', '#resize-section-icon')

    var isMovingContent = (gesture.currentBelow && gesture.currentBelow.length) ||
                          (gesture.currentAbove && gesture.currentAbove.length)

    editor.fire('saveSnapshot');

    var distance = (Math.abs(y) + Math.abs(x) / 2);
    // reset resizing if dragged too much
    if ((gesture.topmost && gesture.buttonBox.top + y + 32 < gesture.topmost)
    ||  (gesture.bottomost && gesture.buttonBox.top + y - 64 > gesture.bottomost)) {
      y = 0;
    }
    if (gesture.before) {
      var beforeBox = editor.snapshot.get(gesture.beforeForeground);
      var box = editor.snapshot.get(gesture.foreground);
      box.y      = gesture.foregroundFinalBox.y;
      box.top    = gesture.foregroundFinalBox.top;
      box.height = gesture.foregroundFinalBox.height;
      beforeBox.height = gesture.beforeForegroundFinalBox.height;

      if (y < 0) {
        Editor.Snapshot.shiftChildren(editor, gesture.section, y)
      }
      if (y > - gesture.beforeForegroundDistance - 10) {
        Editor.Snapshot.shiftChildren(editor, gesture.section, (gesture.beforeForegroundDistance + 10 + y))
      }
    }

    if (isMovingContent) {
      if (gesture.before) {
        editor.dragbookmark = editor.getSelection().createBookmarks()

        var first = Editor.Section.getFirstChild(gesture.section)
        var last = gesture.before.lastElementChild;
        if (gesture.currentAbove && gesture.currentAbove.length) {

          gesture.currentAbove.forEach(function(element) {
            gesture.section.insertBefore(element, first)
            gesture.section.classList.add('forced')
            Editor.Section.forEachClass(gesture.sectionPalette, element, 'remove')
          })
        }

        if (gesture.currentBelow && gesture.currentBelow.length) {

          gesture.currentBelow.forEach(function(element) {
            Editor.Section.forEachClass(gesture.beforePalette, element, 'remove')
            gesture.before.insertBefore(element, last.nextSibling)
            gesture.before.classList.add('forced')
          })
        }
      }
    } else if (gesture.anchor && gesture.anchor != gesture.section && distance > 100) {
      editor.dragbookmark = editor.getSelection().createBookmarks()
      gesture.section.classList.add('forced');
      if (gesture.anchor.previousElementSibling == gesture.section)
        gesture.section.parentNode.insertBefore(gesture.section, gesture.anchor.nextElementSibling)
      else
        gesture.section.parentNode.insertBefore(gesture.section, gesture.anchor)

    } else if (gesture.before) {
      editor.snapshot = editor.snapshot.animate();
    }
    editor.fire('saveSnapshot');
  })

  editor.gestures.on('tap', function(e) {
    var target = e.srcEvent.target.correspondingUseElement || 
                 e.srcEvent.target.correspondingElement || 
                 e.srcEvent.target;
    for (var p = target; p; p = p.parentNode) {
      if (p.classList && p.classList.contains('preview') && p.classList.contains('content')) {
        Editor.Picker.choose(editor, p)
        e.preventDefault()
        return;
      }
      // buttons
      if (p.tagName == 'svg') {
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
        } else if (p.classList.contains('star') || p.classList.contains('unstar')) {
          Editor.Section.star(editor, editor.currentToolbar, p);
          Editor.Chrome.Toolbar.close(editor)
          e.preventDefault()
          return
        } else if (p.classList.contains('palette')) {
          Editor.Picker(editor, editor.currentToolbar, 'schema', Editor.Picker.Schema);
          Editor.Chrome.Toolbar.close(editor)
          e.preventDefault()
          return
        }
      }
    }
  })

  editor.on('drop', function(e) {
    // disallow pasting block content into paragraphs and headers
    var html = e.data.dataTransfer.getData('text/html')
    console.log('drop', html)
    
    var newRange = Editor.Selection.moveToNewParagraphAfterPicture(editor, e.data.dropRange);
    if (!newRange) {
      if (html && html.match(/<(?:li|h1|h2|h3|p|ul|li|blockquote|picture|img)/i)) {
        newRange = Editor.Selection.moveToAfterParagraph(editor, e.data.dropRange);
      }
    }

    if (newRange) {
      e.data.dropRange = newRange
      e.data.target = newRange.startContainer;
    }
    Editor.Selection.onChange(editor, true)
  })
}
