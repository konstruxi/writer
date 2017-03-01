var script = document.getElementById('editor-loader');
if (script) {
  var prefix = script.src.replace('loader.dev.js', '')
} else {
  var prefix = ''
}


if (window.LOAD_DEV_CKEDITOR) {
  var CKEDITOR_BASEPATH = prefix + 'ckeditor/';
  var CKEDITOR_FILE = 'ckeditor/ckeditor.js'
} else {
  var CKEDITOR_BASEPATH = prefix + 'ckeditor/release/';
  var CKEDITOR_FILE = '../release/ckeditor.js'
}

window.KX_STATIC_PREFIX = prefix;


document.write('\
<svg style="display: none" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">\
<defs>\
<g id="split-section-icon">\
  <path d="M8 26h12v-4H8v4zm32 8H8v4h32v-4zm-6-24H8v4h26.5c2.21 0 4 1.79 4 4s-1.79 4-4 4H30v-4l-6 6 6 6v-4h4c4.41 0 8-3.59 8-8s-3.59-8-8-8z"/></g>\
<g id="resize-section-icon">\
  <path d="M9,30 L39,30 L39,26 L9,26 L9,30 Z M9,16 L9,20 L39,20 L39,16 L9,16 Z" /></g>\
<g id="zoom-out-icon">\
  <path d="M30.2995998,27.3836478 L28.7638651,27.3836478 L28.219554,26.8587764 C30.1246427,24.6426529 31.2715838,21.7655803 31.2715838,18.6357919 C31.2715838,11.6569468 25.6146369,6 18.6357919,6 C11.6569468,6 6,11.6569468 6,18.6357919 C6,25.6146369 11.6569468,31.2715838 18.6357919,31.2715838 C21.7655803,31.2715838 24.6426529,30.1246427 26.8587764,28.219554 L27.3836478,28.7638651 L27.3836478,30.2995998 L37.1034877,40 L40,37.1034877 L30.2995998,27.3836478 L30.2995998,27.3836478 Z M18.6357919,27.3836478 C13.7953116,27.3836478 9.88793596,23.4762722 9.88793596,18.6357919 C9.88793596,13.7953116 13.7953116,9.88793596 18.6357919,9.88793596 C23.4762722,9.88793596 27.3836478,13.7953116 27.3836478,18.6357919 C27.3836478,23.4762722 23.4762722,27.3836478 18.6357919,27.3836478 Z M13.7758719,17.6638079 L23.4957118,17.6638079 L23.4957118,19.6077759 L13.7758719,19.6077759 L13.7758719,17.6638079 Z"></path></g>\
<g id="zoom-in-icon">\
  <path d="M30.2995998,27.3836478 L28.7638651,27.3836478 L28.219554,26.8587764 C30.1246427,24.6426529 31.2715838,21.7655803 31.2715838,18.6357919 C31.2715838,11.6569468 25.6146369,6 18.6357919,6 C11.6569468,6 6,11.6569468 6,18.6357919 C6,25.6146369 11.6569468,31.2715838 18.6357919,31.2715838 C21.7655803,31.2715838 24.6426529,30.1246427 26.8587764,28.219554 L27.3836478,28.7638651 L27.3836478,30.2995998 L37.1034877,40 L40,37.1034877 L30.2995998,27.3836478 L30.2995998,27.3836478 Z M18.6357919,27.3836478 C13.7953116,27.3836478 9.88793596,23.4762722 9.88793596,18.6357919 C9.88793596,13.7953116 13.7953116,9.88793596 18.6357919,9.88793596 C23.4762722,9.88793596 27.3836478,13.7953116 27.3836478,18.6357919 C27.3836478,23.4762722 23.4762722,27.3836478 18.6357919,27.3836478 Z M23.4957118,19.6077759 L19.6077759,19.6077759 L19.6077759,23.4957118 L17.6638079,23.4957118 L17.6638079,19.6077759 L13.7758719,19.6077759 L13.7758719,17.6638079 L17.6638079,17.6638079 L17.6638079,13.7758719 L19.6077759,13.7758719 L19.6077759,17.6638079 L23.4957118,17.6638079 L23.4957118,19.6077759 Z"></path></g>\
\
<g id="palette-icon">\
  <path d="M24,5 C14.06,5 6,13.06 6,23 C6,32.94 14.06,41 24,41 C25.66,41 27,39.66 27,38 C27,37.22 26.7,36.52 26.22,35.98 C25.76,35.46 25.46,34.76 25.46,34 C25.46,32.34 26.8,31 28.46,31 L32,31 C37.52,31 42,26.52 42,21 C42,12.16 33.94,5 24,5 Z M13,23 C11.34,23 10,21.66 10,20 C10,18.34 11.34,17 13,17 C14.66,17 16,18.34 16,20 C16,21.66 14.66,23 13,23 Z M19,15 C17.34,15 16,13.66 16,12 C16,10.34 17.34,9 19,9 C20.66,9 22,10.34 22,12 C22,13.66 20.66,15 19,15 Z M29,15 C27.34,15 26,13.66 26,12 C26,10.34 27.34,9 29,9 C30.66,9 32,10.34 32,12 C32,13.66 30.66,15 29,15 Z M35,23 C33.34,23 32,21.66 32,20 C32,18.34 33.34,17 35,17 C36.66,17 38,18.34 38,20 C38,21.66 36.66,23 35,23 Z"></path>\
</g>\
<g id="link-icon">\
<path d="M7.8 24c0-3.42 2.78-6.2 6.2-6.2h8V14h-8C8.48 14 4 18.48 4 24s4.48 10 10 10h8v-3.8h-8c-3.42 0-6.2-2.78-6.2-6.2zm8.2 2h16v-4H16v4zm18-12h-8v3.8h8c3.42 0 6.2 2.78 6.2 6.2s-2.78 6.2-6.2 6.2h-8V34h8c5.52 0 10-4.48 10-10s-4.48-10-10-10z"/>\
</g>\
\
<g id="settings-icon">\
  <path d="M38.86 25.95c.08-.64.14-1.29.14-1.95s-.06-1.31-.14-1.95l4.23-3.31c.38-.3.49-.84.24-1.28l-4-6.93c-.25-.43-.77-.61-1.22-.43l-4.98 2.01c-1.03-.79-2.16-1.46-3.38-1.97L29 4.84c-.09-.47-.5-.84-1-.84h-8c-.5 0-.91.37-.99.84l-.75 5.3c-1.22.51-2.35 1.17-3.38 1.97L9.9 10.1c-.45-.17-.97 0-1.22.43l-4 6.93c-.25.43-.14.97.24 1.28l4.22 3.31C9.06 22.69 9 23.34 9 24s.06 1.31.14 1.95l-4.22 3.31c-.38.3-.49.84-.24 1.28l4 6.93c.25.43.77.61 1.22.43l4.98-2.01c1.03.79 2.16 1.46 3.38 1.97l.75 5.3c.08.47.49.84.99.84h8c.5 0 .91-.37.99-.84l.75-5.3c1.22-.51 2.35-1.17 3.38-1.97l4.98 2.01c.45.17.97 0 1.22-.43l4-6.93c.25-.43.14-.97-.24-1.28l-4.22-3.31zM24 31c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>\
</g>\
\
<g id="move-down-icon">\
<path d="M38,26 L30,26 L30,14 L18,14 L18,26 L10,26 L24,40 L38,26 Z M10,6 L10,10 L38,10 L38,6 L10,6 Z" fill-rule="evenodd"></path>\
</g>\
\
<g id="split-icon">\
\
    <path d="M33,10.6153846 L27.8571429,10.6153846 L27.8571429,18 L20.1428571,18 L20.1428571,10.6153846 L15,10.6153846 L24,2 L33,10.6153846 Z M33,36.8461538 L27.8571429,36.8461538 L27.8571429,29 L20.1428571,29 L20.1428571,36.8461538 L15,36.8461538 L24,46 L33,36.8461538 Z M5,21 L5,26 L43,26 L43,21 L5,21 Z"></path>\
</g>\
\
<g id="move-up-icon">\
<path d="M18 32h12V20h8L24 6 10 20h8zm-8 4h28v4H10z"/>\
</g>\
\
<g id="star-icon">\
<path d="M22,32.54L34.36 40 31.08 25.94 42 16.48 27.62 15.26 22 2 16.38 15.26 2 16.48 12.92 25.94 9.64 40z"/>\
</g>\
\
<g id="unstar-icon">\
\
    <path d="M42,16.48 L27.62,15.24 L22,2 L16.38,15.26 L2,16.48 L12.92,25.94 L9.64,40 L22,32.54 L34.36,40 L31.1,25.94 L42,16.48 Z M22,28.8 L14.48,33.34 L16.48,24.78 L9.84,19.02 L18.6,18.26 L22,10.2 L25.42,18.28 L34.18,19.04 L27.54,24.8 L29.54,33.36 L22,28.8 Z"></path>\
</g>\
\
<g id="move-icon">\
  <path d="M20 18h8v-6h6L24 2 14 12h6v6zm-2 2h-6v-6L2 24l10 10v-6h6v-8zm28 4L36 14v6h-6v8h6v6l10-10zm-18 6h-8v6h-6l10 10 10-10h-6v-6z"/>\
</g>\
\
<g id="menu-icon">\
  <path d="M12 20c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm24 0c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm-12 0c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>\
</g>\
</defs></svg>\
\
\
\
<div id="formatting" hidden></div>\
\
<div class="circle-menu" id="sectionizer" hidden>\
  <svg viewBox="-2 0 48 48" class="unstar icon"><use xlink:href="#unstar-icon"></use></svg>\
  <svg viewBox="-2 0 48 48" class="star icon"><use xlink:href="#star-icon"></use></svg>\
  <svg viewBox="-1 0 50 50" class="left pick palette icon"><use xlink:href="#palette-icon"></use></svg>\
  <svg viewBox="0 0 48 48" class="top split handler icon"><use xlink:href="#split-section-icon"></use></svg>\
  <svg viewBox="-1 0 50 50" class="right pick settings icon"><use xlink:href="#settings-icon"></use></svg>\
  <svg viewBox="-2 2 48 48" class="bottom-left shrink zoomer icon"><use xlink:href="#zoom-out-icon"></use></svg>\
  <svg viewBox="-2 2 48 48" class="bottom-right enlarge zoomer icon"><use xlink:href="#zoom-in-icon"></use></svg>\
</div>\
');
function exportConfig() {

  CKEDITOR.editorConfig = function( config ) {
    
    // %REMOVE_START%
    // The configuration options below are needed when running CKEditor from source files.
    config.plugins = 'SimpleLink,sharedspace,blockquote,dialogui,dialog,clipboard,basicstyles,divarea,enterkey,floatingspace,entities,indent,indentlist,list,button,toolbar,undo' // ,magicline;
    config.skin = 'none';
    // %REMOVE_END%
    
    config.customConfig = ''; //no config.js
    config.stylesSet = false; //no styles.js
    config.defaultLanguage = 'en'; //default language
    config.language = 'en'; //ui language

    // Define changes to default configuration here.
    // For complete reference see:
    // http://docs.ckeditor.com/#!/api/CKEDITOR.config

    // The toolbar groups arrangement, optimized for a single toolbar row.
    config.toolbarGroups = [
      { name: 'metas',       groups: [ 'meta'] },
      { name: 'foormatting', groups: [ 'basicstyles', 'cleanup' , 'structural', 'blocks', 'list', 'indent' ] },
      { name: 'objects',     groups: [ 'objects', 'links' ] }
      
    ];

    // The default plugins included in the basic setup define some buttons that
    // are not needed in a basic editor. They are removed here.
    config.removeButtons = 'Cut,Copy,Paste,Undo,Redo,Anchor,Underline,Strike,Subscript,Superscript';

    config.pasteFilter = 'semantic-content'
    // Dialog windows are also simplified.
    config.removeDialogTabs = 'link:advanced';

    config.allowedContent = 'x-div picture(loading,added)[uid]; hr h1 h2 h3 h4 h5 blockquote ul li ol; b i code pre abbr; iframe[src]; a[href,title,hidden,aria-hidden]; abbr[title]; img(*)[src,alt,title,uid,palette,width,height,class]; section(*)[*];'
    config.extraAllowedContent = 'svg[width,height,viewbox,unselectable]; use[*]; div svg span article section time[datetime]; * (*)[width,height,src,href,itempath,itemlabel,kx-html,kx-text,contenteditable]{background,background-color,width,height}';
    config.disallowedContent = 'section(focused);'

    config.shiftEnterMode = CKEDITOR.ENTER_P

    config.sharedSpaces = {
        top: 'formatting'
    }
    config.undoStackSize = 150;
    config.title = false
    config.startupShowBorders = false;
    config.disableObjectResizing = true;
    config.entities_processNumerical = true;
  };
}

