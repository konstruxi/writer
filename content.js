Editor.Content = function(editor) {
  var root = editor.element.$;
  var elements = Array.prototype.slice.call(root.getElementsByTagName('*'));
  var result = []
  loop: for (var i = 0; i < elements.length; i++) {
    for (var parent = elements[i]; parent; parent = parent.parentNode) {
      if ((parent.classList && parent.classList.contains('toolbar')) 
        ||(parent.className && parent.className.indexOf && parent.className.indexOf('cke_') > -1))
        continue loop;
      if (parent.tagName == 'SECTION' || parent == root) {
        result.push(elements[i])
        break;
      }
    }
  }
  return result;
}


Editor.Content.cleanEmpty = function(editor, force, blur) {
  var selection = editor.getSelection();
  if (editor.refocusing) {
    var selected = editor.refocusing;
  } else {
    var selected = selection.getStartElement();
    if (selected) selected = selected.$;
  }
  var children = editor.element.$.children;
  var snapshot = editor.stylesnapshot;
  editor.fire('lockSnapshot');
  var cleaned = [];
  for (var i = 0; i < children.length; i++) {
    var inside = Editor.Content.isInside(selected, children[i]);
    if (selected && inside) {
      if (editor.section != children[i]) {
        if (editor.section)
          editor.section.classList.remove('focused')
        editor.section = children[i]
        editor.section.classList.add('focused')
        setActiveSection(editor.section, true)
        updateToolbar(editor)
      }
    }
    if (!selected || force || !inside) {
      if (Editor.Content.isEmpty(children[i])) {
        //if (!snapshot) 
        //  snapshot = editor.stylesnapshot = snapshotStyles(editor)
        if (selected) 
          if (inside) {
            if (!before && !after) {
              var before = children[i].previousElementSibling;
              var after = children[i].nextElementSibling;
            }
          } else if (!bookmark && !editor.refocusing && !blur)
            var bookmark = selection.createBookmarks();

        cleaned.push(children[i])
      } else {
        var els = []
        var grandchildren = children[i].children;
        for (var j = 0; j < grandchildren.length; j++) {
          if (grandchildren[j].classList.contains('toolbar'))
            continue;
          var grands = grandchildren[j].getElementsByTagName('*');
          els.push(grandchildren[j])
          els.push.apply(els, grands);
        }
        for (var j = 0; j < els.length; j++) {
          if (Editor.Content.isEmpty(els[j])) {
            if (selected) 
              if (!before && !after && Editor.Content.isInside(selected, els[j])) {
                var before = els[j].previousElementSibling;
                var after = els[j].nextElementSibling;
              } else if (!bookmark && !editor.refocusing && !blur) { 
                var bookmark = selection.createBookmarks();
              }

            //if (!snapshot) 
            //  snapshot = editor.stylesnapshot = snapshotStyles(editor)
            cleaned.push(els[j])
          }
        }

      }
    }
  }
  for (var i = 0; i < cleaned.length; i++) {
    cleaned[i].parentNode.removeChild(cleaned[i])
    if (editor.snapshot)
      editor.snapshot.removeElement(cleaned[i])
  }

  if (!editor.refocusing && !blur) {
    if (before || after) {
      var range = editor.createRange();
      if (before)
        range.moveToElementEditEnd( new CKEDITOR.dom.element(before) );
      else
        range.moveToElementEditStart( new CKEDITOR.dom.element(after) )
      range.select( true );
    } else if (bookmark)
      try {
        editor.getSelection().selectBookmarks(bookmark);
      } catch(e) {}
  }
  editor.fire('unlockSnapshot');
}

Editor.Content.isMeaningless = function(text) {
  // numbers 
  if (!isNaN(parseFloat(text)))
    return true;
  return text.match(/^(?:[\s\n\t]|&nbsp;)*$/);
}

Editor.Content.paragraphs = function(node) {
  return CKEDITOR.dtd.$avoidNest[node.getName && node.getName()]
}

Editor.Content.getEditableAscender = function(element) {
  while (element && (!element.tagName || element.tagName == 'STRONG'
                            || element.tagName == 'EM' 
                            || element.tagName == 'SPAN'
                            || element.tagName == 'A'
                            || element.tagName == 'BR'))
    element = element.parentNode;
  return element;
}

Editor.Content.isParagraph = function(element) {
  switch (element.parentNode.tagName) {
    case 'SECTION': case 'OL': case 'UL': case 'BLOCKQUOTE':
      return true;
    default:
      return element.parentNode.getAttribute('contenteditable') != null
  }
}

Editor.Content.isInside = function(element, another) {
  while (element) {
    if (element == another)
      return true;
    element = element.parentNode
  }
}

Editor.Content.isEmpty = function(child) {
  if (child.tagName == 'IMG' || child.tagName == 'BR' || child.tagName == 'svg' || (child.classList && child.classList.contains('toolbar')))
    return false;
  //if (child.tagName == 'P') {
    var text = child.textContent
    for (var i = 0; i < text.length; i++)
      switch (text.charAt(i)) {
        case '&nbsp;': case ' ': case '\n': case '\r': case '\t': case "​": case " ": case " ":
          break;
        default:
          return false;
      }
  //}
  return child.nodeType != 1 || !child.querySelector('img, video, iframe');
}


