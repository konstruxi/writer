/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	
	// %REMOVE_START%
	// The configuration options below are needed when running CKEditor from source files.
	config.plugins = 'SimpleLink,sharedspace,blockquote,dialogui,dialog,clipboard,autolink,basicstyles,divarea,enterkey,floatingspace,entities,indent,indentlist,list,button,toolbar,undo' // ,magicline;
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

	config.allowedContent = 'picture h1 h2 h3 blockquote ul li ol b i code pre; iframe[src]; a[href,title]; abbr[title]; img[src,alt,title,uid,palette]; section(forced);'

	config.disallowedContent = 'section(focused); * {*}'

	config.shiftEnterMode = CKEDITOR.ENTER_P

	config.sharedSpaces = {
	    top: 'formatting',
	}
	config.undoStackSize = 150;
	config.title = false
	config.startupShowBorders = false;
	config.disableObjectResizing = true;
	config.fillEmptyBlocks = true;

};

CKEDITOR.dtd.picture = {img: 1}
CKEDITOR.dtd.$object.picture = 1
CKEDITOR.dtd.$object.img = 1
CKEDITOR.dtd.$cdata.picture = 1
CKEDITOR.dtd.$block.picture = 1; 
CKEDITOR.dtd.$block.img = 1; 
CKEDITOR.dtd.article = Object.create(CKEDITOR.dtd.article)
CKEDITOR.dtd.article.picture = 1;
CKEDITOR.dtd.$intermediate.picture = 1; 

CKEDITOR.dtd.$avoidNest = {
	p: 1,
	h1: 1,
	h2: 1,
	h3: 1,
	picture: 1,
	li: 1
}


CKEDITOR.dtd.$block.p = 1; 
CKEDITOR.dtd.$block.section = 1; 
CKEDITOR.dtd.$block.ul = 1; 
CKEDITOR.dtd.$block.ol = 1;  
CKEDITOR.dtd.$block.li = 1; 
CKEDITOR.dtd.$block.blockquote = 1; 
CKEDITOR.dtd.$blockLimit.blockquote = 1; 

/*
CKEDITOR.dtd.p = 
CKEDITOR.dtd.h1 = 
CKEDITOR.dtd.h2 = 
CKEDITOR.dtd.h3 = 
CKEDITOR.dtd.li = {a: 1, b: 1, strong: 1, span: 1, em: 1, i: 1};
*/
CKEDITOR.dtd.blockquote = {p: 1, a: 1, b: 1, strong: 1, span: 1, em: 1, i: 1};

CKEDITOR.dtd.section = {p: 1, a: 1, ul: 1, ol: 1, h1: 1, h2: 1, h3: 1, picture: 1, img: 1};

CKEDITOR.dtd.$intermediate.blockquote = 1; 
CKEDITOR.dtd.$intermediate.section = 1; 

CKEDITOR.dtd.a = Object.create(CKEDITOR.dtd.a)
CKEDITOR.dtd.a.picture = 1;
