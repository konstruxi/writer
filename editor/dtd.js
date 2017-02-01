// Voodoo tricks to make content clean (again!)

Editor.DTD = function(editor) {
  var rules;

  // allow pasted divs and spans to be scavenged for meaningful classes
  // Remove them during filtering 
  editor.pasteFilter.allow( 'form div span a article time timestamp abbr * (*)[class,src,href,role,aria-role,title]{*}');
  editor.pasteFilter.allow( '* (*)[class,src,href,role,aria-role,title,width,height]{*}');

  editor.pasteFilter.addTransformations([
      [
          'img: sizeToAttribute',
          'img{width,height}: sizeToStyle'
      ]
  ]);

  editor.on('paste', function(e) {
    editor.isPasting = true;
  })
  editor.on('paste', function(e) {
    editor.isPasting = false;
  }, null, null, 10000)
  editor.on('toHtml', function(e) {
    editor.fire('lockSnapshot');
    if (editor.isPasting) {
      Editor.DTD.processClasses(editor, e.data.dataValue)
      Editor.DTD.processMeta(editor, e.data.dataValue)
      Editor.DTD.processBoundaries(editor, e.data.dataValue)
    }
    editor.fire('unlockSnapshot');
  })
  rules = {
    attributes: {
      class: function(string, element) {
        if (!element.attributes['original-class'] && !element.safeClasses) {
          string = string.toLowerCase()
          // display original class for debugging purposes
          if (!element.attributes['original-class'])
            element.attributes['original-class'] = string;
          var semantic =  []
          var list =  Editor.Content.soundsLikeSemanticClassList;
          var blocked = false;
          // Filter the classes:
          string.split(/\s+/).forEach(function(name) {
            // Should element be ignored completely?
            if (Editor.Content.soundsLikeUIClass[name])
              blocked = true;

            // Is this class semantic?
            for (var i = 0; i < list.length; i++) {
              if (name.indexOf(list[i]) > -1 || element.name == 'section') {
                var replacement = name.indexOf(list[i]) > -1 
                                    ? Editor.Content.soundsLikeSemanticClass[list[i]] || list[i].indexOf('kx') == 0
                                    : name;
                if (semantic.indexOf(replacement) == -1) {
                  semantic.push(replacement);
                }
                break;
              }
            }
          })
          if (blocked) element.invalid = true;
          if (!semantic.length) {
            return false;
          } else {
            return semantic.join(' ')
          }
        }
      }
    },
    text: function(string, context) {
      //if (!context || !context.parent) debugger;
      string = string.replace(/&nbsp;/g, ' ')
      // check if paragraph only consists of meaningless stuff like "1 retweet 2 likes 10 follows"
      if (string.length < 50) {
        //for (var p = context; p  = p.parent;) {
        //  if (p.name == 'h1' || p.name == 'h2' || p.name == 'h3' || p.name == 'div') {
            var tag = string.toLowerCase().replace(/[0-9.,]+k?|[·•|_.?!#…+—]/g, '');
            if (!tag.replace(/[-]/g, ''))
              return false;
            var bits = tag.split(/[\s\t\n]+/)
            for (var i = 0; i < bits.length; i++)
              if (!Editor.Content.soundsLikeUIText[bits[i]])
                return;
            return false;
          //}
        //}
      }

      return string;
    },
    elements: {
      // ignore content within forms (selection crossed form boundary)
      form: function() {
        return false;
      },

      nav: function() {
        return false // new CKEDITOR.htmlParser.element('hr')
      },

      // propagate semantic, classes, remove span
      span: function(element, context) {
        if (Editor.DTD.ignoreUIContent(element, context))
          return false;
        element.filterChildren(context)
        return Editor.DTD.propagateClasses(element);
      },

      // propagate semantic classes, remove div
      div: function(element, context) {
        if (Editor.DTD.ignoreUIContent(element, context))
          return false;

        element.filterChildren(context)
        if (!element.children.length)
          return Editor.DTD.scavengeForPicture(element, editor.dataProcessor.dataFilter);
        if ((element.attributes['aria-role'] || element.attributes.role) == 'article') {
          if (element.children[0]) {
            //new CKEDITOR.htmlParser.element('hr').insertBefore(element.children[0])
            new CKEDITOR.htmlParser.element('hr').insertAfter(element.children[element.children.length - 1])
          }
        }

        // try to make image stick to content within shared ascendant
        var picture = 0;
        for (var i = 0; i < element.children.length; i++) {
          if (Editor.DTD.isPicture(element.children[i])) {
            if (!element.children[i].separating) {
              var picture = element.children[i];
            }
          } else if (element.children[i].name == 'hr') {
            var hr = true;
          } else {
            var other = true;
          }
        }
        if (picture && other) {
          picture.separating = true;
          new CKEDITOR.htmlParser.element('hr', {class: 'soft'}).insertBefore(element.children[0])
        }
        return Editor.DTD.propagateClasses(element);
      },

      article: function (element) {
        element.filterChildren(context)
        new CKEDITOR.htmlParser.element('hr').insertBefore(element)
        new CKEDITOR.htmlParser.element('hr').insertAfter(element)
        return Editor.DTD.propagateClasses(element);
      },

      // keep semantic classes
      $: function(element, context) {
        
        if (element.invalid)
          return false;

        // !! Kill all style attributes
        delete element.attributes.style;
        delete element.styles

        // ignore presentational content
        if (Editor.Content.soundsLikeUIRole[element.attributes['aria-role'] || element.attributes.role])
          return false;


       
        if (element.children[0] && element.children[0].name == 'br')
          element.children.shift()
        if (element.children[0] && element.children[0].name == 'a' && rules.elements.a(element.children[0], context) === false)
          return false;
        if ((!element.children || !element.children[0]) && CKEDITOR.dtd.$removeEmpty[element.name])
          return false;
        //if (element.attributes.hidden || element.attributes['data-hidden'])
        //  return false;

        // wrap into paragraph
        if (!element.parent || !element.parent.name) 
          if (!Editor.DTD.isParagraph(element)) {
            var paragraph = new CKEDITOR.htmlParser.element('p')
            paragraph.add(element)
            return paragraph 
          }
        return element
      },
      h5: function(element) {
        element.name = 'p'
      },
      h4: function(element) {
        element.name = 'p'
      },
      br: function(element) {
        if (element.parent)
          return false;
        // return new CKEDITOR.htmlParser.text('\n');
        //element.replaceWith(new CKEDITOR.htmlParser.text('\n'))

      },
      a: function(element, context) {
        element.filterChildren(context)

        if (!element.children.length) {
          return Editor.DTD.scavengeForPicture(element, context);
        }
        Editor.DTD.scavengeForPicture(element, context);

        // split link if it wraps picture and text together
        //var pictures = [];
        //for (var i = element.children.length; i--;) {
        //  var child = element.children[i];
        //  if (child.name == 'picture') {
        //    pictures.push(child);
        //    if (element.children.length > 1) {
        //      debugger
        //      element.split(i + 1)
        //      if (i) 
        //        element.split(i)
        //    }
        //  }
        //}
        //pictures.forEach(function(picture) {
        //  picture.parentNode.addClass('picture')
        //});
        return;
      },

      ul: function(element, context) {
        element.filterChildren(context)
        // remove empty lists
        if (element.children.length == 0)
          return false;

        // unwrap lists with single item
        if (element.children.length == 1) {
          // unwrap li
          var first = element.children[0];
          Editor.DTD.propagateClasses(first, true);
          first.remove()
          // unwrap ul
          return Editor.DTD.propagateClasses(element, context);
        }

        // unwrap list if one of its item has become section
        for (var child, i = 0; child = element.children[i++];)
          if (child.name == 'section')
            var sectionize = true;
        if (sectionize) {
          new CKEDITOR.htmlParser.element('hr').insertAfter(element)
          var hook = element;
          for (var child, i = 0; child = element.children[i++];) {

            child.name = 'section'; // sections will be stripped out by dtd, but not the hr
            child.insertAfter(hook);
            hook = new CKEDITOR.htmlParser.element('hr')
            hook.insertAfter(child)
            
          }
          return false;
        }
      },
      ol: function(element, context) {
        return rules.elements.ul(element, context)


      },
      // transform lists with multiple paragraphs within single list item
      // into separate sections
      li: function(element, context) {
        element.filterChildren(context)
        if (!element.children.length) return false;
        var paragraph;
        for (var i = 0, child; child = element.children[i++];) {
          if (child.name == 'ol' || child.name == 'ul') {
            element.name = 'section'
          }
          if (child.name && child.name != 'strong' && child.name != 'b'&& child.name != 'em' && child.name != 'time' && child.name != 'attr' && child.name != 'i'
            && (paragraph || child.name != 'a' || (child.children[0] && child.children[0].name && child.children[0].name == 'picture'))) {
            if (!paragraph){
              var paragraph = child;
            }
            else {
              element.name = 'section'
            }
          }
        }
      },

      // remove empty pictures
      picture: function(element, context) {
        element.filterChildren(context)
        if (!element.children.length)
          return false;
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
            paragraphs.push(child);
            paragraph = undefined;
          }
        })
        if (!paragraphs.length)
          return false;
        element.children = paragraphs;
        return element;
      },

      p: function(element, context) {
        element.filterChildren(context)

        // split paragraphs containing pictures, then unwrap pictures
        var wrapper = element;
        for (var i = element.children.length; i--;) {
          var child = element.children[i];
          if (child.name == 'picture' || (child.name == 'a' && child.children.length == 1 && child.children[0].name == 'picture')) {
            if (element.children.length > 1) {
              element.split(i + 1)
              if (i) 
                var wrapper = element.split(i)
            }
            for ( var j = wrapper.children.length - 1; j >= 0; j-- )
              wrapper.children[ j ].insertAfter( wrapper );

            if (!i) return false;

          }
        }

        if (element.hasClass('site-title'))
          element.name = 'h1';
        
        if (!element.children.length || element.children.length == 1 && element.children[0].name == 'br')
          return false;
        //return element;
      },

      // wrap image, handle cors, filter out small images
      img: function (element) {
        if (!element.attributes.src || element.attributes.src.indexOf('data:') == 0)
          return false;
        if ((element.attributes.class || '').toLowerCase().indexOf('emoji') > -1) {
          if (element.attributes.alt && element.attributes.alt.length < 3) {
            element.name = ''
          }
        }
        if (!element.attributes.uid) {
          var src = element.attributes.src;
          if (!src) return false;
          // Need to CORS proxy the image
          if (src.indexOf(location.origin) == -1 && src.indexOf('://') > -1) {
            element.attributes['foreign-src'] = src
            element.attributes.src = '//:0';
          }
        }
        
          
        // wrap images into pictures
        if (element.parent.name != 'picture') {

          // classify as avatar if img had avatar class in source html
          if (element.attributes.width && parseInt(element.attributes.width ) <= 150 
           && element.attributes.height && parseInt(element.attributes.height ) <= 150) {
            
            // ignore tiny pix, they are probably icons
            if (element.attributes.width && parseInt(element.attributes.width ) < 20 
             && element.attributes.height && parseInt(element.attributes.height ) < 20)
              return false;

            element.addClass('maybe-avatar')
          }

          if (element.attributes.class && element.attributes.class.match(/button|cta|action/))
            element.addClass('maybe-cta')

          var picture = new CKEDITOR.htmlParser.element('picture', {
            class: 'loading added '
          });
          picture.safeClasses = true;
          element.replaceWith(picture)
          picture.add(element)
          return
        } else {
          1;// image.attributes.class
        }
        return element;
      }
    }
  }

  // rules are only applicable to pasted content
  var Rules = {
    text: function() {
      if (editor.isPasting)
        return rules.text.apply(this, arguments)
    },

    attributes: {
      class: function() {
        if (editor.isPasting)
          return rules.attributes.class.apply(this, arguments)
      }
    },

    elements: {}
  }

  Object.keys(rules.elements).forEach(function(key) {
    Rules.elements[key] = function(element) {
      // rules are only applicable to pasted content
      if (editor.isPasting && (!element.analyzed || element.analyzed.indexOf(key) == -1)) {
        (element.analyzed || (element.analyzed = [])).push(key);
        return rules.elements[key].apply(this, arguments)
      }
    }
  })
  editor.dataProcessor.dataFilter.addRules(Rules, {priority: -200})

  CKEDITOR.dtd.$avoidNest = {
    p: 1,
    h1: 1,
    h2: 1,
    h3: 1,
    picture: 1,
    li: 1,
    'x-div': 1
  }

  CKEDITOR.dtd.$paragraphs = {
    p: 1,
    ul: 1,
    li: 1,
    ol: 1,
    h1: 1,
    h2: 1,
    h3: 1,
    blockquote: 1
  }

  
  CKEDITOR.dtd['x-div'] = {svg: 1, style: 1}

  CKEDITOR.dtd.picture = {img: 1}
  CKEDITOR.dtd.$object.picture = 1
  CKEDITOR.dtd.$object.img = 1
  /*CKEDITOR.dtd.$block.picture = 1; */
  CKEDITOR.dtd.$block.img = 1; 
  CKEDITOR.dtd.article = Object.create(CKEDITOR.dtd.article)
  CKEDITOR.dtd.article.picture = 1;
  //CKEDITOR.dtd.$intermediate.picture = 1; 


  CKEDITOR.dtd.$block['x-div'] = 1; 
  CKEDITOR.dtd.$block.p = 1; 
  CKEDITOR.dtd.$block.section = 1; 
  CKEDITOR.dtd.$block.ul = 1; 
  CKEDITOR.dtd.$block.ol = 1;  
  CKEDITOR.dtd.$block.li = 1; 
  CKEDITOR.dtd.$block.blockquote = 1; 
  CKEDITOR.dtd.$blockLimit.section = 1; 

  CKEDITOR.dtd.$block.li = 1; 
  /*
  CKEDITOR.dtd.p = 
  CKEDITOR.dtd.h1 = 
  CKEDITOR.dtd.h2 = 
  CKEDITOR.dtd.h3 = 
  CKEDITOR.dtd.li = {a: 1, b: 1, strong: 1, span: 1, em: 1, i: 1};
  CKEDITOR.dtd.blockquote = {p: 1, a: 1, b: 1, strong: 1, span: 1, em: 1, i: 1};
  */

  CKEDITOR.dtd.section = {svg: 1,'x-div': 1, div: 1, time: 1, abbr: 1, strong: 1, em: 1, i: 1, hr: 1, p: 1, a: 1, ul: 1, ol: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, picture: 1, img: 1, blockquote: 1, span: 1};


  CKEDITOR.dtd.a = Object.create(CKEDITOR.dtd.a)
  CKEDITOR.dtd.a.picture = 1;


  CKEDITOR.dom.elementPath.prototype.isContextFor = function() {
    return true;
  }
}


