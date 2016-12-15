Editor.Animation = function(editor, snapshot, section, callback) {
  elements = snapshot[0];
  dimensions = snapshot[1];


  var update = Editor.Animation.snapshotStyles(editor, true);
  var all = update[0]
  var current = update[1];

  if (editor.transformsnapshot) {
    var transitioned = []
    for (var i = 0; i < all.length; i++) {
      var j = editor.transformsnapshot[0].indexOf(all[i]);
      transitioned.push(j > -1 ? editor.transformsnapshot[1][j] : null)
    }
    editor.transformsnapshot = null;
  }
  editor.styleupdate = update;



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
        after.style.webkitTransition = 'none'
        elements.push(after)
        dimensions.push(dimensions[elements.indexOf(before)])
      }
    }
    editor.element.$.classList.add('moving')
    editor.element.$.style.height = snapshot[3] + 'px';

  }
  editor.element.$.classList.add('animating');
  updateToolbar(editor, true)
  togglePicker(editor, true)
  
  var repositioned = false;
  var content = editor.element.$;
  for (var i = 0; i < content.children.length; i++) {
    repositioned = shift(editor, content.children[i], current, all, dimensions, elements, content, 0, 0, repositioned, transitioned)
  }


  clearTimeout(editor.resetstyles)

  // ios needs 2 frames to avoid transition for some reason
  cancelAnimationFrame(editor.animating);
  editor.animating = requestAnimationFrame(function() {
  cancelAnimationFrame(editor.animating);
  editor.animating = requestAnimationFrame(function() {
      editor.fire( 'lockSnapshot');
      editor.element.$.style.transition = '';
      editor.element.$.style.webkitTransition = '';
      editor.element.$.style.height = update[3] + 'px';

      for (var i = 0; i < all.length; i++) {
        all[i].style.transition = 
        all[i].style.webkitTransition = '';
        all[i].classList.remove('new')
      }


      if (morphing) {
        for (var i = 0; i < update[2].length; i += 2) {
          update[2][i].style.transition = ''
          update[2][i].style.webkitTransition = ''
          update[2][i].style.fontSize = update[2][i + 1];
        }
      }

      var repositioned = false;
      for (var i = 0; i < content.children.length; i++) {
        repositioned = shift(editor, content.children[i], current, all, [], [], content, 0, 0, repositioned)
      }

      editor.fire( 'unlockSnapshot' )

      clearTimeout(editor.resetstyles)
      editor.resetstyles = setTimeout(function() {
        editor.fire( 'lockSnapshot');
        if (editor.toolbarsToRender) {
          var toolbars = editor.toolbarsToRender;
          setTimeout(function() {
            requestAnimationFrame(function() {
              toolbars.forEach(function(toolbar) {
                toolbar.element.innerHTML = toolbar.content;
              })
            })
          }, 100)
          editor.toolbarsToRender = null
        }
        editor.element.$.classList.remove('animating');
        editor.animating = null
        editor.styleupdate = null
        editor.element.$.style.height = '';
        editor.element.$.classList.remove('moving')
        var all = Array.prototype.slice.call(content.getElementsByTagName('*'));
        for (var i = 0; i < all.length; i++) {
          all[i].classList.remove('moving')
          all[i].classList.remove('was-moving')
//          if (all[i].classList.contains('unobserved') && all[i].tagName == 'SECTION' && all[i].textContent.indexOf('A11Y') > -1) {
//            debugger
//          }
          all[i].classList.remove('unobserved')
          all[i].style.height = ''
          all[i].style.width = ''
          if (Editor.useTransforms) {
            all[i].style.transform = 
            all[i].style.webkitTransform = ''
          } else {
            all[i].style.left = ''
            all[i].style.top = ''
          }
          all[i].style.fontSize = ''
        }
        editor.fire( 'unlockSnapshot' )
      }, 300)
    }, 500)
})

  return update;
};

Editor.Animation.snapshotTransforms = function(editor, soft) {
  if ((soft ? editor.animating : !editor.animating) || !Editor.useTransforms)
    return
  var elements = Editor.Content(editor);
  var transitioned = []
  for (var i = 0; i < elements.length; i++) {
    var box = null;
    //for (var p = elements[i]; (p = p.parentNode) != editor.element.$;)
    //  if (p.style.transform || p.style.webkitTransform) {
        var bbox = elements[i].getBoundingClientRect()
        box = {top: bbox.top - editor.box.top, 
                  left: bbox.left - editor.box.left, 
          height: bbox.height, width: bbox.width, parent: elements[i].parentNode}
        //break;
    //  }
    transitioned.push(box)
  }
  return editor.transformsnapshot = [elements, transitioned]
}

