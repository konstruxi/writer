Editor.Observer = function(editor) {
  var observer = new MutationObserver( function(mutations) {
    var removedImages = [];
    var addedImages = [];
    var removed = []
    var placeholders = [];
    mutations: for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      for (var t = m.target; t && t != editor.element.$; t = t.parentNode) {
        if (t.id == 'cke_pastebin') 
          continue mutations;
        if (t.classList && t.classList.contains('kx-placeholder')) {
          if (placeholders.indexOf(t) == -1)
            placeholders.push(t);
        } 
      }
      if (m.type === 'childList') {
        for (var j = 0; j < m.removedNodes.length; j++) {
          var child = m.removedNodes[j];
          if (child.nodeType == 1 &&
              child.tagName != 'SPAN' &&
              child.tagName != 'DIV' &&
              child.tagName != 'STYLE'  ) {
            var reason = mutations[i];
          }
          if (child.classList && child.classList.contains('kx-placeholder'))
            if (placeholders.indexOf(child) == -1)
              placeholders.push(child);
        }
        for (var j = 0; j < m.addedNodes.length; j++) {
          var child = m.addedNodes[j];
          if (child.nodeType == 1 &&
              child.tagName != 'SPAN' &&
              child.tagName != 'DIV' &&
              child.tagName != 'STYLE') {
            var reason = mutations[i];
          }
          if (child.classList && child.classList.contains('kx-placeholder'))
            if (placeholders.indexOf(child) == -1)
              placeholders.push(child);
        }
      } else {
        if (m.target != editor.element.$
            && ((m.attributeName == 'class'
              && ((m.oldValue 
                && (
                  (m.oldValue.indexOf('forced') > -1) != (m.target.classList.toString().indexOf('forced') > -1) ||
                  (m.oldValue.indexOf('large') > -1) != (m.target.classList.toString().indexOf('large') > -1) ||
                  (m.oldValue.indexOf('small') > -1) != (m.target.classList.toString().indexOf('small') > -1) ||
                  (m.oldValue.indexOf('has-picture') > -1) != (m.target.classList.toString().indexOf('has-picture') > -1)
                )))))) {
          var reason = mutations[i];
        }
      }
    }
    // new content tag added/removed, class changed
    if (reason){
      Editor.Section(editor, reason, observer, placeholders);

    // placeholders text content update
    } 
    if (placeholders) {
      for (var i = 0; i < placeholders.length; i++)
        if (placeholders[i].getAttribute('itempath') != null)
        Editor.Placeholder.onChange(placeholders[i]);
      if (placeholders.length) {
        console.log(placeholders, 'placeholders changed')
      }
    }
  } );
  observer.observe( editor.element.$ , {
    attributes: true,
    childList: true,
    subtree: true,
    characterData: true,
    attributeOldValue: true,
    attributeFilter: ['class']
  });

  editor.observer = observer;
}