// keep interesting classes, but remove element
Editor.DTD.propagateClasses = function(element, wrap) {
  if (element.attributes.class) {
    var className = element.attributes.class.toLowerCase();
    var semantic = [];
    Editor.Content.soundsLikeSemanticClassList.forEach(function(kls) {
      if (className.indexOf(kls) > -1) {
        semantic.push(Editor.Content.soundsLikeSemanticClass[kls]);
      }
    })
  }
  if (semantic && semantic.length) {

    // attempt to propagate class to immediate children
    var propagated = false;
    if (element.children.length < 3)
      element.children.forEach(function(child) {
        if (child.addClass)

        semantic.forEach(function(kls) {
          propagated = true;
          child.addClass(kls)
        })
      })

    // otherwise proapgate to parent
    if (!propagated && element.parent && element.parent.addClass && element.children.length) {
      semantic.forEach(function(kls) {
        element.parent.addClass(kls)
      })
    }
  }
  // unwrap block, create paragraphs if needed


  var currentParagraph;
  var children = Array.prototype.slice.call(element.children)
  var last = element;
  for ( var i = 0; i < children.length; i++) {
    var child = children[i];
    if (!Editor.DTD.isParagraph(child) && (!element.parent || !element.parent.name || wrap)) {
      if (!currentParagraph) {
        var currentParagraph = new CKEDITOR.htmlParser.element('p');
        currentParagraph.insertAfter(last)
      }
      child.remove()

      currentParagraph.add(child)
    } else {
      child.insertAfter(last)
      last = child
      currentParagraph = undefined;
    }
  }
  return false;


}

