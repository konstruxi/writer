Kex = function(element, options, elements, dimensions, selected, offsetHeight) {
  this.options = options || {};
  this.element = element;
  this.elements = elements || []
  this.dimensions = dimensions || [];
  this.selected = selected || [];
  this.offsetHeight = offsetHeight;
  if (element)
    Kex.measureContainer(element, options);
}


Kex.prototype.freezeContainer = function() {
  if (this.offsetHeight)
    this.element.style.height = this.offsetHeight + 'px';
}
Kex.prototype.unfreezeContainer = function() {
  if (this.offsetHeight)
    this.element.style.height = '';
  
}

// attempt to restore identity of selected elements between snapshots
Kex.prototype.migrateSelectedElements = function(snapshot) {
  if (snapshot.selected && this.selected) {

    var selected = this.selected.slice();
    for (var i = 0; i < selected.length; i += 1) {
      var after = selected[i];

      if (snapshot.selected.indexOf(after) > -1) {
        selected.splice(i, 1);
        i -= 1;
        continue;
      }
      var before = snapshot.selected[i];
      if (snapshot.get(after))
        continue;

      if (this.get(before))
        continue;
      
      var box = this.get(after);
      if (!box)
       continue;
      box.animated = true;
      var old = snapshot.get(before)
      if (!snapshot.get(after)) {
        snapshot.elements.push(after)
        snapshot.dimensions.push(old)
      }
    }
    //element.classList.add('moving')

  }
}
Kex.prototype.removeElement = function(element) {
  if (this.animating)
    for (var i = this.animating.length; i--;) {
      var animation = this.animating[i];
      if (animation.element == element)
        animation.splice(i, 1)
    }
  //var index = this.elements.indexOf(element);
  //if (index > -1)// || this.selected && this.selected.indexOf(element) > -1) return;
  //  this.elements.splice(index, 1);
  
  
}
Kex.prototype.animate = function(section, callback) {
  var snapshot = Kex.take(this.element, this.options, true);
  if (callback)
    callback(snapshot)
  this.processElements(snapshot);
  snapshot.animating = (this.animating || [])
  snapshot.manipulated = this.manipulated;

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
  var onSingleFrame = function(immediate) {
    if (!migrated) {
      migrated = true;
      snapshot.migrateSelectedElements(from)
      snapshot.freezeContainer();
    }
    var time = + new Date;
    var start = snapshot.startTime || time
    snapshot.lastTime = time;

    if (!snapshot.manipulated || snapshot.manipulated != snapshot.lastManipulated) {

      //if (immediate === true) {
      //  snapshot.element.style.display = 'none';
      //}

      snapshot.morph(from, (start + Math.floor((time - start) / 1)), start)
      //if (immediate === true)
      //  snapshot.element.style.display = 'block';

      //if (window.debugging)
      //  debugger
    }
    //console.log('frame', snapshot.animating && snapshot.animating.length)
    

    if (!snapshot.startTime)
      snapshot.startTime = time;

    if (snapshot.animating.length || snapshot.manipulated) {
      if (!snapshot.animating.length)
        snapshot.lastManipulated = snapshot.manipulated;
      snapshot.timer = requestAnimationFrame(onSingleFrame)
    } else {
      snapshot.finish()
      snapshot.timer = null;
      console.log('animated in', time -  snapshot.startTime, snapshot.manipulated)
    }
  }
  // call immediately for safari, the reason why we dont use precise RAF timestamp 
  onSingleFrame(true)
    var els = Array.prototype.slice.call(snapshot.element.getElementsByClassName('new'))
    for (var i = 0; i < els.length; i++)
      els[i].classList.remove('new')
  return snapshot;
};

Kex.prototype.finish = function() {
  if (this.options.onFinish) this.options.onFinish.call(this)
  this.reset(null, true)
  this.unfreezeContainer();
}

Kex.prototype.compute = function(snapshot) {
  this.computed = true;
  var repositioned;
  for (var i = 0; i < this.element.children.length; i++)
    repositioned = this.normalize(this.element.children[i], snapshot, 0, 0, repositioned)
  return repositioned
}


Kex.prototype.get = function(element, copy) {
  var box = this.dimensions[this.elements.indexOf(element)]
  if (box && copy) {
    return {left: box.left, x: box.x, width: box.width,
            top: box.top, y: box.y, height: box.height}

  }
  return box;
}

