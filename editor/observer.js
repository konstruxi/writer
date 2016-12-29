Editor.Observer = function(editor) {
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
              (!m.removedNodes[j].classList || !m.removedNodes[j].classList.contains('kx')) &&
              (!m.target.classList || !m.target.classList.contains('kx'))) {
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
              (!m.addedNodes[j].classList || !m.addedNodes[j].classList.contains('kx')) &&
              (!m.target.classList || !m.target.classList.contains('kx'))) {
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
                && (m.oldValue.indexOf('forced') > -1) != (m.target.classList.toString().indexOf('forced') > -1)))))) {
          var reason = mutations[i];
        }
      }
    }
    if (removed.length) {
      console.error(removed)
      for (var i = 0; i < removed.length; i++)
        if (editor.snapshot) {
          editor.snapshot.removeElement(removed[i])
          var nested = removed[i].getElementsByTagName('*');
          for (var j = 0; j < nested.length; j++)
            editor.snapshot.removeElement(nested[j])
        }
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