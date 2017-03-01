Editor.Snapshot = function(element, options, elements, dimensions, selected, offsetHeigh) {
  if (element == undefined)
    return this;
  return new Kex(element, this, elements, dimensions, selected, offsetHeigh);
}
Editor.Snapshot.prototype = new Kex;
Editor.Snapshot.take = Kex.take;
Editor.Snapshot.prototype.selector = 'section, div, ul, li, ol, h1, h2, h3, h4, h5, dl, dt, dd, p, nav, dl, header, footer, main, article, details, summary, aside, button, form, input, label, summary a, select, textarea, x-div, section > a, img, picture, blockquote'
//Editor.Snapshot.prototype.getElements = function(element, options) {
//  return Editor.Content(options.editor)
//}
Editor.Snapshot.prototype.onInvalidate = function(callback) {
  this.options.editor.snapshot = callback();
}

Editor.Snapshot.prototype.filter = function(element) {
  return true//element.tagName == 'ARTICLE' || element.tagName == 'SECTION' || element.tagName == 'DIV' || Editor.Content.isParagraph(element) || element.tagName == 'IMG' || Editor.Content.isPicture(element) || element.classList.contains('kx')
}
Editor.Snapshot.prototype.onProcess = function(snapshot) {

  var removed = []
  var addedImages = []
  for (var i = 0, j = this.elements.length; i < j; i++) {
    if (snapshot.elements.indexOf(this.elements[i]) == -1) {
      if (this.elements[i].tagName == 'IMG')
        Editor.Image.unload(this.options.editor, this.elements[i]);
      removed.push(i)
    }
  }
  for (var i = 0, j = snapshot.elements.length; i < j; i++) {
    if (snapshot.elements[i].tagName == 'IMG' && this.elements.indexOf(snapshot.elements[i]) == -1)
      Editor.Image.register(this.options.editor, snapshot.elements[i]);
  }

}
Editor.Snapshot.prototype.onTake = function(options, reset, focused) {
  if (!options.editor)
    return;
  var bookmark = options.editor.dragbookmark;

  if (reset)
    Editor.Container.measure(options.editor, this)
  
  if (options.editor.refocusing) {
    var focused = options.editor.refocusing;
    options.editor.refocusing = undefined;
  }

  if (reset && (focused || bookmark)) {
    if (options.editor.onTake)
      options.editor.onTake(focused)
  }



  //requestAnimationFrame(function() {
    options.editor.dragbookmark = null;
    var selection = options.editor.getSelection();

    if (focused) {
      var range = options.editor.createRange()
      range.moveToElementEditEnd(new CKEDITOR.dom.element(focused))
      range.select()
    } else if (bookmark) {
      Editor.Selection.restore(options.editor, bookmark);
    }
    if (bookmark && bookmark[0] && bookmark[0].startNode.$.parentNode)
      bookmark[0].startNode.$.parentNode.removeChild(bookmark[0].startNode.$)

}

Editor.Snapshot.prototype.onBeforeMutate = function() {
  if (this.options.editor)
    this.options.editor.fire('lockSnapshot')
}

Editor.Snapshot.prototype.onAfterMutate = function() {
  if (this.options.editor)
    this.options.editor.fire('unlockSnapshot')
}

Editor.Snapshot.prototype.onFinish = function() {
  if (this.options.editor)
    this.options.editor.fire('transitionEnd')
}


Editor.Snapshot.prototype.getIdentity = function(options, bookmark, focused) {
  var selection = options.editor && options.editor.getSelection()
  if (!selection) return;
  var range = selection.getRanges()[0];
  if (range) {
    if (bookmark && bookmark.length == 1) {
      var ancestor = Editor.Content.getEditableAscender(bookmark[0].startNode.$);
      if (ancestor)
        var selected = [ancestor]
    } else if (range.startContainer.$ == range.endContainer.$) {
      var ancestor = Editor.Content.getEditableAscender(range.startContainer.$);
      if (ancestor)
        var selected = [ancestor]
      else
        var selected = [];
    } else {
      // iterator may cause a reflow
      var iterator = selection.getRanges()[0].createIterator();
      iterator.enforceRealBlocks = false;
      var selected = []
      for (var element; element = iterator.getNextParagraph();) {
        var el = element.$;
        if (el && el.tagName && el.tagName == el.tagName.toUpperCase() &&
            !el.classList.contains('kx') && !el.parentNode.classList.contains('kx')) {
          if (!focused) focused = el;
          selected.push(el)
        }
      }
    }
  }
  //if (selected && Editor.Section.get(selected[0]) != Editor.Section.get(selected[selected.length - 2]))
  //  return []
  return selected;
}