Editor.DTD.addClasses = function(element, klasses) {
  klasses.split(/\s/).forEach(function(kls) {
    element.addClass(kls)
  });
  return element;
}

Editor.DTD.getLength = function(element) {
  if (!element.name && element.value)
    return element.value.length;

  var length = 0;
  if (element.children) {
    for (var i = 0; i < element.children.length; i++) 
      length += Editor.DTD.getLength(element.children[i])
  }
  return length;
}
Editor.DTD.processClasses = function(editor, element, parent, root) {
  for (var i = 0; i < element.children.length; i++) {
    var child = element.children[i];
    var grand = child.children && child.children[0]

    switch (child.name) {
      case 'section':
        // go deeper
        Editor.DTD.processClasses(editor, child, element)
        break

      case 'p': case 'li': case 'a': case 'picture':
        // propagate link class to paragraph'
            // <p><a class> -> <p class><a>
            if (element.children && 
                      child.children.length == 1 && 
                      grand.children && grand.children.length == 1 && 
                      grand.children[0].attributes && 
                      grand.children[0].attributes.class) {
              Editor.DTD.addClasses(child, grand.children[0].attributes.class)
            // <p><a><strong class/></a><a><em class/></a> -> <p><a class><strong/></a><a class><em/></a>
            }
            if (child.children.length == 1 && grand.attributes && grand.attributes.class) {
              Editor.DTD.addClasses(child, grand.attributes.class);
            // <p><a><strong class> -> <p class><a><strong>
            } else if (grand.children) {
              for (var j = 0; j < grand.children.length; j++)
                if (grand.children[j].attributes && 
                    grand.children[j].attributes.class) {
                  Editor.DTD.addClasses(grand, grand.children[j].attributes.class)
                }
            }
            // check if its probably all meta inside
            if (child.children && Editor.DTD.getLength(child) < 80) {
              var hasNonMeta = false;
              var hasMeta = false;
              var hasText = false;
              for (var j = 0; j < child.children.length; j++) {
                var grand = child.children[j]
                if (!grand.name) {
                  var hasText = true;
                } else if (!grand.attributes || !grand.attributes.class || !grand.attributes.class.match(/author|source|category|timestamp|avatar/)) {
                  var hasNonMeta = true;
                } else {
                  var hasMeta = true;
                }
              }
              if (hasMeta && !hasNonMeta) {
                if (hasText) {
                  child.addClass('meta')
                }
              }
            } 
        break;

      case 'a':
        if (grand && grand.name == 'picture') {
          if (child.children[0].hasClass('avatar'))
            child.addClass('avatar')
          child.addClass('picture')
        }
        break;
    }
  }
}  

