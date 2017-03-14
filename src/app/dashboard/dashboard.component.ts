import { Component, ViewChild } from '@angular/core';

import { Note } from '../note';
import { Notebook } from '../notebook';
import { NoteEditorComponent } from '../note-editor/note-editor.component';
import { NotebookShowComponent } from '../notebook/notebook-show/notebook-show.component';

@Component({
  moduleId: module.id,
  selector: 'app-note-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: [ './dashboard.component.css' ]
})
export class DashboardComponent {

  selectedNote: Note;
  selectedNotebook: Notebook;
  editMode: boolean;

// inject the NoteEditorComponent
  @ViewChild(NoteEditorComponent)
  private noteEditor: NoteEditorComponent;
// inject the NoteBookShowComponent
  @ViewChild(NotebookShowComponent)
  private notebookShow: NotebookShowComponent;
}

