
CKEDITOR.dom.elementPath.prototype.isContextFor = function() {
  return true;
}


Editor.Content = function(editor) {
  var root = editor.element.$;
  var elements = Array.prototype.slice.call(root.getElementsByTagName('*'));
  var result = []
  loop: for (var i = 0; i < elements.length; i++) {
    //for (var parent = elements[i]; parent; parent = parent.parentNode) {
      //if ((parent.classList && parent.classList.contains('toolbar')) 
      //  ||(parent.className && parent.className.indexOf && parent.className.indexOf('cke_') > -1))
      //  continue loop;
      if (Editor.Content.isBlock(elements[i])) {
        result.push(elements[i])
      }
    //}
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
        Editor.Section.setActive(editor, editor.section, true)
        Editor.Chrome.update(editor)
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
    //if (editor.snapshot)
    //  editor.snapshot.removeElement(cleaned[i])
  }

  if (!editor.refocusing && !blur) {
    if (before && before.parentNode || after && after.parentNode) {
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

Editor.Content.isBlock = function(element) {
  return  element.tagName == 'P'
       || element.tagName == 'LI' 
       || element.tagName == 'BLOCKQUOTE'
       || element.tagName == 'UL'
       || element.tagName == 'OL'
       || element.tagName == 'H1'
       || element.tagName == 'H2'
       || element.tagName == 'H3'
       || element.tagName == 'SECTION'
       || element.tagName == 'PICTURE'
       || (element.tagName == 'A' && element.firstElementChild && element.firstElementChild.tagName == 'PICTURE')
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
  if (child.tagName == 'IMG' || child.tagName == 'HR' || child.tagName == 'PICTURE' ||child.tagName == 'BR' || child.tagName == 'svg' || (child.classList && child.classList.contains('toolbar')))
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

Editor.Content.parseYoutubeURL = function(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
}


Editor.Content.soundsLikeSemanticClass = {
  'avatar':    'avatar',
  'timestamp': 'timestamp',
  'datetime':  'timestamp',
  'date':      'timestamp',
  'time':      'timestamp',

  'maybe-author': 'maybe-author',

  'author' :   'author',
  'user' :     'author',
  'profile' :  'maybe-author',

  'text-quote': 'text-quote',
  'tweet-text': 'text-quote',

  'source-url': 'source-url',
  'permalink': 'source-url',

  'source-via': 'source-via',
  'tweet-context': 'source-via'
}

Editor.Content.soundsLikeSemanticClassList = Object.keys(Editor.Content.soundsLikeSemanticClass)
Editor.Content.soundsLikeSemanticClassValues = {}
Object.keys(Editor.Content.soundsLikeSemanticClass).filter(function(kls) {
  Editor.Content.soundsLikeSemanticClassValues[Editor.Content.soundsLikeSemanticClass[kls]] = 1;
})

Editor.Content.soundsLikeUIClass = {
  'UFIAddComment': 1, // fb add comment section
  'UFILikeSentence': 1 // fb reactions section
}
Editor.Content.soundsLikeUIText = {
'': 1,
'likepage': 1,
'like': 1,
'likes': 1,
'more': 1,
'seemore': 1,
'reply': 1,
'replies': 1,
'comment': 1,
'view': 1,
'views': 1,
'new': 1,
'edit': 1,
'delete': 1,
'readmore': 1,
'addfriend': 1,
'addtofavorites': 1,
'follow': 1,
'share': 1,
'shares': 1,
'reactions': 1,
'mentions': 1,
'show': 1,
'read': 1,
'refresh': 1,
'retweet': 1,
'retweets': 1,
'follows': 1,
'comments': 1,
'·': 1,
'|': 1,
'...': 1,

// dangerous
'write': 1,
'page': 1,
'suggested': 1,
'post': 1,
'sponsored': 1,
'recommended': 1,
'you': 1,
'a': 1,
'the': 1,
'for': 1,
'who': 1,
'to': 1,
'go': 1,
'card': 1,
'dismiss': 1,
'this': 1,
'user': 1,
'actions': 1
};
