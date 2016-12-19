/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	
	// %REMOVE_START%
	// The configuration options below are needed when running CKEditor from source files.
	config.plugins = 'SimpleLink,sharedspace,blockquote,dialogui,dialog,clipboard,basicstyles,divarea,enterkey,floatingspace,entities,indent,indentlist,list,button,toolbar,undo,pastefromword' // ,magicline;
	config.skin = 'none';
	// %REMOVE_END%

	// Define changes to default configuration here.
	// For complete reference see:
	// http://docs.ckeditor.com/#!/api/CKEDITOR.config

	// The toolbar groups arrangement, optimized for a single toolbar row.
	config.toolbarGroups = [
		{ name: 'document',	   groups: [ 'mode', 'document', 'doctools' ] },
		{ name: 'clipboard',   groups: [ 'clipboard', 'undo' ] },
		{ name: 'editing',     groups: [ 'find', 'selection', 'spellchecker' ] },
		{ name: 'forms' },
		{ name: 'basicstyles', groups: [ 'basicstyles', 'links', 'others', 'cleanup' ] },
		{ name: 'paragraph',   groups: [ 'structural', 'blocks', 'align', 'bidi','list', 'indent' ] },
		{ name: 'insert' },
		{ name: 'styles' },
		{ name: 'colors' },
		{ name: 'tools' },
		{ name: 'about' }
	];

	// The default plugins included in the basic setup define some buttons that
	// are not needed in a basic editor. They are removed here.
	config.removeButtons = 'Cut,Copy,Paste,Undo,Redo,Anchor,Underline,Strike,Subscript,Superscript';

	// Dialog windows are also simplified.
	config.removeDialogTabs = 'link:advanced';

	config.allowedContent = 'picture(loading,added); h1 h2 h3 blockquote ul li ol b i code pre; iframe[src]; a[href,title]; abbr[title]; img[src,alt,title,uid,palette,width,height]; section(forced);'

	config.disallowedContent = 'section(focused); * {*}'

	config.shiftEnterMode = CKEDITOR.ENTER_P

	config.sharedSpaces = {
	    top: 'formatting',
	}
	config.undoStackSize = 150;
	config.title = false
	config.startupShowBorders = false;
	config.disableObjectResizing = true;
};
