import { Component, OnDestroy, AfterViewInit, EventEmitter, Input, Output } from '@angular/core';
import { Note } from '../note';
// import { NoteService } from '../note.service';
import { DataService } from '../services/data.service';

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
  styleUrls: ['./note-editor.component.scss']
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

  noteEditor;
  titleEditor;

//  constructor(private noteService: NoteService) {}
    constructor(private noteService: DataService) {}

  ngAfterViewInit() {
    // init the tinyMCE editor for the title
    tinymce.init({
      selector: '#title_editor',
      inline: true,
      toolbar: 'undo redo',
      menubar: false,
      setup: editor => this.setupTitleEditor(editor),
    });
    this.titleEditor.setContent(this.note.title);

    // init the tinyMCE editor
    tinymce.init({
      selector: '#note_editor',
      plugins: [
        'link', 'paste', 'table', 'lists', 'advlist', 'autolink', 
        'image', 'charmap', 'print', 'preview', 'anchor',
        'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'contextmenu'
        //'textcolor', 'colorpicker'
      ],
      toolbar1: 'undo redo | cut copy paste pasteastext insert selectall | styleselect | bold italic clearformat| ' +
                'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent',
      toolbar2: 'searchreplace anchor | link image media table charmap | print preview fullscreen | ' +
                'code visualblocks',
      skin_url: 'assets/skins/lightgray',
      contextmenu: 'link image inserttable | cell row column deletetable',
      menubar: false,
      inline: true,
      setup: editor => this.setupNoteEditor(editor),
//      init_instance_callback: editor => this.initEditor(editor),
    });
    this.noteEditor.setContent(this.note.content);
  }

  ngOnDestroy() {
    tinymce.remove(this.noteEditor);
    this.noteEditor.setContent('');
  }

  setupTitleEditor(editor) {
    this.titleEditor = editor;
    editor.on('blur', () => {
      this.note.title = editor.getContent();
      this.save();
    });
    editor.on('keyup', (e) => {
      if (e.key === 'Enter') {
        editor.fire('blur');
      }
    });
  }
  
  setupNoteEditor(editor) {
    this.noteEditor = editor;
    editor.on('keyup', () => {
      this.note.content = editor.getContent();
      this.save();
    });
    editor.on('blur', () => editor.fire('keyup'));
    editor.on('change', () => editor.fire('keyup'));
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
