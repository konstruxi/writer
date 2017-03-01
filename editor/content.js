CKEDITOR.dom.elementPath.prototype.isContextFor = function() {
  return true;
}


Editor.Content = function(editor) {
  var root = editor.element.$;
  var elements = Array.prototype.slice.call(root.getElementsByTagNameNS("http://www.w3.org/1999/xhtml", '*'));
  var result = []
  loop: for (var i = 0; i < elements.length; i++) {
    //for (var parent = elements[i]; parent; parent = parent.parentNode) {
      //if ((parent.classList && parent.classList.contains('toolbar')) 
      //  ||(parent.className && parent.className.indexOf && parent.className.indexOf('cke_') > -1))
      //  continue loop;
      if (Editor.Content.isBlock(elements[i]) || elements[i].classList.contains('kx')) {
        result.push(elements[i])
      }
    //}
  }
  return result;
}


Editor.Content.cleanEmpty = function(editor, force, blur) {
  if (!editor.element) return;
  
  var selection = editor.getSelection();
  if (selection) {
    if (editor.refocusing) {
      var selected = editor.refocusing;
    } else {
      var selected = selection.getStartElement();
      if (selected) selected = selected.$;
    }
  }
  var children = editor.element.$.children;
  var snapshot = editor.stylesnapshot;
  editor.fire('lockSnapshot');
  var cleaned = [];
  for (var i = 0; i < children.length; i++) {
    var inside = selected && Editor.Content.isInside(selected, children[i]);
    if (selected && inside) {
      if (editor.section != children[i]) {
        if (editor.section)
          editor.section.classList.remove('focused')
        editor.section = children[i]
        editor.section.classList.add('focused')
        Editor.Section.setActive(editor, editor.section, true)
        //Editor.Chrome.update(editor)
      }
    }
    if ((!selected || force || !inside) && !editor.doNotBlur) {
      if (Editor.Content.isEmpty(children[i])) {
        //if (!snapshot) 
        //  snapshot = editor.stylesnapshot = snapshotStyles(editor)
        if (selected) 
          if (inside) {
            if (!before && !after) {
              var before = children[i].previousElementSibling;
              var after = children[i].nextElementSibling;
            }
          } else if (!bookmark && !editor.refocusing && !blur) {
            var bookmark = selection.createBookmarks();
          }

        cleaned.push(children[i])
      } else if (!children[i].classList.contains('kx') && !children[i].classList.contains('kx-placeholder')) {
        var els = []
        var grandchildren = children[i].children;
        for (var j = 0; j < grandchildren.length; j++) {
          if (grandchildren[j].classList.contains('kx'))
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
    if (cleaned[i].parentNode) {
      cleaned[i].parentNode.removeChild(cleaned[i])
    }
    //if (editor.snapshot)
    //  editor.snapshot.removeElement(cleaned[i])
  }
  if (cleaned.length) {
    console.log('cleaned', cleaned)
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
                            || element.tagName == 'ABBR'
                            || element.tagName == 'TIME'
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
        
       // special case picture inside A
       || (element.tagName == 'PICTURE')
       || (element.tagName == 'IMG')
       || (element.tagName == 'A' && element.getElementsByTagName('PICTURE')[0])
}

Editor.Content.isPicture = function(element) {
  return (element.tagName == 'PICTURE')
       || (element.tagName == 'A' && element.getElementsByTagName('PICTURE')[0])
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

Editor.Content.isEmpty = function(child, includePlaceholders) {
  if (child.nodeType == 3) {
    var text = child.nodeValue
  } else {
    if (child.getAttribute('kx-text') != null)
      return false;
    if (child.tagName == 'IMG' || child.tagName == 'HR' || (child.tagName == 'PICTURE' && child.getElementsByTagName('img')[0])
    || child.tagName == 'BR' || child.tagName == 'svg' || child.tagName == 'use' || (child.classList && (child.classList.contains('kx') || (!includePlaceholders && child.getAttribute('itempath')))))
      return false;
    var text = child.textContent
  }
  //if (child.tagName == 'P') {
  for (var i = 0; i < text.length; i++)
    switch (text.charAt(i)) {
      case '&nbsp;': case ' ': case '\n': case '\r': case '\t': case "​": case " ": case " ":
        break;
      default:
        return false;
    }
//}
  return child.nodeType != 1 || !child.querySelector('img, video, iframe, .kx-placeholder, [kx-text]');
}


Editor.Content.willSelectionBeCleaned = function(editor, elements, options) {
  for (var e, i = 0; e = elements[i++];) {
    var tag = e.tagName;
    switch (e.tagName) {
      case 'UL': case 'OL':
        if (options.lists) {
          return true;
        }
        break;
      case 'LI': case 'H1': case 'H2': case 'H3':
        if ((e.tagName == 'LI' && options.lists) ||
            (e.tagName.charAt(0) == 'H' && options.titles)) {
          return true;
        }
        break;
      case 'BLOCKQUOTE':
        if (options.quotes && e.firstElementChild && e.firstElementChild.tagName == 'P') {
          return true;
        }
    }
  }
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


  if (!start && !end) {
    // run read-only cleanse upfront to see if we need heavy bookmarking business
    if (!Editor.Content.willSelectionBeCleaned(editor, elements, options))
      return
    var bookmark = selection.createBookmarks()
  }
  


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
  } else if (bookmark) {
    selection.selectBookmarks(bookmark);
  }
}

Editor.Content.parseYoutubeURL = function(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
}


Editor.Content.prepare = function(element) {
  for (var i = element.childNodes.length; i--;) {
    if (element.childNodes[i].nodeType == 3) {
      var trim = element.childNodes[i].nodeValue.trim().replace(/\s+/, ' ');
      if (trim == '') {
        element.removeChild(element.childNodes[i]);
      } else if (trim != element.childNodes[i].nodeValue) {
        element.childNodes[i].nodeValue = trim;
      }
    } else {
      Editor.Content.prepare(element.childNodes[i])
    }
  }
}


if (!Editor.Content.dummy)
  Editor.Content.dummy = document.createElement('div');
Editor.Content.export = function(editor, content) {
  Editor.Content.cleanEmpty(editor)

  for (var i = 0; i < content.children.length; i++) {
    Editor.Section.clean(editor, content.children[i], i)
  }
  Array.prototype.forEach.call(content.querySelectorAll('.kx.toolbar, .list, article, header'), function(el) {
    el.setAttribute('title', 'deleting')
    for (var i = 0; i < el.children.length; i++)
      el.children[i].setAttribute('title', 'deleting');
  })

  editor.doNotParseOnOutput = true;
  Editor.Content.dummy.innerHTML = editor.getData()
    .replace(/\s(?:style)="[^"]*?"/gi, '')
    .replace(/\s(?:src)="data:[^"]*?"/gi, 'src="data:blob"');
  editor.doNotParseOnOutput = null;
  // FIXME: ckeditor unwraps list items, so i use attribute on original content
  Array.prototype.forEach.call(Editor.Content.dummy.querySelectorAll('[title="deleting"]'), function(el) {
    el.parentNode.removeChild(el);
  })

  Array.prototype.forEach.call(content.querySelectorAll('[title="deleting"]'), function(el) {
    el.removeAttribute('title')
  })
  Array.prototype.forEach.call(content.querySelectorAll('picture'), function(el) {
    el.classList.remove('added')
  })
  Array.prototype.forEach.call(Editor.Content.dummy.querySelectorAll('.meta.expanded'), function(el) {
    if (Editor.Content.isEmpty(el, true))
      el.parentNode.removeChild(el);
    else
      el.classList.remove('expanded')
  })

  Array.prototype.forEach.call(Editor.Content.dummy.children, function(el) {
    if (el.tagName != 'SECTION') el.parentNode.removeChild(el);
  });
  Array.prototype.forEach.call(Editor.Content.dummy.querySelectorAll('[itempath]'), function(el) {
    el.removeAttribute('error')
    if (Editor.Content.isEmpty(el, true)) {
      el.parentNode.removeChild(el);
    } else {
      el.classList.remove('kx-placeholder')
      //el.removeAttribute('tabindex')
    }
  })
  var value = Editor.Content.dummy.innerHTML
    .replace(/\&nbsp;/gi, '&#160;')
    .replace(/(<img[^>]*[^\/])>/gi, '$1/>')
    .replace(/<(hr|br)\s*>/ig, '$1/>')
    .replace(/((?:href|src)=")([^"]+)"/gi, function(m, m1, m2) {
      if (m2.substring(0, 2) != './'
      && m2.substring(0, 3) != '/./' 
      && m2.indexOf('/') > -1)
        return m;
      return m1 + './' + m2.split('/').pop() + '"';
    });

  return value

}

Editor.Content.soundsLikeSemanticClass = {
  'maybe-avatar': 'maybe-avatar',

  'avatar':    'avatar',
  'timestamp': 'timestamp',
  'post__time_published':  'timestamp',
  'datetime':  'timestamp',
  'date':      'maybe-timestamp',
  'time':      'maybe-timestamp',


  'title':     'title',
  'heading':   'title',
  'subtitle':  'title',
  'header':    'title',

  'maybe-ad':  'maybe-ad',
  'banner':    'maybe-ad',
  'advert':    'maybe-ad',
  'brand':     'maybe-ad',
  'sponsor':   'maybe-ad',
  'tracking':  'maybe-ad',
  'tracker':   'maybe-ad',
  'beacon':    'maybe-ad',

  'content':   'maybe-content',
  'text':      'maybe-content',

  'meta':      'meta',

  'maybe-category': 'maybe-category',
  'label':          'maybe-category',
  'category':       'maybe-category',
  'tags':           'maybe-category',
  'rubric':         'maybe-category',

  'maybe-author': 'maybe-author',
  'g-hovercard': 'maybe-author', //youtube

  'author' :   'author',
  'user' :     'maybe-author',
  'profile' :  'maybe-author',
  'actor':     'maybe-author',
  'byline':    'maybe-author',

  'excerpt' :   'excerpt',
  'summary' :   'maybe-excerpt',

  'text-quote': 'text-quote',
  'tweet-text': 'text-quote', //twitter

  'source-url': 'source-url',
  'permalink': 'source-url',

  'source-via': 'source-via',
  'tweet-context': 'source-via',

  'tweet-context': 'source-context',

  'site-title': 'site-title' //wordpress
}

Editor.Content.soundsLikeSemanticClassList = Object.keys(Editor.Content.soundsLikeSemanticClass)
Editor.Content.soundsLikeSemanticClassValues = {}
Object.keys(Editor.Content.soundsLikeSemanticClass).filter(function(kls) {
  Editor.Content.soundsLikeSemanticClassValues[Editor.Content.soundsLikeSemanticClass[kls]] = 1;
})

Editor.Content.soundsLikeUIRole = {
  'presentation': 1,
  'toolbar': 1,
  'button': 1,
  'menu': 1,
  'navigation': 1,
  'banner': 1
}
Editor.Content.soundsLikeUIClass = {
  'ufiaddcomment': 1, // fb add comment section
  'ufilikesentence': 1, // fb reactions section
  'u-hiddenvisually': 1,//twitter class for hidden stuff
  'shelf-annotation': 1, // youtube chrome text
  'discussion-sidebar': 1 //github issues sidebar
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
'vote': 1,
'upvote': 1,
'downvote': 1,
'edit': 1,
'delete': 1,
'add': 1,
'friend': 1,
'favorites': 1,
'favorite': 1,
'follow': 1,
'share': 1,
'shares': 1,
'reactions': 1,
'mentions': 1,
'show': 1,
'read': 1,
'see': 1,
'refresh': 1,
'retweet': 1,
'retweets': 1,
'follows': 1,
'comments': 1,
'tweet': 1,
'pin': 1,
'·': 1,
'|': 1,
'...': 1,

// dangerous
'buffer': 1, // some kind of social app
'write': 1,
'page': 1,
'suggested': 1,
'subscribe': 1,
'post': 1,
'sponsored': 1,
'promoted': 1,
'recommended': 1,
'next': 1,
'previous': 1,
'story': 1,
'stories': 1,
'you': 1,
'a': 1,
'the': 1,
'for': 1,
'who': 1,
'to': 1,
'by': 1,
'go': 1,
'down': 1,
'up': 1,
'card': 1,
'dismiss': 1,
'this': 1,
'user': 1,
'actions': 1
};