Editor.DTD.getElementByClassName = function(element, name, start) {
  for (var i = start || 0; i < element.children.length; i++) {
    var child = element.children[i];
    if (start != null && child.name == 'hr')
      return;

    if (child.attributes && child.attributes.class)
      if (child.hasClass(name))
        return child;
    if (child.attributes) {
      var result = Editor.DTD.getElementByClassName(child, name)
      if (result) return result;
    }
  }
}

var metaClasses = ['author', 'timestamp', 'source-url', 'source-via', 'source-context', 'meta', 'avatar']
Editor.DTD.processMeta = function(editor, element, parent) {
  var hadMeta = false;
  var currentList;
  var currentClasses;
  var lists = [];

  for (var i = 0; i < element.children.length; i++) {
    var child = element.children[i];
    if (child.parent != element)
      child.parent = element; // ? seems .add is not two way
    var prev = element.children[i - 1]
    if (!currentClasses) currentClasses = metaClasses.map(function(kls) {
      return Editor.DTD.getElementByClassName(element, kls, i)
    })
    switch (child.name) {
      case 'section':
        // go deeper
        Editor.DTD.processMeta(editor, child, element)
        break

      case 'hr':
        if (!child.hasClass('soft')) {
          currentList = undefined;
        //else if (prev && prev.hasClass('meta'))
        //  element.children.splice(i--, 1);
        } else {
          currentList = undefined;
          currentClasses = undefined
        }
        break;

      case 'a': case 'p': 

        // promote paragraphs and links with title class
        for (var j = 0; j < metaClasses.length; j++) {
          var maybe = child.hasClass('maybe-' + metaClasses[j]);

          // if current section doesnt have definite class like "author"
          // but has this "maybe-author" and doesnt have "maybe-content"
          // treat it as if it was "author" instead.
          if (child.hasClass(metaClasses[j]) ||
             (!currentClasses[j] && maybe && (!child.hasClass('maybe-content')))) {
            child.addClass(metaClasses[j])

            // collect meta items into an unordered list
            if (!currentList) {
              currentList = new CKEDITOR.htmlParser.element('ul', {class: 'meta'});
              currentList.insertAfter(child)
              lists.push(currentList)
              hadMeta = true;
            }
            child.name = 'li'
            currentList.add(child)
            element.children.splice(i--, 1);
            break;
          }
          if (maybe)
            child.removeClass('maybe-' + metaClasses[j])
        }

        if (child.hasClass('title')) {
          if (child.name == 'p') {
            child.name = 'h2';
          } else if (child.name == 'a' && child.children[0] && child.children[0].name != 'picture') {
            var heading = new CKEDITOR.htmlParser.element('h2');
            child.replaceWith(heading)
            heading.add(child)
          }
        }
        if (child.hasClass('text-quote') 
              && child.children[0]
              && child.name != 'picture' 
              && (child.name != 'a' || child.children[0].name != 'picture')) {
          if (child.name == 'blockquote') {
            var quote = child;
            var quoted = child.children;

            // got quote without <p>, add them
            if (child.children[0].name != 'p') {
              var p = new CKEDITOR.htmlParser.element('p');
              child.children.forEach(function() {
                p.add(child)
              })
              child.children = [];
              child.add(p)
            }
          } else {
            var quote = new CKEDITOR.htmlParser.element('blockquote');
            child.replaceWith(quote)
            if (child.name == 'p') {
              quote.add(child)
            } else {
              var paragraph = new CKEDITOR.htmlParser.element('p');
              quote.add(paragraph)
              paragraph.add(child)
            }
          }
        }
        if (child.children[0] && child.children[0].name == 'picture') {
          if (child.children[0].hasClass('avatar'))
            child.addClass('avatar')
          child.addClass('picture')
        }
        break;
    }

    // split <p>
    //if (child.name == 'p' || child.name == 'li') {
    //  var allMeta = false;
    //  var length = 0;
    //  for (var i = 0; i < element.children.length; i++) {
    //    for (var )
    //  }
    //}
  }

  for (var i = 0; i < lists.length; i++) {
    for (var j = 0; j < lists[i].children.length; j++) {
      var item = lists[i].children[j]
      var currentParagraph = null;
      var children = item.children.slice()
      for (var k = 0; k < children.length; k++) {
        var content = children[k];
        if (content.name == 'picture' || content.name == 'a' && (content.name == 'a' && content.children[0] && content.children[0].name != 'picture')) {
          currentParagraph = null;
        } else {
          if (!currentParagraph) {
            currentParagraph = new CKEDITOR.htmlParser.element('p');
            currentParagraph.insertBefore(content)
          }
          content.remove()
          currentParagraph.add(content);
        }
      }
    }
  }

  // split pasted content into its own sections
  //if (hadMeta && element.children[0]) {
  //  if (element.children[0].name != 'hr')
  //    new CKEDITOR.htmlParser.element('hr').insertBefore(element.children[0])
  //  if (element.children[element.children.length - 1].name != 'hr')
  //    new CKEDITOR.htmlParser.element('hr').insertAfter(element.children[element.children.length - 1])
  //}
}