Editor.Content.cleanSelection = function (editor, options) {
  var selection = editor.getSelection();
  var range = selection.getRanges()[0];

  var iterator = range.createIterator();
  iterator.enforceRealBlocks = false;
  var elements = []
  var section = Editor.Section.get(range.startContainer.$)
  for (var element; element = iterator.getNextParagraph();) {
    var el = element.$;
    if (el.parentNode.tagName == 'BLOCKQUOTE')
      el = el.parentNode;
    if (Editor.Section.get(el) != section) {
      if (elements.length) {
        var end = new CKEDITOR.dom.element(elements[elements.length - 1])
        break;
      } else {
        var start = new CKEDITOR.dom.element(el)
        section = Editor.Section.get(el);
      }
    }
    elements.push(el);
  }

  if (!start && !end)
    var bookmark = selection.createBookmarks()
  

  for (var e, i = 0; e = elements[i++];) {
    var tag = e.tagName;
    switch (e.tagName) {
      case 'UL': case 'OL':
        if (options.lists) {
          while (e.firstChild)
            e.parentNode.insertBefore(e.firstChild, e)
          e.parentNode.removeChild(e);
        }
        break;
      case 'LI': case 'H1': case 'H2': case 'H3':
        if ((e.tagName == 'LI' && options.lists) ||
            (e.tagName.charAt(0) == 'H' && options.titles)) {
          var p = document.createElement('p')
          while (e.firstChild)
            p.appendChild(e.firstChild)
          e.parentNode.replaceChild(p, e);
        }
        break;
      case 'BLOCKQUOTE':
        if (options.quotes && e.firstElementChild && e.firstElementChild.tagName == 'P') {
          while (e.firstChild)
            e.parentNode.insertBefore(e.firstChild, e)
          e.parentNode.removeChild(e);
        }


    }
  }
  if (start || end) {
    var modified = range.clone();
    if (start)
      modified.setStartBefore(start)
    if (end)
      modified.setEndAfter(end)
    editor.getSelection().selectRanges([modified])
  } else {
    selection.selectBookmarks(bookmark);
  }
}



Editor.Content.Filter = function(editor) {
  var rules;
  editor.dataProcessor.dataFilter.addRules(rules = {
    text: function(string) {
      string = string.replace(/&nbsp;/g, ' ')

      if (string.length < 30)
      switch (string.replace(/[\s\t\n]/, '').trim().toLowerCase()) {
        case 'likepage':
        case 'like':
        case 'seemore':
        case 'reply':
        case 'comment':
        case 'viewpreviousreplies':
        case 'edit':
        case 'delete':
        case 'readmore':
        case 'addfriend':
        case 'addtofavorites':
        case '·':
        case '|':
        case '...':
          return false;
      }

      return string;
    },
    elements: {
      $: function(element) {
        if (element.children[0] && element.children[0].name == 'br')
          element.children.shift()
        if (element.children[0] && element.children[0].name == 'a' && rules.elements.a(element.children[0]) === false)
          return false;
        return element
      },
      a: function(element) {
        var img;
        element.children = element.children.filter(function(child) {
          if (!child.name && Editor.Content.isMeaningless(child.value))
            return false;
          if (child.name == 'img' || child.name == 'picture')
            img = child;
          return true;
        })
        
        if (!element.children.length) return false;

        if (element.parent && element.parent.name == 'p' && img) {
          element.insertAfter(element.parent);
          return false
        }

        return element;
      },
      li: function(element) {
        element.children = element.children.filter(function(child) {
          if (!child.name && Editor.Content.isMeaningless(child.value))
            return false;
          if (child.name == 'a') {
            if (!child.children.length) return false;
            if (child.children.length == 1) { 
              var grand = child.children[0];
              if (!grand.name && Editor.Content.isMeaningless(grand.value))
                return false;
            }
          }
          return true;
        })
        if (!element.children.length) return false;
      },

      // remove empty pictures
      picture: function(element) {
        if (!element.children.length)
          return false;
        return element
      },

      // wrap blockquote contents into paragraphs
      blockquote: function(element) {
        var paragraphs = [];
        var paragraph;
        var hasOwn;
        element.children.forEach(function(child) {
          if (child.name == 'br') {
            paragraph = undefined;
          } else if (child.name != 'p') {
            if (!paragraph) {
              paragraph = new CKEDITOR.htmlParser.element('p');
              paragraphs.push(paragraph)
            }
            if (paragraph.children.length) {
              paragraph.children.push(new CKEDITOR.htmlParser.text(' '), child)
            } else {
              paragraph.children.push(child)
            }
          } else {
            hasOwn = true;
          }
        })
        if (!paragraphs.length && !hasOwn)
          return false;
        element.children = paragraphs;
        return element;
      },

      p: function(element) {
        if (!element.children.length || element.children.length == 1 && element.children[0].name == 'br')
          return false;
        return element;
      },

      // wrap image, handle cors, filter out small images
      img: function (element) {
        if (!element.attributes.uid) {
          var src = element.attributes.src;
          if (!src) return false;
          // Need to CORS proxy the image
          if (src.indexOf(location.origin) == -1 && src.indexOf('://') > -1) {
            element.attributes['foreign-src'] = src
            element.attributes.src = '//:0';
          }
        }
        if (element.attributes.width && parseInt(element.attributes.width ) < 100)
          return false;
        if (element.attributes.height && parseInt(element.attributes.height ) < 100)
          return false;
        // wrap images into pictures
        if (element.parent.name != 'picture') {
          var picture = new CKEDITOR.htmlParser.element('picture', {
            class: 'loading added'
          })
          element.replaceWith(picture)
          picture.add(element);
        }
        return element;
      }
    }
  }, { applyToAll: true })

}