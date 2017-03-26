import { Component, OnDestroy, AfterViewInit, EventEmitter, Input, Output } from '@angular/core';
import { Note } from '../note';
// import { NoteService } from '../note.service';
import { DataService } from '../data.service';

declare var tinymce: any;

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
    if (this.editor) { tinymce.remove(this.editor); }
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
      setup: editor => {
        this.editor = editor;
        editor.on('keyup', () => {
          this.note.content = editor.getContent();
          this.save();
        });
      },
    });
    this.editor.setContent(this.note.content);
  }

  ngOnDestroy() {
    tinymce.remove(this.editor);
  }

  save(): void {
    this.noteService.saveNote(this.note)
      .catch(reason => alert ('save error:' + JSON.stringify(reason)));
  }
}
