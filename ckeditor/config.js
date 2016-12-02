/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	
	// %REMOVE_START%
	// The configuration options below are needed when running CKEditor from source files.
	config.plugins = 'SimpleLink,dialogui,dialog,clipboard,autolink,basicstyles,divarea,enterkey,floatingspace,entities,indent,indentlist,list,magicline,button,toolbar,undo';
	config.skin = 'moono-dark';
	// %REMOVE_END%

	// Define changes to default configuration here.
	// For complete reference see:
	// http://docs.ckeditor.com/#!/api/CKEDITOR.config

	// The toolbar groups arrangement, optimized for a single toolbar row.
	config.toolbarGroups = [
		{ name: 'structural'},
		{ name: 'document',	   groups: [ 'mode', 'document', 'doctools' ] },
		{ name: 'clipboard',   groups: [ 'clipboard', 'undo' ] },
		{ name: 'editing',     groups: [ 'find', 'selection', 'spellchecker' ] },
		{ name: 'forms' },
		{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
		{ name: 'paragraph',   groups: [ 'list', 'blocks', 'align', 'bidi' ] },
		{ name: 'links' },
		{ name: 'insert' },
		{ name: 'styles' },
		{ name: 'colors' },
		{ name: 'tools' },
		{ name: 'others' },
		{ name: 'about' }
	];

	// The default plugins included in the basic setup define some buttons that
	// are not needed in a basic editor. They are removed here.
	config.removeButtons = 'Cut,Copy,Paste,Undo,Redo,Anchor,Underline,Strike,Subscript,Superscript';

	// Dialog windows are also simplified.
	config.removeDialogTabs = 'link:advanced';

	config.allowedContent = 'h1 h2 blockquote a img ul li ol; section[class,disabled]'

	config.shiftEnterMode = CKEDITOR.ENTER_P
};

CKEDITOR.config.height = 150;
CKEDITOR.config.width = 'auto';
CKEDITOR.dtd.$block.p = 1; 
CKEDITOR.dtd.$block.h1 = 1; 
CKEDITOR.dtd.$block.li = 1; 

CKEDITOR.dtd.section = Object.create(CKEDITOR.dtd.section)
CKEDITOR.dtd.section.section = undefined;

CKEDITOR.dtd.$blockLimit.section = 1;
CKEDITOR.dtd.$blockLimit.h1 = 1;
CKEDITOR.dtd.$removeEmpty.section = 1