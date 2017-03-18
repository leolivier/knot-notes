import { Component, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute, Params, UrlSegment } from '@angular/router';
import 'rxjs/add/operator/switchMap';
import { Observable } from 'rxjs/Observable';

import { Note } from '../note';
import { Notebook } from '../notebook';
import { NoteEditorComponent } from '../note-editor/note-editor.component';
import { NotebookShowComponent } from '../notebook/notebook-show/notebook-show.component';
//import { NoteService } from '../note.service';
import { DataService } from '../data.service';

@Component({
  moduleId: module.id,
  selector: 'app-note-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: [ './dashboard.component.css' ]
})
export class DashboardComponent implements OnInit {

  selectedNote: Note;
  selectedNotebook: Notebook;
  editMode: boolean;

// inject the NoteEditorComponent
  @ViewChild(NoteEditorComponent)
  private noteEditor: NoteEditorComponent;
// inject the NoteBookShowComponent
  @ViewChild(NotebookShowComponent)
  private notebookShow: NotebookShowComponent;

  constructor(
    private route: ActivatedRoute,
//    private noteService: NoteService) {}
    private noteService: DataService) {}
  
  ngOnInit(): void {
    let that = this;
    this.route.url
      .switchMap(
        (segments: UrlSegment[], index: number): Promise<Note|Notebook>|undefined[] =>
          (segments[index].path=="note"? that.noteService.getNote(that.route.params['id']) : 
            (segments[index].path=="notebook"? that.noteService.getNotebook(that.route.params['id']) : 
              [])))
      .subscribe(obj=>this.urlChanged(obj));
  }

  urlChanged(obj: Note|Notebook|undefined[]): void {
    if (obj instanceof Note) this.noteEditor.note = obj;
    else if (obj instanceof Notebook) this.notebookShow.currentNotebook = obj;
  }
}

