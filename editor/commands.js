
Editor.Commands = function(editor) {


  Editor.Commands.Button(editor, 'Make it a main title', 'title', 'structural', { element: 'h1'}, ['h1'])
  Editor.Commands.Button(editor, 'Make it a subtitle', 'subtitle', 'structural', { element: 'h2'}, ['h2'])
  Editor.Commands.Button(editor, 'Make it a heading', 'heading', 'structural', { element: 'h3'}, ['h3'])
  Editor.Commands.Button(editor, 'Make it a paragraph', 'paragraph', 'structural', { element: 'p'}, ['p'])
  Editor.Commands.Button(editor, 'Clear styles', 'clear', 'basicstyles', function() {

    if (editor.commands.italic.state == 1)
      editor.ui.instances.Italic.click(editor)
    if (editor.commands.bold.state == 1)
      editor.ui.instances.Bold.click(editor)
  })
  Editor.Commands.Button(editor, 'Set image filters', 'filters', 'basicstyles', function() {
    alert('set up filters')
  })
  Editor.Commands.Button(editor, 'Link the text', 'link', 'links', function(e) {
    Editor.Commands.Link(editor, null)
  })
  Editor.Commands.Button(editor, 'Upload a file', 'upload', 'objects', function(e) {
    // while file dialog is open, avoid registering selection change event
    editor.doNotBlur = true;
    setTimeout(function() {
      editor.doNotBlur = false;
    }, 2000)
  })
  Editor.Commands.Button(editor, 'Add an object', 'object', 'objects', function(e) {
    Editor.Chrome.openMenu(editor, document.querySelector('#formatting .objects'))
    //Editor.Commands.Link(editor, null)
  })
  Editor.Commands.Button(editor, 'Add meta data', 'meta', 'metas', function(e) {
    //Editor.Commands.Link(editor, null)
  })

  editor.on('instanceReady', function() {
    editor.commands.paragraph.on('exec', function() {
      editor.snapshot.selected = Editor.Snapshot.rememberSelected(editor)
      //editor.stylesnapshot = snapshotStyles(editor);
    })
    editor.commands.heading.on('exec', function() {
      //editor.stylesnapshot = snapshotStyles(editor);
      Editor.Content.cleanSelection(editor, {lists: true, quotes: true})
      editor.snapshot.selected = Editor.Snapshot.rememberSelected(editor)
    })
    editor.commands.subtitle.on('exec', function() {
      //editor.stylesnapshot = snapshotStyles(editor);
      Editor.Content.cleanSelection(editor, {lists: true, quotes: true})
      editor.snapshot.selected = Editor.Snapshot.rememberSelected(editor)
    })
    editor.commands.title.on('exec', function() {
      //editor.stylesnapshot = snapshotStyles(editor);
      Editor.Content.cleanSelection(editor, {lists: true, quotes: true})
      editor.snapshot.selected = Editor.Snapshot.rememberSelected(editor)
    })
    editor.commands.bulletedlist.on('exec', function() {
      //editor.stylesnapshot = snapshotStyles(editor);
      Editor.Content.cleanSelection(editor, {titles: true, quotes: true})
      editor.snapshot.selected = Editor.Snapshot.rememberSelected(editor)
    }, null, null, 1)
    editor.commands.numberedlist.on('exec', function() {
      //editor.stylesnapshot = snapshotStyles(editor);
      Editor.Content.cleanSelection(editor, {titles: true, quotes: true})
      editor.snapshot.selected = Editor.Snapshot.rememberSelected(editor)
    })
    editor.commands.blockquote.on('exec', function() {
      //editor.stylesnapshot = snapshotStyles(editor);
      Editor.Content.cleanSelection(editor, {titles: true, lists: true})
      editor.snapshot.selected = Editor.Snapshot.rememberSelected(editor)
    })
    editor.commands.outdent.on('exec', function() {
      //editor.stylesnapshot = snapshotStyles(editor);
      editor.snapshot.selected = Editor.Snapshot.rememberSelected(editor)
    }, null, null, 1)
    editor.commands.bold.on('exec', function() {
      if (editor.commands.italic.state == 1)
        editor.ui.instances.Italic.click(editor)
    })
    editor.commands.italic.on('exec', function() {
      if (editor.commands.bold.state == 1)
        editor.ui.instances.Bold.click(editor)
    })
  })


}

Editor.Commands.Button = function (editor, title, commandName, toolbar, styles, forms) {
  editor.ui.addButton(commandName, { // add new button and bind our command
      label: 'Add ' + commandName,
      title: title,
      command: commandName,
      toolbar: toolbar,
      click: typeof styles == 'function' && styles || undefined
  });

  if (forms) {
    style = new CKEDITOR.style(styles)
    editor.attachStyleStateChange( style, function( state ) {
          !editor.readOnly && editor.getCommand( commandName ).setState( state );
        } );

    return editor.addCommand( commandName, new CKEDITOR.styleCommand( style, {
          contentForms: forms
        } ) )
  }

}

Editor.Commands.Link = function (editor, url) {
  editor.fire('saveSnapshot')
  var selection = editor.getSelection();
  var selector = selection.getStartElement()
  var element;

  if(selector) {
     element = selector.getAscendant( 'a', true );
  }

  var text = selection.getSelectedText();
  var start = selection.getStartElement()
  if (!text) {
    if (start.$.tagName == 'IMG') {
      var img = start.$;
    } else if (Editor.Content.isPicture(start.$)) {
      var img = start.$.getElementsByTagName('img')[0]
    }
    if (!img) {
      var iterator = selection.getRanges()[0].createIterator()
      var paragraph = iterator.getNextParagraph();
      if (paragraph)
        var img = paragraph.$.getElementsByTagName('img')[0] 
    }
  }


  if ( !element || element.getName() != 'a') {
    if (!url)
      url = prompt('Enter url:')
    element = editor.document.createElement( 'a' );
    var youtube;
    if (url.match(/\.jpg|\.gif|\.png/) || 
       (!text && ((youtube = Editor.Content.parseYoutubeURL(url))))) {
      if (youtube)
        var src = "http://img.youtube.com/vi/" + youtube + "/maxresdefault.jpg"
      else
        var src = url;
      if (!img)  {
        var img = document.createElement('img')
        //debugger
        //img.setAttribute('src', '//:0') // avoid request
      }
      else
        img.removeAttribute('uid')

      if (src.indexOf('//') > -1 && src.indexOf(document.location.origin) == -1) {
        Editor.Image.proxy(editor, src, img)
      } else {
        img.src = src
      }
      element.$.appendChild(img)
      Editor.Image(editor, img, Editor.Image.applyChanges, Editor.Image.insert);
      var deferred = true;
    } else if (!text) {
      text = url.split('://')[1];
    }
    if (text && !img)
      element.$.textContent = text
    else 
      element.$.appendChild(img.parentNode)
    element.setAttribute("target","_blank")
    if (!deferred)
      editor.insertElement(element)
  } else {
    if (url == null)
      url = prompt('Enter url:', element.$.href)
  }

  if (url) {
    if (url.indexOf('//') == -1)
      url = 'http://' + url;
    element.setAttribute('href', url)
  } else {
    while (element.$.firstChild)
      element.$.parentNode.insertBefore(element.$.firstChild, element.$)
    element.$.parentNode.removeChild(element.$)
  }
  //if (img) {
  //  var section = Editor.Section.get(img);
  //  if (section) Editor.Section.analyze(section)
  //}
  editor.fire('saveSnapshot')

}