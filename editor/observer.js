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
              m.removedNodes[j].tagName != 'STYLE'  ) {
            var reason = mutations[i];
          }
        }
        for (var j = 0; j < m.addedNodes.length; j++) {
          if (m.addedNodes[j].nodeType == 1 &&
              m.addedNodes[j].tagName != 'SPAN' &&
              m.addedNodes[j].tagName != 'DIV' &&
              m.addedNodes[j].tagName != 'STYLE') {
            var reason = mutations[i];
          }
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