import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import { Note } from '../note';
import { Notebook } from '../notebook/notebook';

@Injectable()
export class NoteService {

  private notebookUrl = 'api/notebook';  // URL to web api for notebooks
  private noteUrl = 'api/note';  // URL to web api for notes
  private headers = new Headers({ 'Content-Type': 'application/json' });

  constructor(private http: Http) { }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

  getRootNotebook(): Promise<Notebook> {
    return this.http.get(this.notebookUrl)
      .toPromise()
      .then(function(response) {
        return new Notebook(response.json().data[0]);
      })
      .catch(this.handleError);
  }

  updateRootNotebook(notebook: Notebook): Promise<Notebook> {
    const url = `${this.notebookUrl}/${notebook.id}`;
    return this.http
      .put(url, notebook, { headers: this.headers })
      .toPromise()
      .then(() => notebook)
      .catch(this.handleError);
  }

  getNotebook(notebookid: string): Promise<Notebook> {
    return this.getRootNotebook().then((root: Notebook) => root.findById(notebookid));
  }

  getNotebookNotes(notebookid: string): Promise<Note[]> {
    const url = `${this.noteUrl}?notebookid=${notebookid}`;
    return this.http.get(url)
      .toPromise()
      .then(response => <Note[]>(response.json().data))
      .catch(this.handleError);
  }

  getNote(id: number): Promise<Note> {
    const url = `${this.noteUrl}/${id}`;
    return this.http.get(url)
      .toPromise()
      .then(response => <Note>(response.json().data))
      .catch(this.handleError);
  }

  saveNote(note: Note): Promise<Note> {
    const url = `${this.noteUrl}/${note.id}`;
    return this.http
      .put(url, JSON.stringify(note), { headers: this.headers })
      .toPromise()
      .then(() => note)
      .catch(this.handleError);
  }

  /* use saveNote instead
  createNote(note: Note): Promise<Note> {
    return this.http
      .post(this.noteUrl, JSON.stringify(note), {headers: this.headers})
      .toPromise()
      .then(res => res.json().data)
      .catch(this.handleError);
  }*/

  deleteNote(id: number): Promise<void> {
    const url = `${this.noteUrl}/${id}`;
    return this.http.delete(url, { headers: this.headers })
      .toPromise()
      .then(() => null)
      .catch(this.handleError);
  }
}

