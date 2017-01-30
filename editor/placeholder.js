Editor.Placeholder = function(editor, changedPlaceholders) {
  var content = editor.element.$;
  var form = Editor.Placeholder.getForm(content)
  if (editor && form && editor.$form != form) {
    editor.$form = form;
    editor.on('blur', function() {
      //Editor.Placeholder.write(editor, content, form);
    })
    form.addEventListener('submit', function() {
      Editor.Placeholder.write(editor, content, form);
    }, true)
  }



  if (form) {

    var oldPlaceholders = Array.prototype.slice.call(content.getElementsByClassName('kx-placeholder'));
    var newPlaceholders = [];


    var section = content.getElementsByTagName('section')[0] || content;
    var anchor = section.firstElementChild;

    while (anchor && anchor.classList.contains('kx'))
      anchor = anchor.nextElementSibling;
    if (anchor)
      anchor = anchor.previousElementSibling




    // match new placeholders
    var fields = Editor.Placeholder.getFields(form)
    fields.forEach(function(field) {
      if (!field.classList.contains('delegated')) {
        field.classList.add('delegated');
//        editor.focusManager.add(new CKEDITOR.dom.element(field))
      }
      var placeholder = Editor.Placeholder.create(editor, content, form, field, oldPlaceholders, newPlaceholders, changedPlaceholders)
      if (placeholder)
        newPlaceholders.push(placeholder)
    })  

    // generate fields for metadata
    var ul;
    var meta = newPlaceholders.filter(function(placeholder) {
      if (placeholder.tagName == 'LI') {
        if (placeholder.parentNode && placeholder.parentNode.tagName == 'UL')
          ul = placeholder.parentNode;
        return true;
      }
    })

    // place meta fields in list
    if (meta.length) {
      if (!ul) {
        ul = document.createElement('ul')
        ul.className = 'meta expanded';
        section.insertBefore(ul, anchor && anchor.nextElementSibling || section.firstChild);
      }
      for (var i = 0; i < meta.length; i++) {
        if (meta[i].parentNode != ul || meta[i].previousElementSibling != meta[i - 1])
          ul.insertBefore(meta[i], meta[i - 1] && meta[i - 1].nextElementSibling || null);
      }
      anchor = ul;
    }
    // place other fields in order
    for (var i = 0; i < newPlaceholders.length; i++) {
      var placeholder = newPlaceholders[i];
      if (meta.indexOf(placeholder) > -1)
        continue;
      if (placeholder && (placeholder.parentNode != anchor.parentNode ||
                          placeholder.previousElementSibling != anchor))
          anchor.parentNode.insertBefore(
            placeholder,
            anchor && anchor.nextElementSibling || (i == 0 ? section.firstChild : null)
          );
      anchor = placeholder;
    }
    // remove old placeholders
    for (var i = 0; i < oldPlaceholders.length; i++)
      if (newPlaceholders.indexOf(oldPlaceholders[i]) == -1) {
        if (oldPlaceholders[i].classList.contains('kx-placeholder')) {
          oldPlaceholders[i].parentNode.removeChild(oldPlaceholders[i])
        }
      }
  }
}

Editor.Placeholder.create = function(editor, content, form, field, placeholders, newPlaceholders, changedPlaceholders) {
  var section = content.getElementsByTagName('section')[0] || content;

  var label = Editor.Placeholder.getLabel(field)

  if ((field.tagName == 'INPUT' && field.type == 'text') && field.name && field.name.match(/\[?(?:title|name)\]?$/)) {
    var placeholder = Editor.Placeholder.resolve(content, field, ['H1', 'H2'], 'H1', placeholders, newPlaceholders, changedPlaceholders)
  } else {
    if ((field.tagName == 'INPUT' && field.type == 'text') || 
               (field.tagName == 'TEXTAREA' && !field.classList.contains('rich'))) {
        var placeholder = Editor.Placeholder.resolve(content, field, ['P', 'BLOCKQUOTE'], 'P', placeholders, newPlaceholders, changedPlaceholders)
    } else if ((field.type == 'file' && field.name.indexOf('_embeds') == -1)) {
        var placeholder = Editor.Placeholder.resolve(content, field, ['PICTURE', 'A'], 'LI', placeholders, newPlaceholders, changedPlaceholders)
    } else if ((field.tagName == 'SELECT')) {
        var placeholder = Editor.Placeholder.resolve(content, field, ['LI'], 'LI', placeholders, newPlaceholders, changedPlaceholders)
        placeholder.classList.add('meta')
    }

  }
  if (placeholder) 
    placeholder.setAttribute('label', label && label.textContent)

  return placeholder
};

