import { Component, OnInit, OnDestroy, AfterViewInit, EventEmitter, Input, Output } from '@angular/core';
import { Note } from '../note';
// import { NoteService } from '../note.service';
import { DataService } from '../services/data.service';
import { Subject } from 'rxjs/Subject';
// Observable operators
import 'rxjs/add/operator/mapTo';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

declare var tinymce: any;

@Component({
  moduleId: module.id,
  selector: 'app-note-editor',
  templateUrl: './note-editor.component.html',
  styleUrls: ['./note-editor.component.scss']
})
export class NoteEditorComponent implements OnInit, AfterViewInit, OnDestroy {
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

  private contentSubject = new Subject<string>();

//  constructor(private noteService: NoteService) {}
  constructor(private noteService: DataService) {}

  ngOnInit(): void {
    this.contentSubject
      .debounceTime(1000)        // wait 1s between 2 saves
      .distinctUntilChanged()   // ignore if the content did not change
      .subscribe(content => this.save(content));   // save content
  }

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
        // 'textcolor', 'colorpicker'
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
    editor.on('blur', () => this.save(null, editor.getContent()));
    editor.on('keyup', (e) => {
      if (e.key === 'Enter') {
        editor.fire('blur');
      }
    });
  }

  setupNoteEditor(editor) {
    this.noteEditor = editor;
    editor.on('keyup', () => {
//      this.note.content = editor.getContent();
//      this.save();
      this.contentSubject.next(editor.getContent());  // register the content to be saved
    });
    editor.on('blur', () => editor.fire('keyup'));
    editor.on('change', () => editor.fire('keyup'));
  }

  save(content?: string, title?: string): void {
    if (content) { this.note.content = content; }
    if (title) { this.note.title = title; }
    if (content || title) {
      this.noteService.saveNote(this.note)
        .catch(reason => alert ('save error:' + JSON.stringify(reason)));
    }
  }
}
