Editor.Snapshot = function(editor, elements, dimensions) {
  this.editor = editor;
  this.root = editor.element.$
  this.elements = elements || []
  this.dimensions = dimensions || [];
}

Editor.Snapshot.prototype.animate = function(section) {
  var snapshot = Editor.Snapshot.take(this.editor, true);

  if (!this.computed)
    this.compute(snapshot)
  snapshot.compute(this)

  if (!this.editor.animation) {
    this.editor.animation = snapshot;
  }

  console.log(snapshot, 123)

  snapshot.startTime = null;
  var duration = 300;
  var from = this;
  cancelAnimationFrame(this.timer);
  var onSingleFrame = function() {
    var time = + new Date;
    if (!snapshot.startTime)
      snapshot.startTime = time;
    
    var diff = time - snapshot.startTime;
    var progress = Math.min(1, diff / duration);
    console.log(progress)
    snapshot.morph(from, progress)
    if (diff <= duration) {
      snapshot.timer = requestAnimationFrame(onSingleFrame)
      snapshot.editor.fire('transitionEnd')
    }
  }
  // call immediately for safari, the reason why we dont use precise RAF timestamp 
  onSingleFrame()

  return snapshot;
};

Editor.Snapshot.prototype.compute = function(snapshot) {
  this.computed = true;
  var repositioned;
  for (var i = 0; i < this.root.children.length; i++)
    repositioned = this.normalize(this.root.children[i], snapshot, 0, 0, repositioned)
  return repositioned
}


Editor.Snapshot.prototype.get = function(element) {
  return this.dimensions[this.elements.indexOf(element)]
}

// apply new styles over given snapshot, at specific time point from 0 to 1
Editor.Snapshot.prototype.morph = function(snapshot, progress) {
  for (var i = 0; i < this.elements.length; i++) {
    var element = this.elements[i];
    var to = this.dimensions[i];
    var from = snapshot.get(element);
    if (/*xto.visible && */to.animated || from && from.animated) {
      to.animated = true
          if (element.tagName == 'H2' && element.textContent.indexOf('Beauty') > -1)
            debugger
      if (from) {
        if (from.currentWidth != null) {

          to.currentWidth  = from.currentWidth  + (to.width  - from.currentWidth)  * progress;
          to.currentHeight = from.currentHeight + (to.height - from.currentHeight) * progress;
          if (from.parent == to.parent) {
            var oldY = from.currentY
            var oldX = from.currentX// + ((from.left) - (to.left))
          
          } else{
            var oldY = (from.top - from.y) - (to.top - to.y)  + (from.currentY)
            var oldX = (from.left - from.x) - (to.left - to.x) + (from.currentX)
          }
          to.currentX      = oldX + (to.x - oldX) * progress;
          to.currentY      = oldY + (to.y - oldY) * progress;
        } else if (to.animated) {
          to.currentWidth  = from.width  + (to.width  - from.width)  * progress;
          to.currentHeight = from.height + (to.height - from.height) * progress;
          if (from.x == null) {
            to.currentX    = to.x;
            to.currentY    = to.y;
          } else {
            var oldY = (from.top - from.y) - (to.top - to.y)  + (from.y)
            var oldX = (from.left - from.x) - (to.left - to.x) + (from.x)
            to.currentX    = oldX + (to.x - oldX) * progress;
            to.currentY    = oldY + (to.y - oldY) * progress;
          }
        }
      } else {
        to.currentWidth  = to.width
        to.currentHeight = to.height
        to.currentY      = to.y
        to.currentX      = to.x

      }

      element.style.position = 'absolute';
      element.style.top = '0';
      element.style.left = '0';
      element.style.margin = '0'

      element.style.transform = 
      element.style.webkitTransform = 'translateX(' + to.currentX + 'px) translateY(' + to.currentY + 'px)'
      element.style.height = to.currentHeight + 'px';
      element.style.width = to.currentWidth + 'px';

    }
  }
}

Editor.Snapshot.take = function(editor, reset, focused) {
  var elements = Editor.Content(editor);
  if (reset) {
    editor.element.$.classList.remove('moving')
    editor.element.$.style.height = '';

    for (var i = 0; i < elements.length; i++) {
      //elements[i].style.webkitTransitionDuration = '0s'
      //elements[i].style.transitionDuration = '0s'
      elements[i].style.webkitTransform = 'none'
      elements[i].style.transform = 'none'
      elements[i].style.height = ''
      elements[i].style.width = ''
      elements[i].style.top = ''
      elements[i].style.left = ''
      elements[i].style.position = ''
      elements[i].style.left = ''
      elements[i].style.fontSize = ''
      elements[i].style.margin = ''
      //elements[i].classList.remove('unobserved')

    }
  }
  var dimensions = []
  //debugger

  Editor.measure(editor);
  for (var i = 0; i < elements.length; i++) {
    var box = {top: 0, left: 0, 
      height: elements[i].offsetHeight, 
      width: elements[i].offsetWidth, 
      parent: elements[i].parentNode}
    for (var parent = elements[i]; parent && (parent != editor.element.$); parent = parent.offsetParent) {
      box.top += parent.offsetTop;
      box.left += parent.offsetLeft;
    }
    box.visible = Editor.isBoxVisible(editor, box);
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
  
  return new Editor.Snapshot(editor, elements, dimensions)
}

Editor.Snapshot.prototype.isVisible = function(element) {
  var box = this.get(element)
  if (box)
    return Editor.isBoxVisible(this.editor, box)
}

Editor.Snapshot.prototype.updateVisibility = function(element) {
  for (var i = 0; i < this.dimensions.length; i++) {
    this.dimensions[i].visible = Editor.isBoxVisible(this.editor, this.dimensions[i]);
  }
}

// convert absolute positions to relative positions from parent
// figured out which elements will be visible and need to be animated
Editor.Snapshot.prototype.normalize = function(element, from, repositioned, diffX, diffY, p) {
  var f = from && from.get(element)
  var t = this.get(element);
  if (!t) {
    if (!f) return;
    t = f;
    this.elements.push(element)
    this.dimensions.push(t)
    f = null
  }

  if (f) {
    diffX = (diffX || 0) + t.left - f.left;
    diffY = (diffY || 0) + t.top - f.top;
  } else {
    diffX = 0;
    diffY = 0
    var shiftX = t.left - (p ? p.left : 0) ;
    var shiftY = t.top - (p ? p.top : 0);
  }

  var shiftX = t.left - (p ? p.left : 0) ;
  var shiftY = t.top - (p ? p.top : 0);
  var repos = false;
  for (var i = 0; i < element.children.length; i++) {
    repos = this.normalize(element.children[i], from, repos, - diffX, - diffY, t)
  }

  if (Editor.Content.isParagraph(element))
    if (!f || repos|| repositioned  || (Math.abs(diffX) + Math.abs(diffY) > 5))
      repositioned = 1;

  t.x = shiftX;
  t.y = shiftY;

  if (repositioned) {
    t.animated = true;
  }

  return repositioned || !!repos;
}
