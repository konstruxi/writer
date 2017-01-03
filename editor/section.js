Editor.Section = function(editor, mutation, observer) {

  var snapshot = editor.snapshot || Editor.Snapshot.take(editor);
  //editor.stylesnapshot = undefined;

  editor.fire( 'lockSnapshot');
  var content = editor.element.$;
  var section = Editor.Section.split(editor, content) || editor.justdropped
  for (var i = 0; i < content.children.length; i++) {
    Editor.Section.analyze(editor, content.children[i])
  }
  Editor.Section.group(content)


  editor.snapshot = snapshot.animate(section);

  for (var i = 0; i < content.children.length; i++) 
    Editor.Section.lookaround(editor, content.children[i], editor.snapshot)

  //updateToolbar(editor, true)
  //togglePicker(editor, true)


  if (observer)
    observer.takeRecords()

  // Animationg function unlocks snapshot
  editor.fire( 'unlockSnapshot' );

  Editor.Chrome.update(editor)
}

Editor.Section.enlarge = function(editor, section) {
  
  editor.fire('saveSnapshot')
  if (section.classList.contains('small'))
    section.classList.remove('small')
  else
    section.classList.add('large')
  editor.fire('saveSnapshot')
}

Editor.Section.shrink = function(editor, section) {
  editor.fire('saveSnapshot')
  if (section.classList.contains('large'))
    section.classList.remove('large')
  else
    section.classList.add('small')
  editor.fire('saveSnapshot')
}

Editor.Section.star = function(editor, section) {
  editor.fire('saveSnapshot')
  if (section.classList.contains('starred'))
    section.classList.remove('starred')
  else
    section.classList.add('starred')

  Editor.Section.analyze(editor, section, true)
  setTimeout(function() {

    Editor.Chrome.update(editor)
  }, 50)
  editor.fire('saveSnapshot')
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

Editor.Section.insertBefore = function(editor, section) {

  var a = Editor.Section.getFirstChild(section);
  var b = editor.currentToolbar.previousElementSibling 
       && Editor.Section.getFirstChild(section.previousElementSibling);

  if ((!a || !Editor.Content.isEmpty(a)) 
   && (!b || !Editor.Content.isEmpty(b))) {
    var sect = Editor.Section.build(editor);
    sect.classList.add('forced')
    var focused = document.createElement('p');
    editor.refocusing = focused;
    sect.appendChild(focused);
    editor.currentToolbar.parentNode.insertBefore(sect, section);
    if (sect.nextElementSibling)
      sect.nextElementSibling.classList.add('forced')
  }
}

Editor.Section.getSectionAbove = function(editor, section, snapshot) {
  var before = section.previousElementSibling;
  if (!snapshot)
    snapshot = editor.snapshot;
  var box = snapshot.get(section)
  if (box)
  while (before) {
    var bbox = snapshot.get(before)
    if (bbox.top > box.top || Math.abs(bbox.top - box.top) < 30) {
      before = before.previousElementSibling;
    } else {
      break;
    }
  }
  return before
}

Editor.Section.findMovableElements = function(source, target, reverse) {
  var h1 = target.getElementsByTagName('h1')[0];
  var h2 = target.getElementsByTagName('h2')[0];
  var h3 = target.getElementsByTagName('h3')[0];
  var text = target.querySelector('blockquote, ul, ol, p');
  var result = [];
  var picture = target.getElementsByTagName('picture')[0];
  var children = Array.prototype.slice.call(source.children);
  if (reverse)
    children = children.reverse()
  loop: for (var i = 0; i < children.length; i++) {
    var child = children[i]
    switch (child.tagName) {
      case 'H1':
        if (reverse) {
          if (h1) break loop;
        } else {
          if (text) break loop;
        }

        break;
      case 'H2':
        if (reverse) {
          if (h1 || h2) break loop;
        } else {
          if (text) break loop;
        }
        break;
      case 'H3':
        if (h1 || h2 || h3) break loop;
        break;
      case 'A': case 'PICTURE':
        if (picture) break loop;
        break;
      case 'X-DIV': case 'svg':
        continue loop;
      default:
        if (reverse && (h1 || h2)) break loop;

    }

    result.unshift(child)
  }
  return result;
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
        if (!grandchildren[j].classList || !grandchildren[j].classList.contains('kx')) {
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

Editor.Section.getPaletteName = function(node) {
  for (var i = 0; i < node.classList.length; i++) {
    if (node.classList[i].indexOf('style-palette') > -1)
      var palette = node.classList[i];
    if (node.classList[i].indexOf('style-schema') > -1)
      var schema = node.classList[i];
  }
  if (palette && schema) {
    return palette + ' ' + schema
  }
  return 'style-default-palette'
}
Editor.Section.lookaround = function(editor, node, snapshot) {
  var link = node.querySelector('.toolbar svg use')
  var icon = '#menu-icon';
  if (!node.classList.contains('small')) {
    var before = Editor.Section.getSectionAbove(editor, node, snapshot);
    if (before && !before.classList.contains('small')) {
      if (Editor.Section.findMovableElements(node, before).length || 
          Editor.Section.findMovableElements(before, node, true).length) {
        node.classList.add('movable')
        var icon = '#resize-section-icon'
      }
    }
  }
  if (link.getAttributeNS('http://www.w3.org/1999/xlink', 'href') != icon) {
    link.setAttributeNS('http://www.w3.org/1999/xlink', 'href', icon);
  }
  link.parentNode.setAttribute('icon', icon)
}
Editor.Section.analyze = function(editor, node, wasStarred) {
  var tags = [];
  var styles = {};
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
          if (img.parentNode.classList.contains('portrait'))
            tags.push('has-portrait-image')
          if (img.parentNode.classList.contains('landscape'))
            tags.push('has-landscape-image')
          tags.push('has-picture')
          styles.palette = img.getAttribute('uid')
        } else if (child.textContent.length) {
          texts += child.textContent.length;
          tags.push('has-text')
        }
        break;
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

  Editor.Style(editor, node, 'palette', styles.palette, wasStarred)
  Editor.Style(editor, node, 'schema', node.getAttribute('schema'), wasStarred)
}

var patterns = {
  'two-images': [
    {'small': true, 'has-long-text': false},
    {'small': true, 'has-long-text': false}
  ]/*,
  'one-quote': [
    {'has-quote': true, 'has-text': false}
  ]*/
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


Editor.Section.get = function(target) {
  var element = target.correspondingUseElement || 
                target.correspondingElement || 
                target;
  while (element && element.tagName != 'SECTION')
    element = element.parentNode;
  return element;
}

Editor.Section.getFirstChild = function(section) {
  var first = section.firstElementChild;
  while (first.classList.contains('kx') || first.tagName == 'HR')
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

Editor.Section.forEachClass = function(klasses, element, method) {
  klasses.split(' ').forEach(function(kls) {
    element.classList[method]('temp-' + kls)
  })
}
