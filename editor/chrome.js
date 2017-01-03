Editor.Chrome = function(editor, content) {

  content.addEventListener('mouseup', function(e) {
    if (!editor.dragging) {
      requestAnimationFrame(function() {
        //editor.selectionChange( 1 );
        Editor.Chrome.update(editor)
      })
    }
  })

  editor.on('instanceReady', function() {
    var upload = document.querySelector('#cke_upload');
    upload.addEventListener('change', function(e) {
      for (var i = 0; i < upload.files.length; i++) {
        if (upload.files[i].type.indexOf('image') > -1)
          Editor.Image(editor, upload.files[i], Editor.Image.applyChanges, Editor.Image.insert, true);
      }
    })
  })

  editor.on('customSelectionChange', function() {
    if (editor.currentMenu)
      Editor.Chrome.closeMenu(editor)
    if (editor.currentToolbar)
      Editor.Chrome.Toolbar.close(editor)
  })

  editor.on('uiSpace', function() {
    arguments[0].data.html = arguments[0].data.html.replace('>Insert/Remove Bulleted List<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M8 21c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM8 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 24c-1.67 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.33-3-3-3zm6 5h28v-4H14v4zm0-12h28v-4H14v4zm0-16v4h28v-4H14z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Insert/Remove Numbered List<', '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M4 34h4v1H6v2h2v1H4v2h6v-8H4v2zm2-18h2V8H4v2h2v6zm-2 6h3.6L4 26.2V28h6v-2H6.4l3.6-4.2V20H4v2zm10-12v4h28v-4H14zm0 28h28v-4H14v4zm0-12h28v-4H14v4z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Decrease Indent<',             '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M22 34h20v-4H22v4zM6 24l8 8V16l-8 8zm0 18h36v-4H6v4zM6 6v4h36V6H6zm16 12h20v-4H22v4zm0 8h20v-4H22v4z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add heading<',                 '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M5 8v6h10v24h6V14h10V8H5zm38 10H25v6h6v14h6V24h6v-6z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add title<',                   '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M5 8v6h10v24h6V14h10V8H5zm38 10H25v6h6v14h6V24h6v-6z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add subtitle<',                '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M5 8v6h10v24h6V14h10V8H5zm38 10H25v6h6v14h6V24h6v-6z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Bold<',                        '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M31.2 21.58c1.93-1.35 3.3-3.53 3.3-5.58 0-4.51-3.49-8-8-8H14v28h14.08c4.19 0 7.42-3.4 7.42-7.58 0-3.04-1.73-5.63-4.3-6.84zM20 13h6c1.66 0 3 1.34 3 3s-1.34 3-3 3h-6v-6zm7 18h-7v-6h7c1.66 0 3 1.34 3 3s-1.34 3-3 3z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Italic<',                      '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M20 8v6h4.43l-6.86 16H12v6h16v-6h-4.43l6.86-16H36V8z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add clear<',                   '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M6.54 10L4 12.55l13.94 13.94L13 38h6l3.14-7.32L33.46 42 36 39.45 7.09 10.55 6.54 10zM12 10v.36L17.64 16h4.79l-1.44 3.35 4.2 4.2L28.43 16H40v-6H12z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add paragraph<',               '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M6.54 10L4 12.55l13.94 13.94L13 38h6l3.14-7.32L33.46 42 36 39.45 7.09 10.55 6.54 10zM12 10v.36L17.64 16h4.79l-1.44 3.35 4.2 4.2L28.43 16H40v-6H12z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Block Quote<',                 '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M12 34h6l4-8V14H10v12h6zm16 0h6l4-8V14H26v12h6z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add link<',                    '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M7.8 24c0-3.42 2.78-6.2 6.2-6.2h8V14h-8C8.48 14 4 18.48 4 24s4.48 10 10 10h8v-3.8h-8c-3.42 0-6.2-2.78-6.2-6.2zm8.2 2h16v-4H16v4zm18-12h-8v3.8h8c3.42 0 6.2 2.78 6.2 6.2s-2.78 6.2-6.2 6.2h-8V34h8c5.52 0 10-4.48 10-10s-4.48-10-10-10z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add filters<',                 '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="-2 -1 28 28"><path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-1l1.25-2.75L16 13l-2.75-1.25L12 9l-1.25 2.75L8 13l2.75 1.25z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add upload<',                  '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M33 12v23c0 4.42-3.58 8-8 8s-8-3.58-8-8V10c0-2.76 2.24-5 5-5s5 2.24 5 5v21c0 1.1-.89 2-2 2-1.11 0-2-.9-2-2V12h-3v19c0 2.76 2.24 5 5 5s5-2.24 5-5V10c0-4.42-3.58-8-8-8s-8 3.58-8 8v25c0 6.08 4.93 11 11 11s11-4.92 11-11V12h-3z"  transform="translate(25.000000, 24.000000) rotate(-270.000000) translate(-25.000000, -24.000000) "/></svg><input type="file" id="cke_upload" multiple>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add object<',                  '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="-1 0 48 48"><path d="M38 26H26v12h-4V26H10v-4h12V10h4v12h12v4z"/></svg>' + '<')
    arguments[0].data.html = arguments[0].data.html.replace('>Add meta<',                    '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="-1 0 48 48"><path d="M12 20c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm24 0c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm-12 0c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>' + '<')
//arguments[0].data.html = arguments[0].data.html.replace('>Add meta<',                    '>' + '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 -2 54 54"><path d="M44 6H14c-1.38 0-2.47.7-3.19 1.76L0 23.99l10.81 16.23c.72 1.06 1.94 1.78 3.32 1.78H44c2.21 0 4-1.79 4-4V10c0-2.21-1.79-4-4-4zM18 27c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm10 0c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm10 0c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg>' + '<')
    
    arguments[0].data.html = arguments[0].data.html.replace(/<a([^>]+cke_button__upload[^>]+>.*?)<\/a>/, function(m, content) {
      return '<label' + content.replace(/return false/g, '') + '</label>'
    });
    var toolbars = ['metas', 'formatting', 'objects']
    arguments[0].data.html = arguments[0].data.html.replace(/class="cke_toolbar\b/g, function(kls, i) {
      return kls + ' ' + toolbars.shift()
    })
  }, null, null, 20);

}