Editor.DTD.processBoundaries = function(editor, element, hasHardBoundaries) {
  var children = Array.prototype.slice.call(element.children)
  for (var i = 0; i < children.length; i++) {
    var child = children[i]
    if (child.name == 'section' || (child.name == 'hr' && !child.hasClass('soft')))
      hasHardBoundaries = true;
    if (child.name == 'section') {
      var sectionized = true;
      var prev = child.previous
      if (prev && prev.name == 'hr')
        prev.addClass('small')
      for (var grand; grand = child.children.pop();)
        grand.insertAfter(child)
      child.remove()
    }
  }

  for (var i = 0; i < element.children.length; i++) {
    // join meta blocks
    var child = element.children[i]
    var prev = element.children[i - 1]
    if (child.name == 'ul' && child.hasClass('meta')) {
      var hadMeta = true;
      if (prev && prev.name == 'ul' && prev.hasClass('meta')) {
        for (var grand; grand = child.children.shift();)
          prev.add(grand);
        element.children.splice(i--, 1)
      }
    }
  }


  if (hasHardBoundaries)
    for (var i = 0; i < element.children.length; i++) {
      var child = element.children[i];
      // remove soft boundaries
      if (child.name == 'hr' && child.hasClass('soft')) {
        element.children.splice(i--, 1)
      // remove double rulers
      } else if (child.name == 'hr' && element.children[i - 1] && element.children[i - 1].name == 'hr') {
        if (element.children[i - 1].hasClass('small')) {
          child.addClass('small')
        }
        element.children.splice(--i, 1)
      }
    }

  if (hadMeta && element.children[0]) {
    if (element.children[0].name != 'hr')
      new CKEDITOR.htmlParser.element('hr').insertBefore(element.children[0])
    
    element.children[0].removeClass('soft')
    if (sectionized)
      element.children[0].addClass('small')
    if (element.children[element.children.length - 1].name != 'hr')
      new CKEDITOR.htmlParser.element('hr').insertAfter(element.children[element.children.length - 1])
    else
      element.children[element.children.length - 1].removeClass('soft')
  }

}

