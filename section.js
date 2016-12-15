Editor.Section = function(editor, mutation, observer) {

  var snapshot = editor.snapshot || Editor.Snapshot.take(editor);
  //editor.stylesnapshot = undefined;


  editor.fire( 'lockSnapshot');
  var content = editor.element.$;
  var section = Editor.Section.split(editor, content) || editor.justdropped
  for (var i = 0; i < content.children.length; i++)
    Editor.Section.analyze(content.children[i])
  Editor.Section.group(content)


  editor.snapshot = snapshot.animate(section);

  //updateToolbar(editor, true)
  //togglePicker(editor, true)


  if (observer)
    observer.takeRecords()

  editor.fire( 'unlockSnapshot' );
}


Editor.Section.split = function(editor, root) {
  var children = Array.prototype.slice.call(root.childNodes);
  var selection = editor.getSelection()
  if (!editor.dragbookmark)
    editor.dragbookmark = selection.createBookmarks();
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
        if (!grandchildren[j].classList || !grandchildren[j].classList.contains('toolbar')) {
          last = Editor.Section.place(editor, last, prev, grandchildren[j], current, root, selected, context)
          if (last === current) {
            Editor.Section.build(editor, current)
            current = undefined;
          }
        } else if (last != current) {
          //grandchildren[j].parentNode.removeChild(grandchildren[j]);
          continue;
        }
        prev = grandchildren[j];
      }
      if (current) {
        current.parentNode.removeChild(current)
      }
      if (Editor.Content.isEmpty(last)) {
        last.classList.add('new')
      }
      continue;
    }

    last = Editor.Section.place(editor, last, prev, child, null, root, null, context)
    prev = child;
  }

  if (context.reselected) 
    editor.refocusing = context.reselected;

  return result;
}

