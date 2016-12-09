var picker = document.getElementsByClassName('picker')[0]
var matrix = document.getElementsByClassName('matrix')[0];
var activeSection;



function setActiveSection(target) {
  for (; target; target = target.parentNode) {
    if (target.tagName == 'SECTION') {
      if (target == activeSection) {
        togglePicker();
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
      editor.on('blur', togglePicker)
    }
    activeSection = target
    populateMatrix(activeSection)
    togglePicker();
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

function togglePicker() {
  if (!activeSection) return;
  clearTimeout(window.unpicking);
  var editor = Editor.get(activeSection)
  if (activeSection.classList.contains('focused') && editor && editor.focusManager.hasFocus) {
    picker.removeAttribute('hidden');
    formatting.removeAttribute('hidden')
    if (formatting.style.transition) {

      formatting.style.transition = 'none';
      formatting.style.opacity = 1;
      requestAnimationFrame(function() {
        formatting.style.opacity = '';
        formatting.style.transition = ''
      })
    }
    repositionPicker(activeSection)
  } else if (formatting.getAttribute('hidden') == null){
    formatting.style.transition = '0.3s opacity';
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

function repositionPicker() {
  var target = activeSection;
  if (!target || !target.parentNode) return;
  var top =  target.offsetTop + target.offsetParent.offsetTop;
  var left = target.offsetLeft + target.offsetParent.offsetLeft;
  var right = left + target.offsetWidth - picker.offsetWidth
  matrix.style.top = 
  picker.style.top = top + 'px';
  //matrix.style.width = 
  //picker.style.width = target.offsetWidth + 'px'
  matrix.style.left = left + 'px'
  picker.style.left = right + 'px'


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