Editor.Chrome = function(editor, content) {

  content.addEventListener('mouseup', function(e) {
    if (!editor.dragging) {
      requestAnimationFrame(function() {
        //editor.selectionChange( 1 );
        Editor.Chrome.update(editor)
      })
    }
  })

  editor.on('uiSpace', function() {
    arguments[0].data.html = arguments[0].data.html.replace('>Insert/Remove Bulleted List<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M8 21c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM8 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 24c-1.67 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.33-3-3-3zm6 5h28v-4H14v4zm0-12h28v-4H14v4zm0-16v4h28v-4H14z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Insert/Remove Numbered List<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M4 34h4v1H6v2h2v1H4v2h6v-8H4v2zm2-18h2V8H4v2h2v6zm-2 6h3.6L4 26.2V28h6v-2H6.4l3.6-4.2V20H4v2zm10-12v4h28v-4H14zm0 28h28v-4H14v4zm0-12h28v-4H14v4z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Decrease Indent<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M22 34h20v-4H22v4zM6 24l8 8V16l-8 8zm0 18h36v-4H6v4zM6 6v4h36V6H6zm16 12h20v-4H22v4zm0 8h20v-4H22v4z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add heading<',  '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M5 8v6h10v24h6V14h10V8H5zm38 10H25v6h6v14h6V24h6v-6z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add title<',    '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M5 8v6h10v24h6V14h10V8H5zm38 10H25v6h6v14h6V24h6v-6z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add subtitle<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M5 8v6h10v24h6V14h10V8H5zm38 10H25v6h6v14h6V24h6v-6z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Bold<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M31.2 21.58c1.93-1.35 3.3-3.53 3.3-5.58 0-4.51-3.49-8-8-8H14v28h14.08c4.19 0 7.42-3.4 7.42-7.58 0-3.04-1.73-5.63-4.3-6.84zM20 13h6c1.66 0 3 1.34 3 3s-1.34 3-3 3h-6v-6zm7 18h-7v-6h7c1.66 0 3 1.34 3 3s-1.34 3-3 3z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Italic<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M20 8v6h4.43l-6.86 16H12v6h16v-6h-4.43l6.86-16H36V8z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add clear<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M6.54 10L4 12.55l13.94 13.94L13 38h6l3.14-7.32L33.46 42 36 39.45 7.09 10.55 6.54 10zM12 10v.36L17.64 16h4.79l-1.44 3.35 4.2 4.2L28.43 16H40v-6H12z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add paragraph<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M6.54 10L4 12.55l13.94 13.94L13 38h6l3.14-7.32L33.46 42 36 39.45 7.09 10.55 6.54 10zM12 10v.36L17.64 16h4.79l-1.44 3.35 4.2 4.2L28.43 16H40v-6H12z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Block Quote<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M12 34h6l4-8V14H10v12h6zm16 0h6l4-8V14H26v12h6z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add link<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M7.8 24c0-3.42 2.78-6.2 6.2-6.2h8V14h-8C8.48 14 4 18.48 4 24s4.48 10 10 10h8v-3.8h-8c-3.42 0-6.2-2.78-6.2-6.2zm8.2 2h16v-4H16v4zm18-12h-8v3.8h8c3.42 0 6.2 2.78 6.2 6.2s-2.78 6.2-6.2 6.2h-8V34h8c5.52 0 10-4.48 10-10s-4.48-10-10-10z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add filters<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="-2 -1 28 28"><path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-1l1.25-2.75L16 13l-2.75-1.25L12 9l-1.25 2.75L8 13l2.75 1.25z"/></svg>' + '<')
  }, null, null, 20);

}

