Editor.Snapshot = function(editor, elements, dimensions, selected) {
  this.editor = editor;
  this.root = editor.element.$
  this.elements = elements || []
  this.dimensions = dimensions || [];
  this.selected = selected;
}

// attempt to restore identity of selected elements between snapshots
Editor.Snapshot.prototype.migrateSelectedElements = function(snapshot) {
  if (snapshot.selected && this.selected) {
    var selected = this.selected.slice();
    for (var i = 0; i < selected.length; i += 2) {
      var after = selected[i];
      var afterSize = selected[i + 1];

      if (snapshot.selected.indexOf(after) > -1) {
        selected.splice(i, 2);
        i -= 2;
        continue;
      }
      if (snapshot.get(after) || this.get(before))
        continue;
      var before = snapshot.selected[i];
      var beforeSize = snapshot.selected[i + 1];

      if (this.get(before))
        continue;
      
      var box = this.get(after);
      if (!box)
       continue;

      var old = snapshot.get(before)
      if (old) {
        old.fontSize = parseFloat(beforeSize);
        box.fontSize = parseFloat(afterSize);
      }
      if (!snapshot.get(after)) {
        snapshot.elements.push(after)
        snapshot.dimensions.push(old)
      }
    }
    //editor.element.$.classList.add('moving')
    //editor.element.$.style.height = snapshot[3] + 'px';

  }
}
Editor.Snapshot.prototype.removeElement = function(element) {
  var index = this.elements.indexOf(element);
  if (index == -1) return;// || this.selected && this.selected.indexOf(element) > -1) return;

  //this.elements.splice(index, 1);
  var box = this.dimensions[index];
  for (var property in box) {
    if (property.indexOf('Spring') > -1) {
      var spring = box[property];
      box[property] = false;
      var j = this.animating.indexOf(spring);
      if (j > -1)
        this.animating.splice(j, 1)
    }
  }
}
Editor.Snapshot.prototype.animate = function(section) {
  var snapshot = Editor.Snapshot.take(this.editor, true);

  snapshot.animating = (this.animating || [])

  //snapshot.locked = true;

  if (!this.computed)
    this.compute(snapshot)
  snapshot.compute(this)
  var migrated = false;
  snapshot.startTime = null;
  var duration = 300;
  var from = this;
  if (this.timer)
    cancelAnimationFrame(this.timer);
  if (this.reanimate)
    cancelAnimationFrame(this.reanimate);
  if (snapshot.timer)
    cancelAnimationFrame(snapshot.timer);
  if (snapshot.reanimate)
    cancelAnimationFrame(snapshot.reanimate)
  var onSingleFrame = function() {
    var time = + new Date;
    var start = snapshot.startTime || time
    snapshot.morph(from, (start + Math.floor((time - start) / 1)), start)

    if (!migrated) {
      migrated = true;
      snapshot.migrateSelectedElements(from)
    }

    if (!snapshot.startTime)
      snapshot.startTime = time;

    if (snapshot.animating.length) {
      snapshot.timer = requestAnimationFrame(onSingleFrame)
    } else {
      snapshot.editor.fire('transitionEnd')
      snapshot.reset(null, true)
      console.log('animated in', time -  snapshot.startTime)
    }
  }
  // call immediately for safari, the reason why we dont use precise RAF timestamp 
  onSingleFrame()
/*
  requestAnimationFrame(function() {
    snapshot.editor.fire('lockSnapshot') */
    var els = Array.prototype.slice.call(snapshot.editor.element.$.getElementsByClassName('new'))
    for (var i = 0; i < els.length; i++)
      els[i].classList.remove('new')
  /*
    snapshot.editor.fire('unlockSnapshot')
  })*/
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

Editor.Snapshot.prototype.transition = function(element, from, to, time, startTime, fallback, property, springName) {
  if (to[springName] === false) {
    return to[property]
  } else if (to[springName]) {
    var spring = to[springName];
  } else if (from[springName]) {
    var spring = to[springName] = from[springName];
    from[springName] = undefined
  } else if (from[property] != to[property]) {
    if (property == 'width' || property == 'height') {
      if (element.classList.contains('added'))
        var spring = to[springName] = new Spring(30, 12);
      else
        var spring = to[springName] = new Spring(74, 7);
    } else if (property == 'fontSize') {
      var spring = to[springName] = new Spring(20, 8);
    } else {
      var spring = to[springName] = new Spring(20, 5);
    }
  }
  if (spring) {
    spring.element = element;
    if (spring[2] == null) 
      spring[2] = from[property];
    spring[3] = to[property];
    var value = spring.compute(time, startTime);

    if (!this.animating) this.animating = []
    var j = this.animating.indexOf(spring);
    if (spring.complete()) {
      if (j > -1)
        this.animating.splice(j, 1)
      from[springName] =
      to[springName] = false;
    } else {
      if (j == -1)
        this.animating.push(spring)
    }
  }

  if (value == null) {
    if (to[fallback] != null)
      return to[fallback]
    return from[property];
  }
  return value;
}

// apply new styles over given snapshot, at specific time point from 0 to 1
Editor.Snapshot.prototype.morph = function(snapshot, time, startTime) {
  for (var i = 0; i < this.elements.length; i++) {
    var element = this.elements[i];
    var to = this.dimensions[i];
    var from = snapshot.get(element);
    if (from && from.visible)
      to.visible = true;

    if (from && to.fontSize != from.fontSize && from.fontSize && to.fontSize) {
      to.currentFontSize = this.transition(element, from, to, time, startTime, 'currentFontSize', 'fontSize', 'fontSizeSpring');
    }
    if (to.animated || from && from.animated) {
      to.animated = true

      if (from) {

        to.currentTop    = this.transition(element, from, to, time, startTime, 'currentTop', 'top', 'topSpring');
        to.currentLeft   = this.transition(element, from, to, time, startTime, 'currentLeft', 'left', 'leftSpring');
        to.currentWidth  = this.transition(element, from, to, time, startTime, 'currentWidth', 'width', 'widthSpring');
        to.currentHeight = this.transition(element, from, to, time, startTime, 'currentHeight', 'height', 'heightSpring');

        var shiftX = 0;
        var shiftY = 0;
        if (to.up) {
          shiftY += (to.up.currentTop || to.up.top) - to.up.top;
          shiftX += (to.up.currentLeft || to.up.left) - to.up.left;
        }
        to.currentX = to.x + (to.currentLeft - to.left) - shiftX;
        to.currentY = to.y + (to.currentTop - to.top) - shiftY;


      } else {
        to.currentWidth  = to.width
        to.currentHeight = to.height
        to.currentY      = to.y
        to.currentX      = to.x

      }
      if (to.visible) {
        element.style.visibility = ''
        element.style.position = 'absolute';
        element.style.margin = '0'
        if (to.currentFontSize)
          element.style.fontSize = to.currentFontSize + 'px'

        // if movement animation is at rest, disable gpu transform

        if (!to.topSpring && !to.leftSpring && element.tagName == 'SECTION') {
          element.style.top = to.currentY + 'px';
          element.style.left = to.currentX + 'px';
          element.style.transform = 
          element.style.webkitTransform = ''
        } else {
          element.style.top = '0';
          element.style.left = '0';
          element.style.transform = 
          element.style.webkitTransform = 'translateX(' + to.currentX + 'px) translateY(' + (to.currentY) + 'px)'
        }
        element.style.height = to.currentHeight + 'px';
        element.style.width = to.currentWidth + 'px';
      } else {
        element.style.visibility = 'hidden'
      }
    }
  }
}

Editor.Snapshot.take = function(editor, reset, focused) {
  var elements = Editor.Content(editor);
  if (reset) {
    Editor.Snapshot.prototype.reset(elements)
  }
  var dimensions = []
  //debugger

  var bookmark = editor.dragbookmark;

  if (editor.refocusing) {
    var focused = editor.refocusing;
    editor.refocusing = undefined;
  }

  if (reset && (focused || bookmark)) {
    //requestAnimationFrame(function() {
      editor.dragbookmark = null;
      var selection = editor.getSelection();

      if (focused) {
        var selection = editor.getSelection()
        var range = selection.getRanges()[0] || editor.createRange()
        range.moveToElementEditEnd(new CKEDITOR.dom.element(focused))
        editor.getSelection().selectRanges([range])
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

  }


//  Editor.measure(editor);
  for (var i = 0; i < elements.length; i++) {
    var box = {top: 0, left: 0, 
      height: elements[i].offsetHeight, 
      width: elements[i].offsetWidth, 
      parent: elements[i].parentNode}
    if (!box.up)
      box.up = dimensions[elements.indexOf(elements[i].parentNode)]
    
    for (var parent = elements[i]; parent && (parent != editor.element.$); parent = parent.offsetParent) {
      box.top += parent.offsetTop;
      box.left += parent.offsetLeft;
    }
    box.visible = Editor.Container.isBoxVisible(editor, box);
    dimensions.push(box)
  }
    var selected = Editor.Snapshot.rememberSelected(editor)
  

      //if (window.scrollY > offsetTop - 75/* || window.scrollY + window.innerHeight / 3 <  offsetTop - 75*/) {
      //  window.scrollTo(0, offsetTop - window.innerHeight / 6)
      //}
    //})
  
  return new Editor.Snapshot(editor, elements, dimensions, selected)
}

Editor.Snapshot.rememberSelected = function(editor, bookmark, focused) {

  var selection = editor.getSelection()
  var range = selection.getRanges()[0];
  if (range) {
    if (bookmark && bookmark.length == 1) {
      var ancestor = Editor.Content.getEditableAscender(bookmark[0].startNode.$);
      if (ancestor)
        var selected = [ancestor, window.getComputedStyle(ancestor)['font-size']]
    } else if (range.startContainer.$ == range.endContainer.$) {
      var ancestor = Editor.Content.getEditableAscender(range.startContainer.$);
      if (ancestor)
        var selected = [ancestor, window.getComputedStyle(ancestor)['font-size']]
      else
        var selected = [];
    } else {
      // iterator may cause a reflow
      var iterator = selection.getRanges()[0].createIterator();
      iterator.enforceRealBlocks = false;
      var selected = []
      for (var element; element = iterator.getNextParagraph();) {
        var el = element.$;
        if (el) {
          if (!focused) focused = el;
          var fontSize = window.getComputedStyle(el)['font-size'];
          selected.push(el, fontSize)
        }
      }
    }
  }
  return selected;
}

Editor.Snapshot.prototype.reset = function(elements, over) {
  if (!elements)
    elements = this.elements;
  for (var i = 0; i < elements.length; i++) {
    var element= elements[i];
    //element.style.webkitTransitionDuration = '0s'
    //element.style.transitionDuration = '0s'
    element.style.webkitTransform = ''
    element.style.transform = ''
    element.style.height = ''
    element.style.width = ''
    element.style.top = ''
    element.style.left = ''
    element.style.position = ''
    element.style.left = ''
    element.style.fontSize = ''
    element.style.margin = ''
    element.style.backgroundColor = ''
    if (over)
      element.style.visibility = ''

  }
}

Editor.Snapshot.prototype.isVisible = function(element) {
  var box = this.get(element)
  if (box)
    return Editor.Container.isBoxVisible(this.editor, box)
}

Editor.Snapshot.prototype.updateVisibility = function() {
  for (var i = 0; i < this.dimensions.length; i++) {
    this.dimensions[i].visible = Editor.Container.isBoxVisible(this.editor, this.dimensions[i]);
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

  t.animated = repositioned;

  return repositioned || !!repos;
}

Editor.Snapshot.prototype.invalidate = function(callback) {
  if (!this.dirty) this.dirty = []
  this.dirty.push(callback);
  var that = this;
  cancelAnimationFrame(this.reanimate)
  cancelAnimationFrame(this.timer)
  this.reanimate = requestAnimationFrame(function() {
    that.editor.fire('lockSnapshot')
    that.dirty.forEach(function(callback) {
      callback(that)
    });
    that.dirty = []
    that.editor.snapshot = that.animate()
    that.editor.fire('unlockSnapshot')
  });
}