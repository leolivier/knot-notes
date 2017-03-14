import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
//import { Router } from '@angular/router';
import { ActivatedRoute, Params } from '@angular/router';
import { Location }               from '@angular/common';

import { Note, NoteType } from '../../note';
import { Notebook } from '../../notebook';
import { NoteService } from '../../note.service';

@Component({
  moduleId: module.id,
  selector: 'app-notebook-show',
  templateUrl: './notebook-show.component.html',
  styleUrls: ['./notebook-show.component.css']
})
export class NotebookShowComponent implements OnInit {

  private _editableNote: Note;
  private _previousTitle: string;
  private _currentNotebook: Notebook;

  @Input('notebook') set currentNotebook(notebook: Notebook) {
    this._currentNotebook = notebook;
    if (!notebook) return;
    this.noteService.getNotebookNotes(notebook.id)
      .then(notes => this.notes = notes)
      .catch(reason=>alert('error in show notebook: '+reason));
  }
  get currentNotebook(): Notebook { return this._currentNotebook; }

  @Output() onSelectedNote = new EventEmitter<Note>();

  notes: Note[];
  selectedNote: Note;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private noteService: NoteService) { }

  ngOnInit(): void {
/*    this.route.params
      .switchMap((params: Params) => this.noteService.getNotebookNotes(+params['id']))
      .subscribe(notes => this.notes = notes); 
*/
  }

  name(): string {
    return (this.currentNotebook? this.currentNotebook.fullName() : "no selection");
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
      this._previousTitle = "";
    }
  }

  toggleEdition(note:Note): void {
    if (this.isEditable(note)) this.cancelEdition(note);
    else this.startEdition(note);
  }

  endEdition(n: Note): void {
    this._editableNote = null;
    this._previousTitle = "";
    // save the notebook tree
    this.noteService.updateNote(n);
  }

  checkEndEdition($event, n: Note): void {
    if ($event.key === "Enter") this.endEdition(n);
    else if ($event.key === "Escape") this.cancelEdition(n);
  }

  getId(): number {
    return Math.ceil(Math.random()*10000000);
  }

  newNote(): void {
    // create a default new note with a random id and a predefined name
    const newid = this.getId();
    const newn: Note = { id: newid, title: "new note", notebookid: this.currentNotebook.id, content: "", type: NoteType.Text, tags:[] };
    // save the note
    this.noteService.createNote(newn)
      .then(note => {
        this.notes.push(note);
        this.selectedNote = note;
        this.startEdition(note);
      })
      .catch(reason=>alert("cannot create note: "+JSON.stringify(reason)));
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
        .updateNote(note)
        .then(() => {
          this.notes = this.notes.filter(h => h !== note);
          if (this.selectedNote === note) { this.selectedNote = null; }
        });
  }
  findById(id: number): Note {
    let ns = this.notes.filter(n=>n.id=id);
    if (ns.length && ns.length>0) return ns[0];
    else return null;
  }
}

