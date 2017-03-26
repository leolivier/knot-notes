import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Note, NoteType } from '../../note';
import { Notebook } from '../../notebook';
// import { NoteService } from '../../note.service';
import { DataService } from '../../data.service';

@Component({
  moduleId: module.id,
  selector: 'app-notebook-show',
  templateUrl: './notebook-show.component.html',
  styleUrls: ['./notebook-show.component.css']
})
export class NotebookShowComponent {

  private _editableNote: Note;
  private _previousTitle: string;
  private _currentNotebook: Notebook;

  @Input('notebook') set currentNotebook(notebook: Notebook) {
    this._currentNotebook = notebook;
    if (!notebook) { return; }
    this.noteService.getNotebookNotes(notebook.id)
      .then(notes => this.notes = notes)
      .catch(reason => alert('error in show notebook: ' + reason));
  }
  get currentNotebook(): Notebook { return this._currentNotebook; }

  @Output() onSelectedNote = new EventEmitter<Note>();

  notes: Note[];
  selectedNote: Note;

//  constructor(private noteService: NoteService) { }
  constructor(private noteService: DataService) {}

  name(): string {
    return (this.currentNotebook ? this.currentNotebook.fullName() : 'no selection');
  }

  selectNote(note: Note): void {
    this.selectedNote = note;
    this.onSelectedNote.emit(note);
  }

  isEditable(note: Note): boolean {
    return (note === this._editableNote);
  }

  startEdition(note: Note): void {
    this._editableNote = note;
    this._previousTitle = note.title;
  }

  cancelEdition(note: Note): void {
    if (this.isEditable(note)) {
      note.title = this._previousTitle;
      this._editableNote = null;
      this._previousTitle = '';
    }
  }

  toggleEdition(note: Note): void {
    if (this.isEditable(note)) { this.cancelEdition(note); } else { this.startEdition(note); }
  }

  endEdition(n: Note): void {
    this._editableNote = null;
    this._previousTitle = '';
    // save the notebook tree
//    this.noteService.updateNote(n);
    this.noteService.saveNote(n);
  }

  checkEndEdition($event, n: Note): void {
    switch ($event.key) {
      case 'Enter': this.endEdition(n); break;
      case 'Escape': this.cancelEdition(n); break;
    }
  }

  newNote(): void {
    // create a default new note with a predefined name in the current notebook
    const newn: Note = new Note({ notebookid: this.currentNotebook.id, type: NoteType.Text });
    // save the note
    this.noteService.saveNote(newn)
          .then(note => {
        this.notes.push(note);
        this.selectedNote = note;
        this.startEdition(note);
      })
      .catch(reason => alert('cannot create note: ' + JSON.stringify(reason)));
  }
  deleteNote(note: Note): void {
    this.noteService
        .deleteNote(note.id)
        .then(() => {
          this.notes = this.notes.filter(h => h !== note);
          if (this.selectedNote === note) { this.selectedNote = null; }
        });
  }
  renameNote(note: Note): void {
    this.noteService
        .saveNote(note)
        .then(() => {
          this.notes = this.notes.filter(h => h !== note);
          if (this.selectedNote === note) { this.selectedNote = null; }
        });
  }
  findById(id: string): Note {
    const ns = this.notes.filter(n => n.id = id);
    return (ns.length && ns.length > 0) ? ns[0] : null;
  }
}