Editor.Chrome.Toolbar = function(editor, section) {
  if (!section.getElementsByClassName('foreground')[0]) {
    var bg = document.createElement('x-div');
    bg.classList.add('kx')
    bg.classList.add('foreground')
    //bg.setAttribute('contenteditable', 'false')
    bg.setAttribute('unselectable', 'on')

    // need svg to be unselectable
    var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    bg.appendChild(icon)

    section.insertBefore(bg, section.firstChild)
  }
  if (!section.getElementsByClassName('toolbar')[0]) {
    var toolbar = document.createElement('x-div');
    toolbar.setAttribute('unselectable', 'on')
    toolbar.classList.add('kx')
    toolbar.classList.add('toolbar')
    var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('width', '48')
    icon.setAttribute('height', '48')
    icon.classList.add('menu')
    icon.setAttribute('unselectable', 'on')
    icon.setAttribute('readonly', 'true')
    //icon.setAttribute('contenteditable', 'false')
    icon.setAttribute('viewBox', "0 0 48 48")
    //toolbar.setAttribute('contenteditable', 'false')

    var link = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    link.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#resize-section-icon');
    icon.appendChild(link)
    toolbar.appendChild(icon)
    section.insertBefore(toolbar, section.firstChild)
  }
}

Editor.Chrome.Toolbar.open = function(editor, section, button) {
  var indexF = editor.snapshot.elements.indexOf(section.getElementsByClassName('toolbar')[0]);
  if (indexF > -1) {
    var box = editor.snapshot.dimensions[indexF]
    var offsetTop = box.top + editor.offsetTop;
    var offsetLeft = box.left + editor.offsetLeft;
  } else {
    return;
  }
  editor.currentToolbar = section;
  setUIColors(editor, section, 'menu');
  sectionizer.style.top = offsetTop + 'px'
  sectionizer.style.left = offsetLeft + 'px';
  sectionizer.className = section.className
  sectionizer.removeAttribute('hidden')
}

Editor.Chrome.Toolbar.close = function(editor) {
  sectionizer.setAttribute('hidden', 'hidden')
}

Editor.Chrome.closeMenu = function(editor, element) {
  if (editor.currentMenu)
    editor.currentMenu.classList.remove('open');
}
Editor.Chrome.openMenu = function(editor, element) {
  if (editor.currentMenu)
    editor.currentMenu.classList.remove('open');
  editor.currentMenu = element;
  editor.currentMenu.classList.add('open');
  clearTimeout(editor.openingMenu);
  editor.openingMenu = setTimeout(function() {
    editor.openingMenu = false;
  })
}