Kex.prototype.transition = function(element, from, to, time, startTime, fallback, property, springName, modifierName) {
  if (to[modifierName] != null) {
    var target = to[modifierName]
  } else if (from[modifierName] != null && to[modifierName] !== null) {
    var target = to[modifierName] = from[modifierName]
  } else {
    var target = to[property];
  }
  var current = to[fallback] != null ? to[fallback] : 
                from[fallback] != null ? from[fallback] :
                from[property];
  if (to[springName] === false && to[fallback] === target) {
    return target
  } else if (to[springName]) {
    var spring = to[springName];
  } else if (from[springName]) {
    var spring = to[springName] = from[springName];
    from[springName] = undefined
  } else if (current != target) {
    if (property == 'height') {
      if (element.classList.contains('added'))
        var spring = to[springName] = new Spring(30, 12);
      else
        var spring = to[springName] = new Spring(34, 9);
    } else if (property == 'width') {
      if (element.classList.contains('added'))
        var spring = to[springName] = new Spring(30, 15);
      else
        var spring = to[springName] = new Spring(74, 12);
    } else if (property == 'fontSize') {
      var spring = to[springName] = new Spring(100, 12);
    } else if (property == 'fontSize') {
      var spring = to[springName] = new Spring(100, 12);
    } else if (property == 'top') {
      var spring = to[springName] = new Spring(34, 9);
    } else {
      var spring = to[springName] = new Spring(74, 12);
    }
  }
  if (spring) {
    spring.element = element;
    if (spring[2] == null) { 
      spring[2] = current
      console.log(property, element, 'spring from', spring[2], 'to', target)
    }
    spring[3] = target;
    var value = spring.compute(time, startTime);

    if (!this.animating) this.animating = []
    var j = this.animating.indexOf(spring);
    if (spring.complete()) {
      if (j > -1)
        this.animating.splice(j, 1)
      from[springName] =
      to[springName] = false;
      spring[2] = null;
    } else {
      if (j == -1)
        this.animating.push(spring)
    }
  }

  if (value == null) {
    return current;
  }
  return value;
}

// apply new styles over given snapshot, at specific time point from 0 to 1
Kex.prototype.morph = function(snapshot, time, startTime) {
  for (var i = 0; i < this.elements.length; i++) {
    var element = this.elements[i];
    var to = this.dimensions[i];
    var from = snapshot.get(element);
    if (from && from.visible)
      to.visible = true;

    var shiftX = 0;
    var shiftY = 0;
    if (from && ((to.animated || from.animated) || (from.manipulated || to.manipulated))) {
      if (from.animated)
        to.animated = true
      if (from.manipulated) {
        to.manipulated = true;
        to.static = false;
      }

      to.currentFontSize   = this.transition(element, from, to, time, startTime, 'currentFontSize', 'fontSize', 'fontSizeSpring');
      to.currentLineHeight = this.transition(element, from, to, time, startTime, 'currentLineHeight', 'lineHeight', 'lineHeightSpring');
      to.currentTop    = this.transition(element, from, to, time, startTime, 'currentTop', 'top', 'topSpring', 'targetTop');
      to.currentLeft   = this.transition(element, from, to, time, startTime, 'currentLeft', 'left', 'leftSpring', 'targetLeft');
      to.currentWidth  = this.transition(element, from, to, time, startTime, 'currentWidth', 'width', 'widthSpring', 'targetWidth');
      to.currentHeight = this.transition(element, from, to, time, startTime, 'currentHeight', 'height', 'heightSpring', 'targetHeight');

      if (to.up) {
        shiftY += (to.up.currentTop || to.up.top) - to.up.top;
        shiftX += (to.up.currentLeft || to.up.left) - to.up.left;
      }
    } else {
      to.currentFontSize = to.fontSize
      to.currentLineHeight = to.lineHeight
      to.currentWidth  = to.targetWidth != null ? to.targetWidth : to.width
      to.currentHeight = to.targetHeight != null ? to.targetHeight : to.height
      to.currentTop    = to.targetTop != null ? to.targetTop : to.top
      to.currentLeft   = to.targetLeft != null ? to.targetLeft : to.left
    }
    to.currentX = to.x + (to.currentLeft - to.left) - shiftX;
    to.currentY = to.y + (to.currentTop - to.top) - shiftY;


    if (!to.static) {
      var css = '';
      if (to.visible) {
        if (to.currentFontSize != to.fontSize && element.tagName != 'SECTION')
          css += 'font-size: ' + to.currentFontSize + 'px; '
        if (to.currentLineHeight != to.lineHeight && element.tagName != 'SECTION')
          css += 'line-height:  ' + to.currentLineHeight + 'px; '


        css += 'position: absolute; ';
        css += 'margin: 0; '
        css += 'transform: translateX(' + to.currentX + 'px) translateY(' + (to.currentY) + 'px);'
        css += '-wekit-transform: translateX(' + to.currentX + 'px) translateY(' + (to.currentY) + 'px);'
        css += 'top: 0; '
        css += 'left: 0; '
        css += 'left: 0; '
        css += 'width: ' + to.currentWidth + 'px; '

        // allow height-restricted layouts (e.g. css columns)
        // from spilling over, by not limiting the height
        if (element.tagName == 'SECTION')

          css += 'min-height: ' + to.currentHeight + 'px;';
        else
          css += 'height: ' + to.currentHeight + 'px;';
      } else {
        css = 'z-index: -1; visibility: hidden';
      }
      element.style.cssText = css;
    }

    //if (!to.topSpring && !to.leftSpring && !to.heightSpring && !to.widthSpring && !to.fontSizeSpring)
    //  to.animated = false;
  }

}

