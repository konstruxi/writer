
Editor.DTD = function(editor) {
  var rules;

  // allow pasted divs and spans to be scavenged for meaningful classes
  // Remove them during filtering 
  editor.pasteFilter.allow( 'div span a * (*)[class,src,href,role,aria-role,title]{*}');
  editor.pasteFilter.allow( '* (*)[class,src,href,role,aria-role,title]{*}');

  editor.on('toHtml', function(e) {
    editor.fire('lockSnapshot');
    Editor.DTD.processClasses(editor, e.data.dataValue)
    editor.fire('unlockSnapshot');
  })
  
  editor.dataProcessor.dataFilter.addRules(rules = {
    text: function(string, context) {
      if (!context || !context.parent) return false;

      string = string.replace(/&nbsp;/g, ' ')
      // check if paragraph only consists of meaningless stuff like "1 retweet 2 likes 10 follows"
      if (string.length < 50) {
        //for (var p = context; p  = p.parent;) {
        //  if (p.name == 'h1' || p.name == 'h2' || p.name == 'h3' || p.name == 'div') {
            var tag = string.toLowerCase().replace(/[0-9.,]+k?|[·•|_.?!:#…+-]/g, '');

            var bits = tag.split(/[\s\t\n]+/)
            for (var i = 0, bit; bit = bits[i++];)
              if (!Editor.Content.soundsLikeUIText[bit || ''])
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
      span: function(element) {
        if ((element.attributes['aria-role'] || element.attributes.role) == 'presentation')
          return false;
        element.filterChildren(editor.dataProcessor.dataFilter)
        return Editor.DTD.propagateClasses(element, true);
      },

      // propagate semantic classes, remove div
      div: function(element) {
        if ((element.attributes['aria-role'] || element.attributes.role) == 'presentation')
          return false;
        

        element.filterChildren(editor.dataProcessor.dataFilter)
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
              picture.separating = true;
            }
          } else if (element.children[i].name == 'hr') {
            var hr = true;
          } else {
            var other = true;
          }
        }
        if (picture && other) {
          debugger
          new CKEDITOR.htmlParser.element('hr', {class: 'soft'}).insertBefore(element.children[0])
        }
        return Editor.DTD.propagateClasses(element, true);
      },

      article: function (element) {
        return Editor.DTD.propagateClasses(element, true);
      },

      // keep semantic classes
      $: function(element) {
        
        // !! Kill all style attributes
        delete element.attributes.style;

        // ignore presentational content
        if (Editor.Content.soundsLikeUIRole[element.attributes['aria-role'] || element.attributes.role])
          return false;


        if (element.attributes.class && !element.attributes['original-class']) {
          // display original class for debugging purposes
          if (!element.attributes['original-class'])
            element.attributes['original-class'] = element.attributes.class;
          else
            debugger
          var semantic =  []
          var list =  Editor.Content.soundsLikeSemanticClassList;
          var blocked = false;
          // Filter the classes:
          console.error(element.attributes.class)
          element.attributes.class.split(/\s+/).forEach(function(name) {
            // Should element be ignored completely?
            if (Editor.Content.soundsLikeUIClass[name])
              blocked = true;

            // Is this class semantic?
            for (var i = 0; i < list.length; i++) {
              if (name.indexOf(list[i]) > -1 || name == 'forced') {
                var replacement = name.indexOf(list[i]) > -1 
                                    ? Editor.Content.soundsLikeSemanticClass[list[i]]
                                    : name;
                if (semantic.indexOf(replacement) == -1) {
                  semantic.push(replacement);
                }
                break;
              }
            }
          })
          if (blocked) return false;
          if (!semantic.length) {
            delete element.attributes.class
          } else {
            element.attributes.class = semantic.join(' ')

            // propagate image classes up
            if (element.parent && element.parent.children.length == 1) {
              element.parent.attributes.class += ' ' + semantic.join(' ')
            }
          }
        }

        if (element.children[0] && element.children[0].name == 'br')
          element.children.shift()
        if (element.children[0] && element.children[0].name == 'a' && rules.elements.a(element.children[0]) === false)
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
      a: function(element) {
        element.filterChildren(editor.dataProcessor.dataFilter)

        if (!element.children.length) {
          return Editor.DTD.scavengeForPicture(element, editor.dataProcessor.dataFilter);
        }
        Editor.DTD.scavengeForPicture(element, editor.dataProcessor.dataFilter);

        // split link if it wraps picture and text together
        var pictures = [];
        for (var i = element.children.length; i--;) {
          var child = element.children[i];
          if (child.name == 'picture') {
            pictures.push(child);
            if (element.children.length > 1) {
              element.split(i + 1)
              if (i) 
                element.split(i)
            }
          }
        }
        //pictures.forEach(function(picture) {
        //  picture.parentNode.addClass('picture')
        //});
        return element;
      },

      ul: function(element) {
        element.filterChildren(editor.dataProcessor.dataFilter)
        // remove empty lists
        if (element.children.length == 0)
          return false;

        // unwrap lists with single item
        if (element.children.length == 1) {
          var node = element.children[0];
          for ( var i = node.children.length - 1; i >= 0; i-- ) {
            node.children[ i ].insertAfter( element );
          }
          return false;
        }

        // unwrap list if one of its item has become section
        for (var child, i = 0; child = element.children[i++];)
          if (child.name == 'section')
            var sectionize = true;
        if (sectionize) {
          //var index = element.parent && element.parent.children.indexOf(element);
          //if (index > 0 && element.parent) {
          //  element.parent.split(index)
          //}

          new CKEDITOR.htmlParser.element('hr').insertAfter(element)
          for (var child, i = 0; child = element.children[i++];) {

            child.name = 'section'; // sections will be stripped out by dtd, but not the hr
            child.insertAfter(element);
            new CKEDITOR.htmlParser.element('hr').insertAfter(element)
            
            
          }
          return false;
        }
      },
      ol: function(element) {
        element.filterChildren(editor.dataProcessor.dataFilter)
        // remove empty lists
        if (element.children.length == 0)
          return false;

        // unwrap lists with single item
        if (element.children.length == 1) {
          var node = element.children[0];
          for ( var i = node.children.length - 1; i >= 0; i-- ) {
            node.children[ i ].insertAfter( element );
          }
          return false;
        }

        // unwrap list if one of its item has become section
        for (var child, i = 0; child = element.children[i++];)
          if (child.name == 'section')
            var sectionize = true;
        if (sectionize) {
          var index = element.parent && element.parent.children.indexOf(element);
          if (index > 0 && element.parent.split) {
            element.parent.split(index)
          }

          
          new CKEDITOR.htmlParser.element('hr').insertAfter(element)
          for (var child, i = 0; child = element.children[i++];) {

            child.name = 'section'; // sections will be stripped out by dtd, but not the hr
            child.insertAfter(element);
            new CKEDITOR.htmlParser.element('hr').insertAfter(element)
          }
          
          return false;
        }


      },
      // transform lists with multiple paragraphs within single list item
      // into separate sections
      li: function(element) {
        element.filterChildren(editor.dataProcessor.dataFilter)
        if (!element.children.length) return false;
        var paragraph;
        for (var i = 0, child; child = element.children[i++];) {
          if (child.name && child.name != 'strong' && child.name != 'b'&& child.name != 'em' && child.name != 'i'
            && (paragraph || child.name != 'a' || (child.children[0].name && child.children[0].name == 'picture'))) {
            if (!paragraph)
              var paragraph = child;
            else {
              element.name = 'section'
            }
          }
        }
      },

      // remove empty pictures
      picture: function(element) {
        element.filterChildren(editor.dataProcessor.dataFilter)
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
            paragraphs.push(child);
            paragraph = undefined;
          }
        })
        if (!paragraphs.length)
          return false;
        element.children = paragraphs;
        return element;
      },

      p: function(element) {
        element.filterChildren(editor.dataProcessor.dataFilter)

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
        return element;
      },

      // wrap image, handle cors, filter out small images
      img: function (element) {
        if (!element.attributes.src || element.attributes.src.indexOf('data:') == 0)
          return false;
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
            if (element.attributes.width && parseInt(element.attributes.width ) < 40 
             && element.attributes.height && parseInt(element.attributes.height ) < 40)
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
  }, { applyToAll: true })

  CKEDITOR.dtd.$avoidNest = {
    p: 1,
    h1: 1,
    h2: 1,
    h3: 1,
    picture: 1,
    li: 1
  }

  

  CKEDITOR.dtd.picture = {img: 1}
  CKEDITOR.dtd.$object.picture = 1
  CKEDITOR.dtd.$object.img = 1
  /*CKEDITOR.dtd.$block.picture = 1; */
  CKEDITOR.dtd.$block.img = 1; 
  CKEDITOR.dtd.article = Object.create(CKEDITOR.dtd.article)
  CKEDITOR.dtd.article.picture = 1;
  //CKEDITOR.dtd.$intermediate.picture = 1; 


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

  CKEDITOR.dtd.section = {hr: 1, p: 1, a: 1, ul: 1, ol: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, picture: 1, img: 1, blockquote: 1, span: 1};


  CKEDITOR.dtd.a = Object.create(CKEDITOR.dtd.a)
  CKEDITOR.dtd.a.picture = 1;


  CKEDITOR.dom.elementPath.prototype.isContextFor = function() {
    return true;
  }
}


