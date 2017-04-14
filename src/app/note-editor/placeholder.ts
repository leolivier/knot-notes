/**
 * Placeholder mgt for tinymce: not used anymore, replaced by a simple label in the template
 */
declare var tinymce: any;
const ph_defaultStyle = { style: { position: 'absolute', top: '2px', left: 0, color: '#aaaaaa', padding: '.25%', margin: '5px',
                    width: '80%', 'font-size': '17px !important;', overflow: 'hidden', 'white-space': 'pre-wrap' } };

export class Placeholder {
   el;
   placeholder_text: string;
   placeholder_attrs;
   contentAreaContainer;
   editor;

   constructor(editor) {
     this.editor = editor;
     this.placeholder_text = editor.getElement().getAttribute('placeholder') || editor.settings.placeholder;
     this.placeholder_attrs = editor.settings.placeholder_attrs || ph_defaultStyle;
     this.contentAreaContainer = document.getElementsByClassName('note-editor-wrapper')[0]; // editor.getContentAreaContainer();
     tinymce.DOM.setStyle(this.contentAreaContainer, 'position', 'relative');
     this.el = tinymce.DOM.add(this.contentAreaContainer, 'label', this.placeholder_attrs, this.placeholder_text);
   }

   hide() { tinymce.DOM.setStyle(this.el, 'display', 'none'); };

   show() { tinymce.DOM.setStyle(this.el, 'display', ''); };

   onFocus() { if (!this.editor.settings.readonly === true) { this.hide(); } this.editor.execCommand('mceFocus', false); }

   onBlur() { if (this.editor.getContent() === '') { this.show(); } else { this.hide(); } }

   initEditor() {
    this.onBlur();
    tinymce.DOM.bind(this.el, 'click', this.onFocus);
    this.editor.on('focus', () => this.onFocus());
    this.editor.on('blur', () => this.onBlur());
    this.editor.on('change', () => this.onBlur());
    this.editor.on('setContent', () => this.onBlur());
  }
}
