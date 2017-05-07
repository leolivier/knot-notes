import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Note, NoteType } from '../../note';
import { Notebook } from '../../notebook/notebook';
import { DataService } from '../../services/data.service';
import { StatusEmitter } from '../../status-bar/status';

@Component({
  moduleId: module.id,
  selector: 'app-notebook-show',
  templateUrl: './notebook-show.component.html',
  styleUrls: ['./notebook-show.component.scss']
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
      .catch(reason => this.alerter.error('Error in show notebook: ' + reason));
  }
  get currentNotebook(): Notebook { return this._currentNotebook; }

  @Output() onSelectedNote = new EventEmitter<Note>();

  notes: Note[];

  private _selectedNote: Note;
  get selectedNote(): Note { return this._selectedNote; }
  set selectedNote(n: Note) {
    this._selectedNote = n;
    this.onSelectedNote.emit(n);
  }

  constructor(
    private noteService: DataService,
    private alerter: StatusEmitter) {
      this.notes = [];
    }

  name(): string {
    return (this.currentNotebook ? this.noteService.notebookFullName(this.currentNotebook) : 'no selection');
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
    const newn: Note = new Note({ notebookid: this.currentNotebook.id, type: NoteType.Text, order: this.notes.length });
    // save the note
    this.noteService.saveNote(newn)
          .then(note => {
        this.notes.push(note);
        this.selectedNote = note;
        this.startEdition(note);
      })
      .catch(reason => this.alerter.error('cannot create note: ' + JSON.stringify(reason)));
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

  allowDropNote($event) {
    $event.preventDefault();
  }

  dragNote($event, note: Note) {
    $event.dataTransfer.setData('text', note.id);
  }

  dropNote($event, beforeNote: Note) {
    $event.preventDefault();
    // the id of the note being dragged as stored in dragNote
    const draggedId = $event.dataTransfer.getData('text');
    // do nothing if not changed
    if (draggedId === beforeNote.id) { return; }
//    $event.target.appendChild(document.getElementById(data));
    // find the index of dragged note in notes
    let i = this.notes.findIndex(nt => nt.id === draggedId);
    // remember the dragged note
    const n = this.notes[i];
    // remove the dragged note from the list
    this.notes.splice(i, 1);
    // find where to re inseert it
    i = this.notes.findIndex(nt => nt.id === beforeNote.id);
    // and insert it
    this.notes.splice(i, 0, n);
    // re enumerate orders in notes
    this.notes.forEach((nt, idx) => {
      nt.order = idx;
      this.noteService.saveNote(nt);
    });
  }
}