// keep interesting classes, but remove element
Editor.DTD.propagateClasses = function(element, unwrap) {
  if (element.attributes.class) {
    var semantic = [];
    Editor.Content.soundsLikeSemanticClassList.forEach(function(kls) {
      if (element.attributes.class.indexOf(kls) > -1) {
        semantic.push(Editor.Content.soundsLikeSemanticClass[kls]);
      }
    })
  }
  if (semantic && semantic.length) {

    // attempt to propagate class to immediate children
    var propagated = false;;
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
        if (kls == 'avatar')
          debugger
        element.parent.addClass(kls)
      })
    }
  }
  // unwrap
  if (unwrap) {
    for ( var i = element.children.length - 1; i >= 0; i-- ) {
      if ((!element.parent || !element.parent.name) && 
          (!Editor.DTD.isParagraph(element.children[i]))) {
        var p = new CKEDITOR.htmlParser.element('p');
        p.add(element.children[i])
        p.insertAfter( element );
      } else {
        element.children[ i ].insertAfter( element );
      }
    }
    return false;
  }


}

Editor.DTD.processClasses = function(editor, element, parent) {
  for (var i = 0; i < element.children.length; i++) {
    var child = element.children[i];
    switch (child.name) {
      case 'section':
        // go deeper
        Editor.DTD.processClasses(editor, child, element)
        break

      case 'a':
        if (child.children[0] && child.children[0].name == 'picture') {
          if (child.children[0].hasClass('avatar'))
            child.addClass('avatar')
          child.addClass('picture')
        }
        break;
    }
  }
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
  return (child.name && child.name != 'strong' && child.name != 'b'&& child.name != 'em' && child.name != 'i'
       && (child.name != 'a' || (child.children[0].name && child.children[0].name == 'picture')))
}