Editor.Animation.snapshotStyles = function(editor, reset, focused) {

  var elements = Editor.Content(editor);
    

  if (reset) {
    editor.element.$.classList.remove('moving')
    editor.element.$.style.height = '';

    for (var i = 0; i < elements.length; i++) {
      elements[i].style.webkitTransitionDuration = '0s'
      elements[i].style.transitionDuration = '0s'
      elements[i].style.height = ''
      elements[i].style.width = ''
      if (Editor.useTransforms) {
        elements[i].style.transform = ''
        elements[i].style.webkitTransform = ''
      } else {
        elements[i].style.top = ''
        elements[i].style.left = ''
      }
      elements[i].style.fontSize = ''
      if (elements[i].classList.contains('moving')) {
        elements[i].classList.remove('moving')
        elements[i].classList.add('was-moving')
      } 
      //elements[i].classList.remove('unobserved')

    }
  }
  var dimensions = []

  editor.measure();
  for (var i = 0; i < elements.length; i++) {
    var box = {top: 0, left: 0, 
      height: elements[i].offsetHeight, width: elements[i].offsetWidth, parent: elements[i].parentNode}
    for (var parent = elements[i]; parent && (parent != editor.element.$); parent = parent.offsetParent) {
      box.top += parent.offsetTop;
      box.left += parent.offsetLeft;
    }
    dimensions.push(box)
  }
  
  var bookmark = editor.dragbookmark;

  if (editor.refocusing) {
    var focused = editor.refocusing;
    editor.refocusing = undefined;
  } else {
    var selection = editor.getSelection()
    var range = selection.getRanges()[0];
    if (range) {
      if (bookmark && bookmark.length == 1) {
        var ancestor = Editor.Content.getEditableAscender(bookmark[0].startNode.$);
        if (ancestor)
          var selection = [ancestor, window.getComputedStyle(ancestor)['font-size']]
      } else if (range.startContainer.$ == range.endContainer.$) {
        var ancestor = Editor.Content.getEditableAscender(range.startContainer.$);
        var selection = [ancestor, window.getComputedStyle(ancestor)['font-size']]
      } else {
        // iterator may cause a reflow
        var iterator = selection.getRanges()[0].createIterator();
        iterator.enforceRealBlocks = false;
        var selection = []
        for (var element; element = iterator.getNextParagraph();) {
          var selected = element.$;
          if (selected) {
            if (!focused) focused = selected;
            var fontSize = window.getComputedStyle(selected)['font-size'];
            selection.push(selected, fontSize)
          }
        }
      }
    }
  }

  if (reset && (focused || bookmark)) {
    var offsetTop = 0;
    for (var p = focused; p; p = p.offsetParent)
      offsetTop += p.offsetTop;


    //requestAnimationFrame(function() {
      editor.dragbookmark = null;
      var selection = editor.getSelection();
      var range = editor.createRange();
      // restore selection
      var range = editor.createRange();

      if (focused) {
        range.moveToElementEditEnd(new CKEDITOR.dom.element(focused))
        var selection = editor.getSelection()
        selection.selectRanges([range])
      } else if (bookmark && bookmark[0]) {
        var bm = bookmark[0].startNode.$;
        for (; bm.parentNode; bm = bm.parentNode) {
          if (bm == editor.element.$) {
            editor.getSelection().selectBookmarks(bookmark);
            break;
          }
        }
      }
      if (bookmark && bookmark[0] && bookmark[0].startNode.$.parentNode)
        bookmark[0].startNode.$.parentNode.removeChild(bookmark[0].startNode.$)




      //if (window.scrollY > offsetTop - 75/* || window.scrollY + window.innerHeight / 3 <  offsetTop - 75*/) {
      //  window.scrollTo(0, offsetTop - window.innerHeight / 6)
      //}
    //})
  }
  
  return [elements, dimensions, selection, reset && editor.element.$.offsetHeight || editor.offsetHeight];
}



function shift(editor, element, to, all, from, elements, root, parentX, parentY, repositioned, transitioned, diffX, diffY, p) {
  var index = all.indexOf(element);
  var f = transitioned && transitioned[index] || from[elements.indexOf(element)]
  var t = to[index]
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
    repos = shift(editor, element.children[i], to, all, from, elements, root, posX, posY, repos, transitioned, - diffX, - diffY, t)
  }
  if (element.parentNode.tagName == 'SECTION' || 
    element.parentNode === root || 
    element.parentNode.tagName == 'OL' ||
    element.parentNode.tagName == 'UL' ||
    element.parentNode.tagName == 'BLOCKQUOTE') {
    if (element.classList.contains('unobserved') || (!f || !isBoxVisible(editor, f)) && !isBoxVisible(editor, t)) {
      element.classList.add('unobserved')
    } else {
      if (elements.length 
          ?  (!f || repos|| repositioned  || (Math.abs(diffX) + Math.abs(diffY) > 5)
              || (f && (Math.abs(f.height - t.height) + Math.abs(f.width - t.width)) > 5))
          : element.classList.contains('moving')) {
        if (!repositioned)
          repositioned = 1;
        element.classList.remove('was-moving')
        element.classList.add('moving')
        if (Editor.useTransforms) {
          element.style.webkitTransform =
          element.style.transform = 'translateX(' + Math.ceil(shiftX) + 'px) translateY(' + Math.ceil(shiftY) + 'px)'
        } else {
          element.style.left = Math.floor(shiftX) + 'px'
          element.style.top = Math.floor(shiftY) + 'px'
        }
        t.x = shiftX;
        t.y = shiftY;
        element.style.height = (f && f.height || t.height) + 'px'
        element.style.width = (f && f.width || t.width) + 'px'
      }
    }
  }

  return repositioned || !!repos;
}

isBoxVisible = function(editor, box) {
  var top = box.top;
  var bottom = box.top + box.height
  var topmost = editor.scrollY - editor.offsetTop - editor.innerHeight / 4
  var bottomost = editor.scrollY + editor.innerHeight - editor.offsetTop + editor.innerHeight / 4;

  return ((top >= topmost && top    <= bottomost)
    || (bottom >= topmost && bottom <= bottomost)
    ||    (top <= topmost && bottom >= bottomost))

}
