import { Component, ViewChild, OnInit, Output } from '@angular/core';
import { Router, ActivatedRoute, Params, UrlSegment } from '@angular/router';
import 'rxjs/add/operator/switchMap';
import { Observable } from 'rxjs/Observable';

import { Note } from '../note';
import { Notebook } from '../notebook/notebook';
import { NotebookTreeComponent } from '../notebook/notebook-tree/notebook-tree.component';
import { DataService } from '../services/data.service';

class KRoute  {
  route: string;
  notebook: Promise<Notebook>;
  note: Promise<Note>;
}

@Component({
  moduleId: module.id,
  selector: 'app-note-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  selectedNote: Note;
  selectedNotebook: Notebook;

  // inject the NotebookTreeComponent
  @ViewChild(NotebookTreeComponent)
  private notebookTree: NotebookTreeComponent;
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private noteService: DataService) { }

  ngOnInit(): void {
    const that = this;
    this.route.url
      .switchMap(
      (segments: UrlSegment[], index: number): Promise<KRoute> => {
        // index is the index of the segment which was modified, but we don't bother here...
        switch (segments[0].path) {
          // http://mysite/notes => show root note book
          case 'notes': return Promise.resolve({ route: 'notes', notebook: that.noteService.getRootNotebook(), note: null });
          // http://mysite/notebook/1234 => select notebook #1234
          case 'notebook': return Promise.resolve({ route: 'notebook', notebook: that.noteService.getNotebook(segments[1].path), note: null });
          // http://mysite/note/1234 => select note #1234
          case 'note': return Promise.resolve({ route: 'note', notebook: null, note: that.noteService.getNote(segments[1].path) });
          default: return Promise.reject('Unknown route: ' + segments[0].path);
        }  
      }).subscribe(kroute => {
        switch (kroute.route) {
          case 'notes':
          case 'notebook':
            kroute.notebook.then(nb => {
              this.selectedNote = null;
              this.selectNotebook(nb);
            });
            break;
          case 'note':
            kroute.note.then(n => {
              if (this.selectedNote !== n) {
                this.selectedNote = n;
                this.noteService.getNotebook(n.notebookid).then(nb => this.selectNotebook(nb));
              }
            });
            break;
          default: // do nothing
            break;
        }
      });
  }

  selectNotebook(nb: Notebook) {
    if (this.selectedNotebook !== nb) {
      this.selectedNotebook = nb;
      this.notebookTree.selectNotebook(nb);
    }
  }

  routeNote(n: Note) {
    this.router.navigate(['note', n.id]);
  }

  routeNotebook(nb: Notebook) {
    if (nb.id === Notebook.rootId) {
      this.router.navigate(['notes']);
    } else {
      this.router.navigate(['notebook', nb.id]);
    }
  }
}