Editor.DTD.ignoreUIContent = function(element) {
  if (Editor.Content.soundsLikeUIRole[element.attributes['aria-role'] || element.attributes.role])
    return true;

  if (element.attributes.class) {
    var className = element.attributes.class.toLowerCase();
    var blocked = false;
    className.split(/\s+/).forEach(function(name) {
      // Should element be ignored completely?
      if (Editor.Content.soundsLikeUIClass[name]) {
        blocked = true;
      }
    });
  }

  return blocked;
}

Editor.DTD.isPicture = function(element) {
  return element.name == 'picture' || element.name == 'a' && element.children.length == 1 && element.children[0].name == 'picture'
}

// attempt to turn element with background image into an image by itself
Editor.DTD.scavengeForPicture = function(element, filter) {
  var kls = element.attributes.class || element.classes && element.classes.join(' ') || ''
  if (element.styles && kls.indexOf('image') > -1) {
    var style = element.styles['background-image'] || element.styles['background'];
    if (style) {
      var url = style.match(/url\("?([^"\)]+)(?:"?\)|$)/i)
      if (url) {
        element.styles['background-image'] = element.styles['background'] = undefined;
        var img = new CKEDITOR.htmlParser.element('img');
        img.attributes.src = url[1]
        element.add(img);
        img.filter(filter)
        return element;
      }
    }
  }
  return false;
}
Editor.DTD.isParagraph = function(child) {
  return (child.name && child.name != 'strong' && child.name != 'b'&& child.name != 'abbr'&& child.name != 'time'&& child.name != 'em' && child.name != 'i'
       && (child.name != 'a' || (child.children[0] && child.children[0].name && child.children[0].name == 'picture')))
}