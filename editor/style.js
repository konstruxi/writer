Editor.Style = function(editor, section, type, value, wasStarred) {
  var starred = section.classList.contains('starred');
  if (value == null || (type == 'palette' && !starred)) {
    var inherited = Editor.Style.inherit(editor, section, type, true)
  }

  Editor.Style.set(editor, section, type, value, inherited, starred || wasStarred)

}

Editor.Style.write = function(editor, section, styles) {
  var stylesheet = Editor.Style.getStylesheet(editor, section);
  if (stylesheet.current) {
    for (var property in stylesheet.current)
      if (!styles[property])
        styles[property] = stylesheet.current[property]
    
  }
  stylesheet.current = styles;
  var text = ''
  for (var property in styles)
    text += styles[property] + '\n';

  stylesheet.textContent = text;
  stylesheet.current = styles
}

Editor.Style.getStylesheet = function(editor, section) {
  var stylesheet = section.getElementsByTagName('style')[0];
  if (!stylesheet) {
    stylesheet = document.createElement('style')
    var toolbar = section.getElementsByClassName('toolbar')[0];
    toolbar.appendChild(stylesheet);
  }
  return stylesheet
}


Editor.Style.get = function(editor, section, type, value) {
  for (var i = section.classList.length; i--; ) {
    if (section.classList[i].indexOf('style-') == 0 
     && section.classList[i].indexOf(type) == 6) {
      return section.classList[i].substring(6 + type.length + 1)
    }
  }
  return value;
};

Editor.Style.set = function(editor, section, type, value, inherited, propagate) {
  for (var i = section.classList.length; i--; ) {
    if (section.classList[i].indexOf('style-') == 0 
     && section.classList[i].indexOf(type) == 6) {
      section.classList.remove(section.classList[i])
    }
  }
  var result = (inherited || value);
  if (result)
    section.classList.add('style-' + type + '-' + result)
  if (Editor.Style.callbacks[type])
    Editor.Style.callbacks[type](editor, section, result)


  if (value) {
    section.setAttribute(type, value);
  } else if (!inherited) {
    section.removeAttribute(type)
  }
  if (propagate)
    Editor.Style.propagate(editor, section, type, result);

}

Editor.Style.propagate = function(editor, section, type, value) {
  for (var p = section; p = p.previousElementSibling;) {
    if (p.tagName != 'SECTION') continue;
    var l = Editor.Style.inherit(editor, p, type);
    if (l === false)
      break;
    Editor.Style.set(editor, p, type, null, l);
  }
  for (var n = section; n = n.nextElementSibling;) {
    if (n.tagName != 'SECTION') continue;
    var r = Editor.Style.inherit(editor, n, type);
    if (r === false)
      break;
    Editor.Style.set(editor, n, type, null, r);
  }
}

Editor.Style.inherit = function(editor, section, type, ignoreSelf) {
  if (section.getAttribute(type) && (section.classList.contains('starred') || type != 'palette')) 
    return false;
  var left = 0, right = 0;
  var l, r;
  for (var p = section; p = p.previousElementSibling;) {
    if (p.tagName != 'SECTION') continue;
    left++;
    if (!p.classList.contains('starred')) continue;
    if ((l = p.getAttribute(type)))
      break;
  }
  for (var n = section; n = n.nextElementSibling;) {
    if (n.tagName != 'SECTION') continue;
    right++
    if (!n.classList.contains('starred')) continue;
    if ((r = n.getAttribute(type)))
      break;
  }

  if ((l && r && left < right) || (l && !r)) {
    return l;
  } else if (r) {
    return r;
  }
}

Editor.Style.store = function(editor, type, value, reference) {
  if (!editor.styles)
    editor.styles = {}
  if (!editor.styles[type])
    editor.styles[type] = {}
  editor.styles[type][value] = reference
}
Editor.Style.retrieve = function(editor, type, value) {
  return editor.styles && editor.styles[type] && editor.styles[type][value]
} 

Editor.Style.callbacks = {
  schema: function(editor, section, value) {
    var palette = Editor.Style.get(editor, section, 'palette');
    var generator = Editor.Style.retrieve(editor, 'palette', palette)
    if (!generator) return;
    var schema = Editor.Style.get(editor, section, 'schema', 'DM_V')
    if (section.schema != schema || section.palette != palette) {
      section.palette = palette;
      section.schema = schema;
      Editor.Style.write(editor, section, {
        colors: generator(schema).toString('style-palette-' + palette + '.style-schema-' + schema)
      })
    }
  },
  palette: function() {
    return Editor.Style.callbacks.schema.apply(this, arguments)
  }
}