Kex.take = function(element, options, reset, focused) {
  if (!options)
    options = {};

  if (!options.selector)
    options.selector = 'section, div, ul, li, ol, h1, h2, h3, h4, h5, dl, dt, dd, p';
  if (!options.getElements)
    options.getElements = function() {
      return Array.prototype.slice.call(element.querySelectorAll(options.selector))
    }

  var elements = options.getElements(element, options);
  if (reset) {
    Kex.prototype.reset(elements)
  }
  var offsetHeight = element.offsetHeight;
  var dimensions = []
  //debugger

  if (options.onTake) {
    options.onTake(options, reset, focused)
  }

//  Editor.measure(options);
  for (var i = 0; i < elements.length; i++) {
    var box = {top: 0, left: 0, 
      height: elements[i].offsetHeight, 
      width: elements[i].offsetWidth, 
      parent: elements[i].parentNode}

    box.styles = window.getComputedStyle(elements[i]);
    box.fontSize = parseFloat(box.styles['font-size'])
    box.lineHeight = getLineHeight(box.styles['line-height'], box.fontSize)


    if (!box.up)
      box.up = dimensions[elements.indexOf(elements[i].parentNode)]
    
    // at times height measurement may be incorrect for foreground
    // e.g. when animating section with css columns
    if (elements[i].classList.contains('foreground') && box.up) {
      box.height = box.up.height - (parseInt(box.styles.top) || 0) * 2;
    }
    for (var parent = elements[i]; parent && (parent != element); parent = parent.offsetParent) {
      box.top += parent.offsetTop;
      box.left += parent.offsetLeft;
    }
    //if (elements[i].tagName == 'SECTION')
    //  box.client = elements[i].getBoundingClientRect();
    box.visible = Kex.isVisible(element, options, box);
    dimensions.push(box)
  }


  var selected = Kex.getIdentity(element, options);
      //if (window.scrollY > offsetTop - 75/* || window.scrollY + window.innerHeight / 3 <  offsetTop - 75*/) {
      //  window.scrollTo(0, offsetTop - window.innerHeight / 6)
      //}
    //})
  
  return new Kex(element, options, elements, dimensions, selected, offsetHeight)
}

Kex.prototype.saveIdentity = function() {
  debugger
  this.selected = Kex.getIdentity(this.element, this.options)
}
Kex.getIdentity = function(element, options) {
  if (options.getIdentity)
    return options.getIdentity(options)
  

}

Kex.prototype.resetElement = function(element, over) {
  //element.style.webkitTransitionDuration = '0s'
  //element.style.transitionDuration = '0s'
  element.style.cssText = '';
  element.style.margin = ''
  if (over) {
    var box = this.get(element)
    if (box) {
      box.manipulated = false;
      box.animated = false;
    }
    element.style.zIndex = ''
    element.style.visibility = ''
    element.style.transform = ''
    if (element.getAttribute('style') === '')
      element.removeAttribute('style')
  }
}
Kex.prototype.reset = function(elements, over) {
  console.log('resetting')
  if (!elements)
    elements = this.elements;
  for (var i = 0; i < elements.length; i++) {
    this.resetElement(elements[i], over)
  }
}