Editor.Chrome.deferUpdate = function(editor) {
  clearTimeout(editor.updatehcome)
  editor.updatechrome = setTimeout(function() {
    editor.updatechrome = null
    Editor.Chrome.update(editor)
  }, 50)
}

Editor.Chrome.update = function(editor, force) {
  var selection = editor.getSelection();
  if (!selection) return;

  var range = selection.getRanges()[0];
  if (!range || !range.startContainer) return;
  var container = range.startContainer;
  if (!container.is)
    container = container.getParent()
  var start = Editor.Content.getEditableAscender(range.startContainer.$);

  if (start.tagName == 'SECTION') {
    var startSection = start;
    var start = range.getEnclosedNode()
    if (start) start = start.$;
  } else {
    var startSection = start;
    while (startSection && startSection.tagName != 'SECTION')
      startSection = startSection.parentNode;
  }

  var end = Editor.Content.getEditableAscender(range.endContainer.$);

  var endSection = end;
  while (endSection && endSection.tagName != 'SECTION')
    endSection = endSection.parentNode;

  if (!startSection) return;

  var foreground = startSection.getElementsByClassName('foreground')[0]
  var index = editor.snapshot.elements.indexOf(start);
  var indexS = editor.snapshot.elements.indexOf(startSection);
  var indexF = editor.snapshot.elements.indexOf(foreground);

  if (index > -1 && indexS > -1 && indexF > -1) {
    var offsetHeight = editor.snapshot.dimensions[index].height;
    var offsetWidth = editor.snapshot.dimensions[indexS].width;
    var offsetTop = editor.snapshot.dimensions[index].top + editor.offsetTop;
    var offsetLeft = editor.snapshot.dimensions[indexF].left + editor.offsetLeft;
  } else {
    return;
  }


  var ui = editor.ui.instances
  if (range.startOffset != range.endOffset && start == end || Editor.Content.isPicture(start)) {
    if (Editor.Content.isPicture(container.$) || Editor.Content.isPicture(start)) {
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

  var width = startSection.classList.contains('small') ? 400 : 800;
  var diff = (offsetWidth - Math.min(editor.innerWidth, width));
  var left = offsetLeft

  formatting.style.display = 'block';
  formatting.style.position  = 'absolute' 
  formatting.style.left = left + 'px'
  formatting.style.top = top;

  //if (force && button == editor.currentButton) return;
  editor.currentButton = button;
  
  setUIColors(editor, startSection, 'toolbar');
  
  // update formatting buttons
  var buttons = formatting.querySelectorAll('.cke_toolbar:nth-child(2) .cke_button');
  var target = 'cke_button__' + button.toLowerCase()
  for (var i = 0, el; el = buttons[i++];) {
    if (el.classList.contains(target)) {
      el.removeAttribute('hidden')
    } else {
      el.setAttribute('hidden', 'hidden')
    }
  }


  // update objects buttons
  var buttons = formatting.querySelectorAll('.cke_toolbar:nth-child(3) .cke_button');
  for (var i = 0, el; el = buttons[i++];) {
    if (el.classList.contains('cke_button__link')) {
      if (range.startContainer.getAscendant( 'a', true ) || range.startOffset != range.endOffset) {
        el.removeAttribute('hidden')
      } else {
        el.setAttribute('hidden', 'hidden')
      }
    }
  }


  });
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


function setUIColors(editor, section, type) {
  var oldPalette, currentPalette;
  var oldSchema, currentSchema;
  for (var i = 0; i < document.body.classList.length; i++) {

    if (document.body.classList[i].indexOf(type + '-style-palette') > -1)
      oldPalette = document.body.classList[i]
    if (document.body.classList[i].indexOf(type + '-style-schema') > -1)
      oldSchema = document.body.classList[i]
  }
  for (var i = 0; i < section.classList.length; i++) {
    if (section.classList[i].indexOf('style-palette') > -1)
      currentPalette = type + '-' + section.classList[i];
    if (section.classList[i].indexOf('style-schema') > -1)
      currentSchema = type + '-' + section.classList[i];
  }
  if (currentPalette != oldPalette) {
    if (oldPalette)
      document.body.classList.remove(oldPalette)
    if (currentPalette)
      document.body.classList.add(currentPalette)
  }
  if (currentSchema != oldSchema) {
    if (oldSchema)
      document.body.classList.remove(oldSchema)
    if (currentSchema)
      document.body.classList.add(currentSchema)
  }

}