Editor.Chrome.update = function(editor, force) {
  var selection = editor.getSelection();
  if (!selection) return;

  if (editor.hidingButtons) return;
  editor.hidingButtons = (force ? rightNow : setTimeout)(function() {
    editor.hidingButtons = null;
  var range = selection.getRanges()[0];
  if (!range || !range.startContainer) return;
  var container = range.startContainer;
  if (!container.is)
    container = container.getParent()
  var start = Editor.Content.getEditableAscender(range.startContainer.$);

  var startSection = start;
  while (startSection && startSection.tagName != 'SECTION')
    startSection = startSection.parentNode;

  var end = Editor.Content.getEditableAscender(range.endContainer.$);

  var endSection = end;
  while (endSection && endSection.tagName != 'SECTION')
    endSection = endSection.parentNode;

  if (!startSection) return;
  var sectionStyle = window.getComputedStyle(startSection);
  var sectionAfterStyle = window.getComputedStyle(startSection, ':after');

  // use final keyframe positions when animating
  if (editor.snapshot) {
    var index = editor.snapshot.elements.indexOf(start);
    var indexS = editor.snapshot.elements.indexOf(startSection);
    if (index > -1 && indexS > -1) {
      var offsetHeight = editor.snapshot.dimensions[index].height;
      var sectionOffsetTop = editor.snapshot.dimensions[indexS].top;
      var offsetTop = editor.snapshot.dimensions[index].top + editor.offsetTop;
      var offsetLeft = editor.snapshot.dimensions[indexS].left + editor.offsetLeft;
    } else {
      return;
    }
  // place at currently selected element mid-point
  } else {
    var offsetHeight = start.offsetHeight
    var offsetTop = 0;
    var offsetLeft = 0;
    var sectionOffsetTop = 0;
    for (var el = start; el; el = el.offsetParent)
      offsetTop += el.offsetTop;
    for (var el = startSection; el; el = el.offsetParent) {
      sectionOffsetTop += el.offsetTop;
      offsetLeft += el.offsetLeft;
    }
  }

  var ui = editor.ui.instances
  if (range.startOffset != range.endOffset && start == end) {
    if (container.is('picture')) {
      var button = 'filters'
    } else {
      if (ui.Bold._.state == 2 && ui.Italic._.state == 2 && 
        ui.title._.state == 2 && ui.subtitle._.state == 2 && ui.heading._.state == 2) {
        var button = 'Bold'
      } else if (ui.Italic._.state == 2) {
        var button = 'Italic'
      } else {
        var button = 'clear';
      }
    }

  } else {
    var section = start;
    while (section && section.tagName != 'SECTION')
      section = section.parentNode;
    if (!section) return;

    if (start.textContent.length < 120 && start == end) {
      if (ui.title._.state == 2 && ui.subtitle._.state == 2 && ui.heading._.state == 2) {
        var button = 'title'
      } else if (ui.subtitle._.state == 2 && ui.heading._.state == 2) {
        var button = 'subtitle'
      } else if (ui.heading._.state == 2) {
        var button = 'heading'
      } else {
        var button = 'paragraph'
      }
    } else {
      if (startSection == endSection && ui.Blockquote._.state == 2 && ui.BulletedList._.state == 2 && ui.NumberedList._.state == 2) {
        var button = 'Blockquote'  
      } else if (ui.BulletedList._.state == 2 && ui.NumberedList._.state == 2) {
        var button = 'BulletedList'
      } else if (ui.NumberedList._.state == 2) {
        var button = 'NumberedList'
      } else {
        var button = 'Outdent'
      }
    }
  }


  (force ? rightNow : requestAnimationFrame)(function() {

  var top = Math.max( offsetTop,
                          Math.min( editor.scrollY + editor.innerHeight - 54,
                            Math.min( offsetTop + offsetHeight,
                              Math.max(editor.scrollY + 54, offsetTop + offsetHeight / 2)))) + 'px';

  var left = offsetLeft + 'px';
  
  formatting.style.display = 'block';

  formatting.style.position  = 'absolute' 
  formatting.style.left = left;
  formatting.style.top = top;

  if (force && button == editor.currentButton) return;
  editor.currentButton = button;
  
  setUIColors(sectionStyle, sectionAfterStyle);
  
  var buttons = formatting.querySelectorAll('.cke .cke_button');
  var target = 'cke_button__' + button.toLowerCase()
  for (var i = 0, el; el = buttons[i++];) {
    if (el.classList.contains(target)) {
      el.removeAttribute('hidden')
    } else if (!el.classList.contains('cke_button__link')) {
      el.setAttribute('hidden', 'hidden')
    } else {
      if (range.startContainer.getAscendant( 'a', true )) {
        el.classList.add('actual')
      } else {
        el.classList.remove('actual')
      }
    }
  }
  //for (editor.ui.instances.title._)


  });
}, 75)
}

Editor.Chrome.togglePicker = function(editor, force) {
  if (!editor.activeSection) return;
  clearTimeout(window.unpicking);
  if (editor.activeSection.classList.contains('focused') && editor && editor.focusManager.hasFocus) {
    formatting.removeAttribute('hidden')
  } else if (formatting.getAttribute('hidden') == null){
    window.unpicking = setTimeout(function() {
      formatting.setAttribute('hidden', 'hidden')
    }, 100)
  }
}

function rightNow(callback) {
  callback()
}


function setUIColors(sectionStyle, sectionAfterStyle) {
  //if (!formattingStyle.sheet.cssRules.length) {
  //  formattingStyle.sheet.insertRule('#formatting {}', 0);
  //  formattingStyle.sheet.insertRule('#formatting .cke_button {}', 1);
  //  formattingStyle.sheet.insertRule('#formatting:before {}', 2);
  //}
  /*
  formattingStyle.sheet.cssRules[0].style.color = sectionAfterStyle['color'];
  formattingStyle.sheet.cssRules[0].style.backgroundColor = sectionStyle['background-color'];
  formattingStyle.sheet.cssRules[1].style.backgroundColor = sectionStyle['background-color'];
  formattingStyle.sheet.cssRules[2].style.backgroundColor = sectionAfterStyle['outline-color'];
*/
  var text = "#formatting { color: " + sectionAfterStyle['color'] + "; background-color: " + sectionStyle['background-color'] + " }" + 
  "#formatting .cke_button { background-color: " + sectionStyle['background-color'] + "  }" +
  "#formatting .picker:after { background-color: " + sectionAfterStyle['border-color'] + "  }" + 
  "#formatting .picker:before { background-color: " + sectionAfterStyle['background-color'] + "  }" + 
  "#formatting:before { background-color: " + sectionAfterStyle['outline-color'] + "  }"; 

  if (formattingStyle.textContent != text)
    formattingStyle.textContent = text;
}