Kex.isVisible = function(element, options, box) {

  var top = box.top;
  var bottom = box.top + box.height
  var topmost = options.scrollY - options.offsetTop - options.innerHeight / 16
  var bottomost = options.scrollY + options.innerHeight - options.offsetTop + options.innerHeight / 16;

  return ((top >= topmost && top    <= bottomost)
    || (bottom >= topmost && bottom <= bottomost)
    ||    (top <= topmost && bottom >= bottomost))

}

Kex.measureContainer = function(element, options, scroll) {
  if (!scroll) {
    options.offsetHeight = element.offsetHeight;
    options.offsetWidth  = element.offsetWidth;
    options.offsetTop    = element.offsetTop;
    options.offsetLeft   = element.offsetLeft;
    options.innerWidth   = window.innerWidth;
    options.innerHeight  = window.innerHeight;
  }
  options.scrollY      = window.scrollY;
  options.box = {
    width: options.offsetWidth,
    height: options.offsetHeight,
    top: options.offsetTop - window.scrollY,
    left: options.offsetLeft - window.scrollX
  }
  options.zoom = options.offsetWidth / options.box.width
}


Kex.prototype.isVisible = function(element, options) {
  var box = this.get(element)
  if (box)
    return Kex.isVisible(element, options, box)
}

Kex.prototype.updateVisibility = function(scroll) {
  Kex.measureContainer(this.element, this.options, scroll)
  for (var i = 0; i < this.dimensions.length; i++) {
    this.dimensions[i].visible = Kex.isVisible(this.element, this.options, this.dimensions[i]);
  }
}

// convert absolute positions to relative positions from parent
// figured out which elements will be visible and need to be animated
Kex.prototype.normalize = function(element, from, repositioned, diffX, diffY, p) {
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
    var diffSize = Math.abs(t.width - f.width) + Math.abs(t.height - f.height);
    var distance = Math.abs((diffX || 0) + t.left - f.left) + Math.abs((diffY || 0) + t.top - f.top) 
    diffX = t.left - f.left;
    diffY = t.top - f.top;
  } else {
    diffX = 0;
    diffY = 0
  }

  var shiftX = t.left - (p ? p.left : 0) ;
  var shiftY = t.top - (p ? p.top : 0);
  var repos = false;
  if (element.children)
    for (var i = 0; i < element.children.length; i++) {
      repos = this.normalize(element.children[i], from, repos, - diffX, - diffY, t) || repos;
    }

  if (!this.options.filter || this.options.filter.call(this, element, f, t))
    if (!f || repos|| repositioned  || distance > 2 || diffSize > 2 || 
    (f && (f.fontSize != t.fontSize || f.lineHeight != t.lineHeight))) {
      repositioned = 1;
    }


  t.x = shiftX;
  t.y = shiftY;

  if (repositioned) 
    t.animated = repositioned;

  // do not reposition content of non-animated sections
  if (!repos && !repositioned && element.tagName == 'SECTION') {
    var desc = element.getElementsByTagName('*');
    for (var i = 0; i < desc.length; i++) {
      var j = this.elements.indexOf(desc[i]);
      if (j > -1)
        this.dimensions[j].static = true;
    }

    t.staticChildren = true;
  }
  return repositioned || !!repos;
}

Kex.prototype.invalidate = function(callback) {
  if (!this.dirty) this.dirty = []
  this.dirty.push(callback);
  var that = this;
  cancelAnimationFrame(this.reanimate)
  cancelAnimationFrame(this.timer)
  this.reanimate = requestAnimationFrame(function() {
    if (that.options.onBeforeMutate)
      that.options.onBeforeMutate.call(that)
    that.dirty.forEach(function(callback) {
      callback(that)
    });
    that.dirty = []
    if (that.options.onInvalidate)
      that.options.onInvalidate.call(that, that.animate.bind(that))
    if (that.options.onAfterMutate)
      that.options.onAfterMutate.call(that)
  });
}

Kex.prototype.processElements = function(snapshot) {
  if (this.options.onProcess)
    this.options.onProcess.call(this, snapshot);
  var removed = []
  for (var i = 0, j = this.elements.length; i < j; i++) {
    if (snapshot.elements.indexOf(this.elements[i]) == -1) {
      removed.push(i)
    }
  }
  if (this.animating)
    for (var i = this.animating.length; i--;) {
      var j = removed.indexOf(this.elements.indexOf(this.animating[i].element))
      if (j > -1) {
        this.animating.splice(i, 1)
      }
    }
}




