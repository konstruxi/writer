var picker = document.getElementsByClassName('picker')[0]
var matrix = document.getElementsByClassName('matrix')[0];
var activeSection;



function setActiveSection(target, force) {
  for (; target; target = target.parentNode) {
    if (target.tagName == 'SECTION') {
      if (target == activeSection) {
        togglePicker(Editor.get(activeSection));
        return false
      }
      break
    }
  }
  clearTimeout(window.unpicking)
  var editor = Editor.get(target || activeSection);
  if (editor) {
    editor.fire('lockSnapshot')
    if (!editor.isSetUp) {
      editor.isSetUp = true;
      editor.on('blur', function() {
        togglePicker(editor)
      })
    }
    activeSection = target
    togglePicker(editor, true);
    editor.fire('unlockSnapshot')
  }
}

function populateMatrix(activeSection) {
  var cells = matrix.getElementsByTagName('td');
  var html = activeSection.outerHTML;
  for (var i = 0; i < cells.length; i++) {
    if (cells[i].firstChild)
      cells[i].removeChild(cells[i].firstChild)

    var clone = activeSection.cloneNode(true);
    clone.classList.remove('focused');
    clone.classList.add('clone');
    clone.style.width = activeSection.offsetWidth + 'px'
    clone.style.maxWidth = activeSection.offsetWidth + 'px'

    var wrapper = document.createElement('div')
    wrapper.className = 'wrapper'

    wrapper.appendChild(clone)
    cells[i].appendChild(wrapper)
  }
}

formatting.addEventListener('mousemove', function(e) {
  e.stopPropagation()
})

function togglePicker(editor, force) {
  if (!activeSection) return;
  clearTimeout(window.unpicking);
  var editor = Editor.get(activeSection)
  if (activeSection.classList.contains('focused') && editor && editor.focusManager.hasFocus) {
    picker.removeAttribute('hidden');
    formatting.removeAttribute('hidden')
    repositionPicker(editor, activeSection, force)
  } else if (formatting.getAttribute('hidden') == null){
    window.unpicking = setTimeout(function() {
      picker.setAttribute('hidden', 'hidden');
      formatting.setAttribute('hidden', 'hidden')
    }, 50)
  }
}

document.addEventListener('click', function(e) {
  for (var target = e.target; target.nodeType != 9; target = target.parentNode) {
    if (target.parentNode == picker) {
      var editor = Editor.get(e.target);
      picker.setAttribute('hidden', 'hidden');
      matrix.removeAttribute('hidden');
      if (editor)
        editor.fire('lockSnapshot')
      if (activeSection.parentNode)
        activeSection.parentNode.classList.add('picking');
      populateMatrix(activeSection)
    
      activeSection.classList.add('picking');
      if (editor)
        editor.fire('unlockSnapshot')
      return
    } else if (target.classList.contains('wrapper')) {
      cancelPicking();
      e.preventDefault()
      e.stopPropagation()
      return;
    } else if (target == activeSection) {
      var active = true;
    }
  }
  if (activeSection && !active) {
    //cancelPicking()
    e.preventDefault()
    e.stopPropagation()
  }
})

function repositionPicker(editor, target, force) {
  if (!target || !target.parentNode) return;
  if (editor.animating && editor.styleupdate) {
    var index = editor.styleupdate[0].indexOf(target);
    if (index > -1) {
      var top = editor.styleupdate[1][index].top + editor.offsetTop;
      var left = editor.styleupdate[1][index].left + editor.offsetLeft;
    } else {
      return;
    }
  } else {
    var top =  target.offsetTop + target.offsetParent.offsetTop;
    var left = target.offsetLeft + target.offsetParent.offsetLeft;
  }
  matrix.style.top = 
  picker.style.top = top + 'px';
  //matrix.style.width = 
  //picker.style.width = target.offsetWidth + 'px'
  matrix.style.left = left + 'px'
  picker.style.left = left + 'px'
}

function cancelPicking() {
  var editor = Editor.get(activeSection);
  if (editor)
    editor.fire('lockSnapshot')
  activeSection.classList.remove('picking');
  picker.setAttribute('hidden', 'hidden');
  matrix.setAttribute('hidden', 'hidden');
  if (activeSection.parentNode)
    activeSection.parentNode.classList.remove('picking');
  activeSection = null;
  if (editor)
    editor.fire('unlockSnapshot')
}