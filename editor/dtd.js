

Editor.DTD = function(editor) {
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

  CKEDITOR.dtd.li = Object.create(CKEDITOR.dtd.li)
  CKEDITOR.dtd.li.picture = 1;
  CKEDITOR.dtd.li = {a: 1};





  CKEDITOR.dom.elementPath.prototype.isContextFor = function() {
    return true;
  }
}