Kex.prototype.setStyle = function(element, property, value) {
  var index = this.elements.indexOf(element);
  if (index == -1) return;
  var box = this.dimensions[index];
  var from = box;
  var to = box;
  var time = this.lastTime;
  var startTime = this.startTime;
  if (value === undefined)
    value = null;
  //console.log('setting style', property, value, time, startTime)
  switch (property) {
    case 'top':
      box.targetTop = value;
      this.transition(element, from, to, time, startTime, 'currentTop', 'top', 'topSpring', 'targetTop');
      break;
    case 'height':
      box.targetHeight = value;
      this.transition(element, from, to, time, startTime, 'currentHeight', 'height', 'heightSpring', 'targetHeight');
      
      break;
    case 'left':
      box.targetLeft = value;
      this.transition(element, from, to, time, startTime, 'currentLeft', 'left', 'leftSpring', 'targetLeft');

      break;
    case 'width':
      box.targetWidth = value;
      this.transition(element, from, to, time, startTime, 'currentWidth', 'width', 'widthSpring', 'targetWidth');

      break;
  }

  if (value != null) {
    this.manipulated = (this.manipulated || 0) + 1
    box.manipulated = true;
  }
  box.animated = true;
  box.static = false;
}



// measure line-height value for  normal keyword 
// for all font sizes in range of 1 ... 100
Kex.lineHeights = {};

var dummy = document.createElement('div')
dummy.style.visibility = 'hidden'
dummy.style.position = 'absolute';
dummy.style.width = '1px';
dummy.style.height = '1px';
dummy.style.overflow = 'hidden';
for (var i = 0; i < 100; i++) {
  var stub = document.createElement('i');
  stub.style.fontSize = i + 'px'
  stub.style.lineHeight = 'normal'
  stub.style.display = 'block'
  stub.innerHTML = '&nbsp;'
  dummy.appendChild(stub); 
};
document.body.appendChild(dummy);
var dummies = dummy.getElementsByTagName('i');
for (var i = 0; i < 100; i++) {
  Kex.lineHeights[i] = dummies[i].offsetHeight
}



// code re-approriated from. added precomputed table 
// https://github.com/twolfson/line-height/blob/master/lib/line-height.js 
function getLineHeight(lnHeightStr, fontSize) {
  // Grab the line-height via style
  var lnHeight = parseFloat(lnHeightStr, 10);

  /* If the lineHeight did not contain a unit (i.e. it was numeric), convert it to ems (e.g. '2.3' === '2.3em')
  if (lnHeightStr === lnHeight + '') {
    // Save the old lineHeight style and update the em unit to the element
    var _lnHeightStyle = node.style.lineHeight;
    node.style.lineHeight = lnHeightStr + 'em';

    // Calculate the em based height
    lnHeightStr = computedStyle(node, 'line-height');
    lnHeight = parseFloat(lnHeightStr, 10);

    // Revert the lineHeight style
    if (_lnHeightStyle) {
      node.style.lineHeight = _lnHeightStyle;
    } else {
      delete node.style.lineHeight;
    }
  }*/

  // If the line-height is "normal", calculate by font-size
  if (lnHeightStr === 'normal') {
    return Kex.lineHeights[Math.floor(fontSize)]
  }
  // If the lineHeight is in `pt`, convert it to pixels (4px for 3pt)
  // DEV: `em` units are converted to `pt` in IE6
  // Conversion ratio from https://developer.mozilla.org/en-US/docs/Web/CSS/length
  if (lnHeightStr.indexOf('pt') !== -1) {
    lnHeight *= 4;
    lnHeight /= 3;
  } else if (lnHeightStr.indexOf('mm') !== -1) {
  // Otherwise, if the lineHeight is in `mm`, convert it to pixels (96px for 25.4mm)
    lnHeight *= 96;
    lnHeight /= 25.4;
  } else if (lnHeightStr.indexOf('cm') !== -1) {
  // Otherwise, if the lineHeight is in `cm`, convert it to pixels (96px for 2.54cm)
    lnHeight *= 96;
    lnHeight /= 2.54;
  } else if (lnHeightStr.indexOf('in') !== -1) {
  // Otherwise, if the lineHeight is in `in`, convert it to pixels (96px for 1in)
    lnHeight *= 96;
  } else if (lnHeightStr.indexOf('pc') !== -1) {
  // Otherwise, if the lineHeight is in `pc`, convert it to pixels (12pt for 1pc)
    lnHeight *= 16;
  }

  // Continue our computation
  lnHeight = Math.round(lnHeight);


  // Return the calculated height
  return lnHeight;
}