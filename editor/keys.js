Editor.Keys = function(editor) {
  editor.on('key', function(e) {
    if (e.data.domEvent.$.defaultPrevented)
      return false;
    if (e.data.keyCode == 13) {
      var selection = editor.getSelection()
      var range = selection.getRanges()[ 0 ]
      if (range) {
        var paragraph = Editor.Content.getEditableAscender(range.startContainer.$);
        if (paragraph.tagName == 'LI' || paragraph.parentNode.tagName == 'BLOCKQUOTE') return;

        var section = Editor.Section.get(paragraph);
        var first = Editor.Section.getFirstChild(section);
        if (!first) return false;
        if (Editor.Content.isEmpty(first)) {
          // ignore enter when section has only single empty element
          if (!first.nextElementSibling)
            return false;

          var split = Editor.Section.build();
          split.classList.add('forced')
          split.appendChild(paragraph)
          section.parentNode.insertBefore(split, section);
          range.moveToElementEditStart(new CKEDITOR.dom.element(paragraph))
          editor.getSelection().selectRanges([range])
          return false;
            
        } else {
          // split section on enter
          if (paragraph != first && Editor.Content.isEmpty(paragraph)) {
            var split = Editor.Section.build();
            split.classList.add('forced')
            var children = [];
            for (var sibling = paragraph; sibling; sibling = sibling.nextSibling)
              children.push(sibling);
            for (var child, i = 0; child = children[i++];)
              split.appendChild(child);
            section.parentNode.insertBefore(split, section.nextElementSibling);
            range.moveToElementEditStart(new CKEDITOR.dom.element(paragraph))
            editor.getSelection().selectRanges([range])
            return false;
          }
        }
      }
      if (editor.snapshot)
        editor.snapshot.saveIdentity()
    }
    if (e.data.keyCode == 8) {
      var selection = editor.getSelection()
      var range = selection.getRanges()[ 0 ]
      if (!range) return;
      if (range.checkStartOfBlock()) {
        var container = range.startContainer.$
        if (range.startOffset == range.endOffset) {
          for (; container.parentNode; container = container.parentNode) {
            if (Editor.Section.getFirstChild(container.parentNode) != container)
              break;
            // backspace at start of forced section (after virtual "hr") 
            // removes the boundary
            if (container.parentNode.tagName == 'SECTION') {
              if (container.parentNode.classList.contains('forced')) {
                container.parentNode.classList.remove('forced');
                return false;
              }
            }
          }
        }
        // backspace after picture selects it
        if (range.startOffset == 0 && range.endOffset == 0) {
          var p = Editor.Content.getEditableAscender(range.startContainer.$);
          p = p && p.previousElementSibling;
          if (p && (p.tagName == 'PICTURE'
                  || (p.tagName == 'A' 
                    && (p.firstElementChild && p.firstElementChild.tagName == 'PICTURE')))) {
            editor.getSelection().selectElement(new CKEDITOR.dom.element(p))
            return false;
          }
        }
      } else {
        var path = editor.elementPath()
        var picture = path.contains('picture');
        // backspace removes picture when it's selected
        if (range.startOffset != range.endOffset && picture) {
          var ascender = path.contains('a') || picture;
          var range = editor.createRange();
          var next = ascender.getNext(Editor.Content.paragraphs);
          var prev = ascender.getPrevious(Editor.Content.paragraphs);
          if (next) {
            range.moveToPosition( next, CKEDITOR.POSITION_AFTER_START);
          } else if (prev) {
            range.moveToPosition( prev, CKEDITOR.POSITION_BEFORE_END);
          } else {
            range.moveToPosition( ascender, CKEDITOR.POSITION_AFTER_END);

          }
          editor.getSelection().selectRanges([range])
          ascender.remove()

          return false;
        }
      }
    } else if (!e.data.domEvent.$.metaKey
            && !e.data.domEvent.$.ctrlKey
            && !e.data.domEvent.$.altKey 
            && (e.data.keyCode < 37 || e.data.keyCode > 40)) {
      // typing within picture is forbidden
      var sel = this.getSelection();
      var start = sel.getStartElement();
      var range = sel.getRanges()[0];
      var enclosed = range && range.getEnclosedNode()

      Editor.Selection.moveToNewParagraphAfterPicture(editor, range)
    }
  }, null, null, -10);
}