document.write('\
  <script src="' + prefix +  CKEDITOR_FILE + '"></script>\
\
  <script src="' + prefix +  'colors/rgbquant.js"></script>\
  <script src="' + prefix +  'colors/quantize.js"></script>\
  <script src="' + prefix +  'colors/vibrant.js"></script>\
  <script src="' + prefix +  'colors/pallete.js"></script>\
  <script src="' + prefix +  'colors/resize.js"></script>\
  <script src="' + prefix +  'colors/unsharp.js"></script>\
  <script src="' + prefix +  'colors/crop.js"></script>\
\
  <script src="' + prefix +  'editor/hammer.js"></script>\
  <script src="' + prefix +  'editor/editor.js"></script>\
  <script src="' + prefix +  'editor/gestures.js"></script>\
  <script src="' + prefix +  'editor/dtd.js"></script>\
  <script src="' + prefix +  'editor/commands.js"></script>\
  <script src="' + prefix +  'editor/keys.js"></script>\
  <script src="' + prefix +  'editor/selection.js"></script>\
  <script src="' + prefix +  'editor/clipboard.js"></script>\
  <script src="' + prefix +  'editor/keys.js"></script>\
\
  <script src="' + prefix +  'worker.js"></script>\
  <script src="' + prefix +  'editor/container.js"></script>\
  <script src="' + prefix +  'editor/snapshot.js"></script>\
  <script src="' + prefix +  'editor/snapshot.ckeditor.js"></script>\
  <script src="' + prefix +  'editor/spring.js"></script>\
  <script src="' + prefix +  'editor/picker.js"></script>\
  <script src="' + prefix +  'editor/chrome.js"></script>\
  <script src="' + prefix +  'editor/content.js"></script>\
  <script src="' + prefix +  'editor/section.js"></script>\
  <script src="' + prefix +  'editor/style.js"></script>\
  <script src="' + prefix +  'editor/observer.js"></script>\
  <script src="' + prefix +  'editor/image.js"></script>\
  <script src="' + prefix +  'editor/placeholder.js"></script>\
  <script>\
    exportConfig();\
    var editors = document.querySelectorAll(\'.content[contenteditable]\');\
    for (var i = 0; i < editors.length; i++)\
      new Editor(editors[i], {})\
  </script>');