Editor.Placeholder.getFirstChild = function(content, itempath, tagNames, placeholders, newPlaceholders) {
  var first = content.firstElementChild;
  if (first && first.tagName == 'SECTION')
    first = Editor.Section.getFirstChild(first);

  // 1. Attempt to find filled tag in first section
  var filledTag = first;
  while (filledTag) {
    if (newPlaceholders.indexOf(filledTag) == -1 && !filledTag.classList.contains('kx')) {
      if (tagNames.indexOf(filledTag.tagName) > -1) {
        if (!Editor.Content.isEmpty(filledTag, true) || placeholders.indexOf(filledTag) == -1)
          return filledTag;
      } else {
        // If something else is before h1, shift everything to next section
        if (placeholders.indexOf(filledTag) == -1 && filledTag.tagName != 'HR' && !filledTag.classList.contains('meta'))
          return;
      }
    }
    filledTag = filledTag.nextElementSibling;
  }
}

Editor.Placeholder.resolve = function(content, field, tagNames, tagToBuild, placeholders, newPlaceholders, changedPlaceholders) {
  var itempath = field.getAttribute('name');
  if (!field.value) 
    var first = Editor.Placeholder.getFirstChild(content, itempath, tagNames, placeholders, newPlaceholders);
  
  if (first) {
    var element = first;
    var updated = true;
    // when transforming one placeholder into another (e.g. <p> to <h1>) cleanup old field
    if (placeholders.indexOf(first) > -1) {
      var path = first.getAttribute('itempath');
      if (path && path != field.name) {
        var other = document.getElementsByName(path)[0]
        if (other)
          other.value = '';
      }
    }
      
  } else {
    for (var i = 0; i < placeholders.length; i++) {
      if (placeholders[i].getAttribute('itempath') == itempath) {
        if (!element && (tagNames.indexOf(placeholders[i].tagName) > -1 || tagToBuild == placeholders[i].tagName)) {
          var element = placeholders[i];
          if (field.value && element.getAttribute('value') != field.value)
            updated = true;

        } else {
          // when placeholder was transformed to another element that doesnt match
          // e.g. <h2> to <h3>, so it's not title anymore, nullify the form value
          if (changedPlaceholders.indexOf(placeholders[i]) > -1) {
            field.value = '';
          }


          placeholders[i].removeAttribute('itempath')
          placeholders[i].removeAttribute('label')
          placeholders[i].classList.remove('kx-placeholder');
          placeholders[i].classList.remove('kx-placeholder-shown');

        }
      }
    }
  }
  if (!element) {
    element = document.createElement(tagToBuild);
    element.textContent = field.value.trim();
    var updated = true;
  }
  for (var i = 0; i < element.childNodes.length; i++) {
    if (!Editor.Content.isEmpty(element.childNodes[i]) && element.childNodes[i].tagName != 'BR') {
      var hasContent = true;
    }
  }

  element.setAttribute('itempath', itempath)
  element.setAttribute('tabindex', 0)
  element.classList.add('kx-placeholder');
  if (hasContent) {
    element.className = 'kx-placeholder';
    element.classList.remove('kx-placeholder-shown');
  } else if (element.childNodes.length == 0) {
    element.innerHTML = '<br />'
    element.classList.add('kx-placeholder-shown');
  } 

  if (updated) {
    if (changedPlaceholders.indexOf(element) == -1)
      changedPlaceholders.push(element)
  }

  return element;
}

Editor.Placeholder.getLabel = function(input) {
  return document.querySelector('[for="' + input.id + '"]');
}

Editor.Placeholder.getForm = function(content) {
  for (var parent = content; parent; parent = parent.parentNode) {
    if (parent.tagName == 'FORM')
      return parent;
  }
}

Editor.Placeholder.getFields = function(form) {
  return Array.prototype.slice.call(form.querySelectorAll('[name]'));
}


Editor.Placeholder.dummy = document.createElement('div')

Editor.Placeholder.onChange = function(placeholder) {
  var field = document.getElementsByName(placeholder.getAttribute('itempath'))[0];
  if (field.tagName == 'INPUT' && field.type == 'text' || field.tagName == 'TEXTAREA') {
    Editor.Placeholder.dummy.innerHTML = placeholder.innerHTML
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '*$1*')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '*$1*')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '~$1~')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '~$1~')
      .replace(/<a[^>]*href=\"([^"]+)\"[^>]*>(.*?)<\/a>/gi, '$2 ($1)');
    field.value = Editor.Placeholder.dummy.textContent;
    field.setAttribute('value', field.value)
  }

}
Editor.Placeholder.write = function(editor, content, form) {
  var placeholders = Array.prototype.slice.call(content.getElementsByClassName('kx-placeholder'));
  for (var i = 0; i < placeholders.length; i++) {
    Editor.Placeholder.onChange(placeholders[i])
  }
  var input = document.querySelector('textarea.rich[name="' + content.getAttribute('name') + '"]')
  if (input) {
    Editor.Placeholder.dummy.innerHTML = editor.getData().replace(/\&nbsp;/g, '&#160;');
    Array.prototype.forEach.call(Editor.Placeholder.dummy.querySelectorAll('.kx, .kx-placeholder, .meta.expanded'), function(el) {
      el.parentNode.removeChild(el);
    })
    Array.prototype.forEach.call(Editor.Placeholder.dummy.children, function(el) {
      if (el.tagName != 'SECTION') el.parentNode.removeChild(el);
    });
    input.value = Editor.Placeholder.dummy.innerHTML
  }
}