Editor.Section.analyze = function(node) {
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

Editor.Section.match = function(element, conditions) {
  if (!element) return;
  for (var klass in conditions)
    if (element.classList.contains(klass) != conditions[klass])
      return false;
  return true;
}


Editor.Section.group = function(content) {
  var current;
  var sections = Array.prototype.slice.call(content.children);
  outer: for (var i = 0; i < sections.length; i++) {
    for (var name in patterns) {
      var pattern = patterns[name];
      for (var j = 0; j < pattern.length; j++)
        if (!Editor.Section.match(sections[i + j], pattern[j]))
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


Editor.Section.get = function(element) {
  while (element && element.tagName != 'SECTION')
    element = element.parentNode;
  return element;
}

Editor.Section.getFirstChild = function(section) {
  var first = section.firstElementChild;
  if (first.classList.contains('toolbar'))
    return first.nextElementSibling;
  return first;
}

Editor.Section.getEditStart = function(section) {
  var first = Editor.Section.getFirstChild(section);
  while (first.firstElementChild)
    first = first.firstElementChild; 
  return first;
}

Editor.Section.needsSplitterBetween = function(left, right) {
  return (right.tagName == 'H1' && (!left || left.tagName != 'IMG' || (Editor.Section.getFirstChild(left.parentNode) != left))) 
      || (right.tagName == 'H2' && (!left || (left.tagName != 'H1' && (left.tagName != 'IMG' || left.previousElementSibling))))
}


Editor.Section.build = function(editor, section) {
  if (!section)
    section = document.createElement('section');
  
  if (!section.getElementsByClassName('toolbar')[0]) {
                
    var toolbar = document.createElement('div');
    toolbar.className = 'toolbar'
    toolbar.setAttribute('unselectable', 'on')

    if (!editor.toolbarsToRender)
      editor.toolbarsToRender = []
    editor.toolbarsToRender.push({
      element: toolbar,
      content: '<x-button class="handle">' +
                  '<svg viewBox="0 0 48 48" class="resize handler icon"><use xlink:href="#resize-section-icon"></use></svg>' +
                  '<svg viewBox="0 0 48 48" class="split handler icon"><use xlink:href="#split-section-icon"></use></svg>' +
                '</x-button>'
    })
    section.insertBefore(toolbar, section.firstChild)
  }

  return section
}

Editor.Section.place = function(editor, parent, previous, child, current, root, selected, context) {
  if (previous) {
    // start a new line after empty paragraph
    if (selected) {
      if (Editor.Section.getFirstChild(previous.parentNode) == previous
          && Editor.Content.isEmpty(previous)) {
        if (Editor.Content.isInside(selected, previous) && false) {
          if (!current) {
            var removed = previous
            if (context.reselected == previous)
              context.reselected = undefined
            previous.parentNode.removeChild(previous)
            previous = undefined
          }
        } else if (selected.previousSibling == previous 
                   && Editor.Content.isEmpty(selected)) {
          if (selected.parentNode.lastChild == child) {
            previous.parentNode.removeChild(previous)
            if (context.reselected == previous)
              context.reselected = undefined
            return parent;
          } else {
            var inserted = previous
            //editor.dontanimate = true;
          }
        } else if (Editor.Content.isInside(selected, child)){
          var focused = previous;
        }
      // prepending a header into a section, which will split
      }/* else if (current && previous.parentNode != current && current.firstElementChild == child && child.nextElementSibling && needsSplitterBetween(child, child.nextElementSibling)) {
        //editor.dontanimate = true;
      }*/

      if (!focused && !removed 
            && Editor.Content.isInside(selected, child) 
            && Editor.Content.isEmpty(previous)) {
        
        var section = Editor.Section.build(editor)
        if (parent.parentNode)
          parent.parentNode.insertBefore(section, parent.nextSibling);
        section.appendChild(child)
        section.classList.add('forced')

        if (inserted) {
          if (!context.reselected)
            context.reselected = previous;
        } else {
          if (Editor.Content.isEmpty(child)) 
            if (!context.reselected || context.reselected == previous) 
              context.reselected = child; 

          previous.parentNode.removeChild(previous)
        }

        return section;
      }
    }
    if (Editor.Section.needsSplitterBetween(previous, child)) {
      // if header is in the beginning of chapter,
      // shift focus to previous section
      if (child && Editor.Content.isEmpty(child) && previous && !Editor.Content.isEmpty(previous))
        context.reselected = child;

      var section = (current || Editor.Section.build(editor));
      if (parent.parentNode) 
        if (section.parentNode != parent.parentNode || section.previousSibling != parent)
          parent.parentNode.insertBefore(section, parent.nextSibling);
      if (current) {
        var first = Editor.Section.getFirstChild(current);
        if (first != child)
          section.insertBefore(child, first)
      } else if (section.previousSibling != previous) {
        section.appendChild(child); 
      }


      return section;
    }
  }
  
  if (!parent) parent = current || Editor.Section.build(editor)
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

Editor.Section.observe = function(editor) {
  var observer = new MutationObserver( function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (m.type === 'childList') {
        for (var j = 0; j < m.removedNodes.length; j++)
          if (m.removedNodes[j].nodeType == 1 &&
              m.removedNodes[j].tagName != 'SPAN' &&
              (!m.removedNodes[j].classList || !m.removedNodes[j].classList.contains('toolbar')) &&
              (!m.target.classList || !m.target.classList.contains('toolbar')))
            return Editor.Section(editor, mutations[i], observer);
        for (var j = 0; j < m.addedNodes.length; j++)
          if (m.addedNodes[j].nodeType == 1 &&
              m.addedNodes[j].tagName != 'SPAN' &&
              (!m.addedNodes[j].classList || !m.addedNodes[j].classList.contains('toolbar')) &&
              (!m.target.classList || !m.target.classList.contains('toolbar')))
            return Editor.Section(editor, mutations[i], observer);
      } else {
        if (m.target != editor.element.$
            && ((m.attributeName == 'class'
              && ((m.oldValue 
                && (m.oldValue.indexOf('forced') > -1) != (m.target.className.indexOf('forced') > -1)))))) {
          return Editor.Section(editor, mutations[i], observer);
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

  editor.observer = observer;
}