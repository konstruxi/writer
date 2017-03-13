Editor.Style = function(editor, section, type, value, wasStarred) {
  var starred = section.classList.contains('starred');
  if (value == null || (type == 'palette' && !starred)) {
    var inherited = Editor.Style.inherit(editor, section, type, true)
  }

  Editor.Style.set(editor, section, type, value, inherited, starred || wasStarred)

}

Editor.Style.write = function(editor, section, selector, cssStyles) {
  var stylesheet = Editor.Style.getStylesheet(editor, section);
  var text = ''

  if (!stylesheet.current) 
    stylesheet.current = {};

  // already written
  if (stylesheet.current[selector])
    return;
    
  stylesheet.current[selector] = cssStyles();


  for (var otherSelector in stylesheet.current)
    if (document.querySelector(otherSelector)) {
      text += stylesheet.current[otherSelector] + '\n'
    } else {
      delete stylesheet.current[otherSelector];
    }

  stylesheet.textContent = text;
  console.log(text)
}

Editor.Style.getStylesheet = function(editor, section) {
  if (window.Manager)
    return Manager.stylesheet
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
  //section.classList.add('style-' + type + '-' + value)
  return value;
};

Editor.Style.set = function(editor, section, type, value, inherited, propagate) {
  for (var i = section.classList.length; i--; ) {
    if (section.classList[i].indexOf('style-') == 0 
     && section.classList[i].indexOf(type) == 6) {
      if (section.classList[i] != 'style-' + type + '-' + result)
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
  var sections = document.querySelectorAll('section');
  var index = Array.prototype.indexOf.call(sections, section);
  if (index == -1)
    return;
  for (var i = index; i--;) {
    var p = sections[i];
    var l = Editor.Style.inherit(editor, p, type);
    if (l === false)
      break;
    Editor.Style.set(editor, p, type, null, l);
  }
  for (var i = index; ++i < sections.length;) {
    var n = sections[i];
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
  var sections = document.querySelectorAll('section');
  var index = Array.prototype.indexOf.call(sections, section);
  if (index == -1)
    return;
  for (var i = index; i--;) {
    var p = sections[i];
    left++;
    if (!p.classList.contains('starred')) continue;
    if ((l = p.getAttribute(type)))
      break;
  }
  for (var i = index; ++i < sections.length;) {
    var n = sections[i];
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

Editor.Style.storage = {}
Editor.Style.store = function(editor, type, value, reference) {
  if (!Editor.Style.storage[type])
    Editor.Style.storage[type] = {}
  return  Editor.Style.storage[type][value] = reference
}
Editor.Style.retrieve = function(editor, type, value) {
  return Editor.Style.storage[type] && Editor.Style.storage[type][value]
} 

Editor.Style.callbacks = {
  schema: function(editor, section, value) {
    var palette = Editor.Style.get(editor, section, 'palette');
    var generator = Editor.Style.retrieve(editor, 'palette', palette)
    if (!generator) {
      var imgs = section.getElementsByTagName('img');
      for (var i = 0; i < imgs.length; i++) {
        if (imgs[i].getAttribute('palette') && imgs[i].getAttribute('uid') == palette) {
          var generator = Editor.Style.store(editor, 'palette', palette, Palette(imgs[i]))
        }
      }
      if (!generator) return;
    }
    var schema = Editor.Style.get(editor, section, 'schema', 'DM_V')
    if (section.schema != schema || section.palette != palette) {
      section.palette = palette;
      section.schema = schema;
      Editor.Style.write(editor, section, 
        '.style-palette-' + palette + '.style-schema-' + schema,
        function() {
          return generator(schema).toString('style-palette-' + palette + '.style-schema-' + schema)
        }
      )
    }
  },
  palette: function() {
    return Editor.Style.callbacks.schema.apply(this, arguments)
  }
}

Editor.Style.recompute = function(root) {
  var sections = root.querySelectorAll('section');

  for (var i = 0; i < sections.length; i++) {
    if (sections[i].classList.contains('starred')) {
      if (!schema)
        var schema = sections[i].getAttribute('schema');
      var starred = sections[i];
      Editor.Style(null, sections[i], 'palette', sections[i].getAttribute('palette'));
      Editor.Style(null, sections[i], 'schema', sections[i].getAttribute('schema'));
    }
  }
  if (!schema && starred)
    Editor.Style(null, starred, 'schema', 'DV_V');

  var containers = root.querySelectorAll('#layout-root, article');
  for (var i = 0; i < containers.length; i++) {
    // articles and their list headers use first section's color scheme
    var p = containers[i];
    var first = p.getElementsByTagName('section')[0];
    if (first) {
      if (Editor.Style.get(null, first, 'palette'))
        Editor.Style.set(null, containers[i], 'palette', null, Editor.Style.get(null, first, 'palette'));
      if (Editor.Style.get(null, first, 'schema'))
        Editor.Style.set(null, containers[i], 'schema', null, Editor.Style.get(null, first, 'schema'));
      continue;
    }
  }
}
