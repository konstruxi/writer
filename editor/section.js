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

  // Animationg function unlocks snapshot
  editor.fire( 'unlockSnapshot' );
}

Editor.Section.enlarge = function(editor, section) {
  
  if (section.classList.contains('small'))
    section.classList.remove('small')
  else
    section.classList.add('large')
  Editor.Section(editor)
}

Editor.Section.shrink = function(editor, section) {
  if (section.classList.contains('large'))
    section.classList.remove('large')
  else
    section.classList.add('small')
  Editor.Section(editor)
}

Editor.Section.setActive = function(editor, target, force) {
  for (; target; target = target.parentNode) {
    if (target.tagName == 'SECTION') {
      if (target == editor.activeSection) {
        Editor.Chrome.togglePicker(Editor.get(editor.activeSection));
        return false
      }
      break
    }
  }
  clearTimeout(window.unpicking)
  var editor = Editor.get(target || editor.activeSection);
  if (editor && editor.activeSection != target) {
    editor.fire('lockSnapshot')
    if (!editor.isSetUp) {
      editor.isSetUp = true;
      editor.on('blur', function() {
        Editor.Chrome.togglePicker(editor)
      })
    }
    editor.activeSection = target
    Editor.Chrome.togglePicker(editor, true);
    editor.fire('unlockSnapshot')
  }
}

Editor.Section.split = function(editor, root) {
  var children = Array.prototype.slice.call(root.childNodes);
  var selection = editor.getSelection()
  if (!editor.dragbookmark && editor.focusManager.hasFocus)
    editor.dragbookmark = selection.createBookmarks();
  var last;
  var prev;
  var selected = selection.getStartElement();
  if (selected) {
    selected = Editor.Content.getEditableAscender(selected.$);
    var result = Editor.Section.get(selected);
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
        if (grandchildren[j].tagName == 'SPAN' && Editor.Content.isEmpty(grandchildren[j])) {
          grandchildren[j].parentNode.removeChild(grandchildren[j]);
          continue
        }
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

  return result;
}

Editor.Section.analyze = function(node) {
  var tags = [];
  var titles = 0;
  var texts = 0;
  for (var i = 0; i < node.children.length; i++) {
    var child = node.children[i];
    switch (child.tagName) {
      case 'HR':
        node.classList.add('forced')
        node.removeChild(child);
        i--;
        break;
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

      case 'P': case 'A': case 'PICTURE':
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
    {'small': true, 'has-long-text': false},
    {'small': true, 'has-long-text': false}
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
  while (first.classList.contains('toolbar') || first.tagName == 'HR')
    first = first.nextElementSibling;
  return first;
}

Editor.Section.getEditStart = function(section) {
  var first = Editor.Section.getFirstChild(section);
  while (first.firstElementChild)
    first = first.firstElementChild; 
  return first;
}

Editor.Section.needsSplitterBetween = function(left, right) {
  if (left && left.tagName == 'UL' && left.classList.contains('meta'))
    return false;
  return (right.tagName == 'HR')
      || (right.tagName == 'H1' && (!left || !Editor.Content.isPicture(left) || (Editor.Section.getFirstChild(left.parentNode) != left))) 
      || (right.tagName == 'H2' && (!left || (left.tagName != 'H1' && (!Editor.Content.isPicture(left) || (Editor.Section.getFirstChild(left.parentNode) != left)))))
}


Editor.Section.build = function(editor, section) {
  if (!section)
    section = document.createElement('section');
  
  Editor.Chrome.Toolbar(editor, section)

  return section
}

Editor.Section.place = function(editor, parent, previous, child, current, root, selected, context) {
  if (previous) {
    if (Editor.Section.needsSplitterBetween(previous, child)) {
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
  return parent;  

}

Editor.Section.observe = function(editor) {
  var observer = new MutationObserver( function(mutations) {
    var removedImages = [];
    var addedImages = [];
    var removed = []
    mutations: for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (m.type === 'childList') {
        for (var t = m.target; t && t != editor.element.$; t = t.parentNode) {
          if (t.id == 'cke_pastebin') 
            continue mutations;
        }
        for (var j = 0; j < m.removedNodes.length; j++) {
          if (m.removedNodes[j].nodeType == 1 &&
              m.removedNodes[j].tagName != 'SPAN' &&
              m.removedNodes[j].tagName != 'DIV' &&
              (!m.removedNodes[j].classList || !m.removedNodes[j].classList.contains('toolbar')) &&
              (!m.target.classList || !m.target.classList.contains('toolbar'))) {
            var reason = mutations[i];
          }
          removed.push(m.removedNodes[j]);
          if (m.removedNodes[j].tagName == 'IMG') {
            removedImages.push(m.removedNodes[j])
          } else if (m.removedNodes[j].tagName) {
            removedImages.push.apply(removedImages, m.removedNodes[j].getElementsByTagName('img'))
          }
        }
        for (var j = 0; j < m.addedNodes.length; j++) {
          if (m.addedNodes[j].nodeType == 1 &&
              m.addedNodes[j].tagName != 'SPAN' &&
              m.addedNodes[j].tagName != 'DIV' &&
              (!m.addedNodes[j].classList || !m.addedNodes[j].classList.contains('toolbar')) &&
              (!m.target.classList || !m.target.classList.contains('toolbar'))) {
            var reason = mutations[i];
          }
          var k = removed.indexOf(m.addedNodes[j]);
          if (k > -1)
            removed.splice(k, 1);
          if (m.addedNodes[j].tagName == 'IMG') {
            var k = removedImages.indexOf(m.addedNodes[j]);
            if (k > -1)
              removedImages.splice(k, 1)
            else
              addedImages.push(m.addedNodes[j])
          } else if (m.addedNodes[j].tagName) {
            Array.prototype.forEach.call(m.addedNodes[j].getElementsByTagName('img'), function(img) {
              var k = removedImages.indexOf(img);
              if (k > -1)
                removedImages.splice(k, 1)
              else
                addedImages.push(img)
            })
          }
        }
      } else {
        if (m.target != editor.element.$
            && ((m.attributeName == 'class'
              && ((m.oldValue 
                && (m.oldValue.indexOf('forced') > -1) != (m.target.className.indexOf('forced') > -1)))))) {
          var reason = mutations[i];
        }
      }
    }
    if (removed.length) {
      console.error(removed)
      for (var i = 0; i < removed.length; i++)
        if (editor.snapshot)
          editor.snapshot.removeElement(removed[i])
    }
    if (removedImages.length) {
      console.error('removedImages', removedImages);
      for (var i = 0; i < removedImages.length; i++) {
        Editor.Image.unload(editor, removedImages[i]);
      }
    }
    if (addedImages.length) {
      console.error('addedImages', addedImages);
      for (var i = 0; i < addedImages.length; i++) {
        Editor.Image.register(editor, addedImages[i]);
      }
    }
    if (reason)
      Editor.Section(editor, reason, observer);

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