
Editor.DTD = function(editor) {
  var rules;
  editor.dataProcessor.dataFilter.addRules(rules = {
    text: function(string, context) {
      if (!context || !context.parent) return false;

      string = string.replace(/&nbsp;/g, ' ')

      // check if paragraph only consists of meaningless stuff like "1 retweet 2 likes 10 follows"
      if (string.length < 50) {
        for (var p = context; p  = p.parent;) {
          if (p.name == 'p' || p.name == 'li') {
            var tag = string.toLowerCase().replace(/[·|_.?!-:#]|[0-9.,]+[kK]?/g, '');
            var bits = tag.split(/[\s\t\n]+/)
            for (var i = 0, bit; bit = bits[i++];)
              if (!Editor.Content.soundsLikeUIText[bit || ''])
                return;
            return false;
          }
        }
      }

      return string;
    },
    elements: {
      ul: function(element) {
        element.filterChildren(editor.dataProcessor.dataFilter)
        if (element.children.length == 0)
          return false;
        if (element.children.length == 1) {
          var node = element.children[0];
          for ( var i = node.children.length - 1; i >= 0; i-- ) {
            node.children[ i ].insertAfter( element );
          }
          return false;
        }
      },
      ol: function(element) {
        element.filterChildren(editor.dataProcessor.dataFilter)
        if (element.children.length == 0)
          return false;
        if (element.children.length == 1) {
          var node = element.children[0];
          for ( var i = node.children.length - 1; i >= 0; i-- ) {
            node.children[ i ].insertAfter( element );
          }
          return false;
        }

      },
      $: function(element) {
        if (element.children[0] && element.children[0].name == 'br')
          element.children.shift()
        if (element.children[0] && element.children[0].name == 'a' && rules.elements.a(element.children[0]) === false)
          return false;
        //if (element.attributes.hidden || element.attributes['data-hidden'])
        //  return false;
        return element
      },
      span: function(element) {

        if (element.attributes.hidden || element.attributes['data-hidden'])
          return false;
      },
      div: function(element) {

        if (element.attributes.hidden || element.attributes['data-hidden'])
          return false;
      },
      br: function(element) {
        if (element.parent)
          return false;
        //debugger
        // return new CKEDITOR.htmlParser.text('\n');
        //element.replaceWith(new CKEDITOR.htmlParser.text('\n'))

      },
      a: function(element) {
        element.filterChildren(editor.dataProcessor.dataFilter)

        if (!element.children.length) return false;


        // split link if it wraps picture and text together
        for (var i = element.children.length; i--;) {
          var child = element.children[i];
          if (child.name == 'picture') {
            if (element.children.length > 1) {
              element.split(i + 1)
              if (i) 
                var wrapper = element.split(i)
              else
                var wrapper = element;
            } else {
              var wrapper = element;
            }  
            wrapper.addClass('picture')
          }
        }

        return element;
      },
      li: function(element) {
        element.filterChildren(editor.dataProcessor.dataFilter)
        if (!element.children.length) return false;
        var paragraph;
        for (var i = 0, child; child = element.children[i++];) {
          if (child.name) {
            if (!paragraph)
              var paragraph = child;
            else {
              debugger
              //element.name = 'section'
            }
          }
        }
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
        //if (element.attributes.width && parseInt(element.attributes.width ) < 100)
        //  return false;
        //if (element.attributes.height && parseInt(element.attributes.height ) < 100)
        //  return false;
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

  

  CKEDITOR.dtd.picture = {img: 1}
  CKEDITOR.dtd.$object.picture = 1
  CKEDITOR.dtd.$object.img = 1
  CKEDITOR.dtd.$cdata.picture = 1
  /*CKEDITOR.dtd.$block.picture = 1; */
  CKEDITOR.dtd.$block.img = 1; 
  CKEDITOR.dtd.article = Object.create(CKEDITOR.dtd.article)
  CKEDITOR.dtd.article.picture = 1;
  //CKEDITOR.dtd.$intermediate.picture = 1; 

  CKEDITOR.dtd.$avoidNest = {
    p: 1,
    h1: 1,
    h2: 1,
    h3: 1,
    picture: 1,
    li: 1
  }


  CKEDITOR.dtd.$block.p = 1; 
  CKEDITOR.dtd.$block.section = 1; 
  CKEDITOR.dtd.$block.ul = 1; 
  CKEDITOR.dtd.$block.ol = 1;  
  CKEDITOR.dtd.$block.li = 1; 
  CKEDITOR.dtd.$block.blockquote = 1; 

  /*
  CKEDITOR.dtd.p = 
  CKEDITOR.dtd.h1 = 
  CKEDITOR.dtd.h2 = 
  CKEDITOR.dtd.h3 = 
  CKEDITOR.dtd.li = {a: 1, b: 1, strong: 1, span: 1, em: 1, i: 1};
  CKEDITOR.dtd.blockquote = {p: 1, a: 1, b: 1, strong: 1, span: 1, em: 1, i: 1};
  */

  CKEDITOR.dtd.section = {p: 1, a: 1, ul: 1, ol: 1, h1: 1, h2: 1, h3: 1, picture: 1, img: 1, blockquote: 1};


  CKEDITOR.dtd.a = Object.create(CKEDITOR.dtd.a)
  CKEDITOR.dtd.a.picture = 1;





  CKEDITOR.dom.elementPath.prototype.isContextFor = function() {
    return true;
  }
}