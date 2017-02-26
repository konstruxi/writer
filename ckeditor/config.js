/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

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
		{ name: 'metas',  		 groups: [ 'meta'] },
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
	config.extraAllowedContent = 'header; style; svg[width,height,viewbox,unselectable]; use[*]; div svg span article section time[datetime]; * (*)[width,height,src,href,itempath,itemlabel,itemvalue,itemindex,itemtable,itemname,kx-html,kx-text,contenteditable,marked-to-delete]{background,background-color,width,height}';
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
