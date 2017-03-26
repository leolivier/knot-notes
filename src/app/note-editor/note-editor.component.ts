import { Component, OnDestroy, AfterViewInit, EventEmitter, Input, Output } from '@angular/core';
import { Note } from '../note';
// import { NoteService } from '../note.service';
import { DataService } from '../data.service';

declare var tinymce: any;
const ph_defaultStyle = { style: { position: 'absolute', top: '2px', left: 0, color: '#aaaaaa', padding: '.25%', margin: '5px',
                    width: '80%', 'font-size': '17px !important;', overflow: 'hidden', 'white-space': 'pre-wrap' } };

class Label { // for placeholder mgt
   el;
   placeholder_text: string;
   placeholder_attrs;
   contentAreaContainer;

   constructor(editor) {
     this.placeholder_text = editor.getElement().getAttribute('placeholder') || editor.settings.placeholder;
     this.placeholder_attrs = editor.settings.placeholder_attrs || ph_defaultStyle;
     this.contentAreaContainer = document.getElementsByClassName('note-editor-wrapper')[0]; // editor.getContentAreaContainer();
     tinymce.DOM.setStyle(this.contentAreaContainer, 'position', 'relative');
     this.el = tinymce.DOM.add(this.contentAreaContainer, 'label', this.placeholder_attrs, this.placeholder_text);
   }
   hide() { tinymce.DOM.setStyle(this.el, 'display', 'none'); };
   show() { tinymce.DOM.setStyle(this.el, 'display', ''); };
}

@Component({
  moduleId: module.id,
  selector: 'app-note-editor',
  templateUrl: './note-editor.component.html',
  styleUrls: ['./note-editor.component.css']
})
export class NoteEditorComponent implements AfterViewInit, OnDestroy {
  private _note: Note;
  @Input () set note(note: Note) {
    const reinit = (this._note && this._note !== note);
    this._note = note;
    // force reinit as Angular does not seem to detect change :/
    if (reinit) { this.ngAfterViewInit(); }
  }
  get note(): Note { return this._note; }

  @Input() editorId: String;

  editor;

//  constructor(private noteService: NoteService) {}
    constructor(private noteService: DataService) {}

  ngAfterViewInit() {
    // double check, should be useless if ok on ngDestroy
    // if (this.editor) { tinymce.remove(this.editor); }
    // init the tinyMCE editor
    tinymce.init({
      selector: '#' + this.editorId,
      plugins: ['link', 'paste', 'table'],
/*      plugins: [
        'advlist autolink lists link image charmap print preview anchor',
        'searchreplace visualblocks code fullscreen',
        'insertdatetime media table contextmenu paste'
      ],*/
      toolbar: 'insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | ' +
                'bullist numlist outdent indent | link image',
      skin_url: 'assets/skins/lightgray',
      inline: true,
      setup: editor => this.setupEditor(editor),
//      init_instance_callback: editor => this.initEditor(editor),
    });
    this.editor.setContent(this.note.content);
  }

  ngOnDestroy() {
    tinymce.remove(this.editor);
    this.editor.setContent('');
  }

  setupEditor(editor) {
    this.editor = editor;
    editor.on('keyup', () => {
      this.note.content = editor.getContent();
      this.save();
    });
  }

  initEditor(editor) {
    const label = new Label(editor);
    onBlur();
    tinymce.DOM.bind(label.el, 'click', onFocus);
    editor.on('focus', onFocus);
    editor.on('blur', onBlur);
    editor.on('change', onBlur);
    editor.on('setContent', onBlur);
    function onFocus() { if (!editor.settings.readonly === true) { label.hide(); } editor.execCommand('mceFocus', false); }
    function onBlur() { if (editor.getContent() === '') { label.show(); } else { label.hide(); } }
  }

  save(): void {
    this.noteService.saveNote(this.note)
      .catch(reason => alert ('save error:' + JSON.stringify(reason)));
  }
}
