import { Injectable, NgZone } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

import { Note } from './note';
import { Notebook } from './notebook';

const PouchDB = require('pouchdb');

@Injectable()
export class DataService {

  private db: any;
  private username: string;
  private password: string;
  private remote: string;
  //  private data: any = [];
  //  private results: any;
  //  private api: any;

  rootNotebook: Notebook;
  notes: Note[];

  constructor(private _http: Http, private zone: NgZone) {

    // database name
    this.db = new PouchDB('knot-note');

    window['PouchDB'] = PouchDB; // for debugging purpose

    // couchdb login details
    this.username = '<your_user_name_here>';
    this.password = '<your_password_here>';

    // cloudant, couchdb, couchbase remote url
    // eg - https://<your_host>.cloudant.com/todo
    this.remote = 'http://rasbpberrypi:5984/knot-note';

    // cloudant, couchdb, couchbase remote url
    // applicable when username/password set.
    const options = {
      live: true,
      retry: true,
      continuous: true,
      auth: {
        username: this.username,
        password: this.password
      }
    };

    //    this.db.sync(this.remote, options);
    this.db.setMaxListeners(30);
    // set up changes callback
    this.db.changes({ live: true, since: 'now', include_docs: true })
      .on('change', (change) => { this.handleChange(change); });
  }

  initCall() {
    // make sure UI is initialised
    // correctly after sync.
    this.zone.run(() => { });
  }

  handleChange(change) {
    if (this.rootNotebook && this.rootNotebook.id === change.id) {
      if (change.deleted) {
        alert('root notebook deleted!!!');
      } else if (this.rootNotebook.rev !== change.doc._rev) { // do nothing if same rev
        this.rootNotebook.updateFrom(change.doc);
      }
    } else {
      let changedNote = null;
      let changedIndex = null;

      this.notes.forEach((note, index) => {
        if (note.id === change.id) {
          changedNote = note;
          changedIndex = index;
        }
      });
      if (changedNote) {
        if (change.deleted) { // A note was deleted
          this.notes.splice(changedIndex, 1);
        } else {
          // A note was updated
          if (changedNote.rev !== change.doc._rev) { // do nothing if same rev, it's a local change
            this.notes[changedIndex] = new Note(change.doc);
          }
        }
      } else if (!change.deleted) { // else unknown note deleted 
        // A note was added
        this.notes.push(new Note(change.doc));
      }
    }
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

  getRootNotebook(): Promise<Notebook> {
    return new Promise(resolve => {
      this.db.allDocs({
        include_docs: true,
        limit: 30,
        // startkey: Notebook.idPrefix,
        // endkey: Notebook.idPrefix+'\uffff',
        descending: true
      }).then((result) => {
        if (result.rows.length === 0) {
          // initial root notebook
          this.saveRootNotebook(new Notebook('/'));
        } else {
          const doc = result.rows[0].doc;
          if (this.rootNotebook) {
            this.rootNotebook.updateFrom(doc);
          } else {
            this.rootNotebook = new Notebook(doc);
          }
        }
        resolve(this.rootNotebook);
      }).catch((error) => this.handleError(error));
    });
  }

  saveRootNotebook(root: Notebook): Promise<Notebook> {
    const that = this;
    this.rootNotebook = root;
    const o = JSON.parse(root.toJSON());
    return new Promise(resolve => {
      this.db.put(o, function(error, response) {
        if (error) { that.handleError(error); }
        if (response && response.ok) {
          // be sure to refresh rev number
          root.rev = response.rev;
          resolve(root);
        }
      });
    });
  }

  getNotebook(notebookid: string): Promise<Notebook> {
    const that = this;
    if (this.rootNotebook) {
      return new Promise(resolve => resolve(that.rootNotebook.findById(notebookid)));
    }
    return this.getRootNotebook().then(nb => nb.findById(notebookid));
  }

  getNotebookNotes(notebookid: string): Promise<Note[]> {
    const that = this;
    return new Promise(resolve => {
      that.db.query((doc, emit) => {
        if (doc.notebookid && doc.notebookid === notebookid) { emit(doc); }
      },
        {
          include_docs: true,
          limit: 60,
          descending: true,
        }).then((result) => {
          this.notes = [];
          const docs = result.rows.map((row) => { this.notes.push(new Note(row.doc)); });
          this.notes.reverse();
          resolve(this.notes);
        }).catch((error) => that.handleError(error));
    });
  }

  getNote(id: string): Promise<Note> {
    const that = this;
    const n = this.notes.find(nt => nt.id === id);
    if (n) { return new Promise(resolve => resolve(n)); }
    return new Promise(resolve => {
      that.db.get(id).then(doc => {
        doc.id = doc._id;
        const nt = new Note(doc);
        that.notes.push(nt);
        resolve(nt);
        if (!that.rootNotebook) {
          that.getRootNotebook().then(() => that.getNotebookNotes(nt.notebookid));
        }
      });
    });
  }

  saveNote(note: Note): Promise<Note> {
    const that = this;
    const o = JSON.parse(JSON.stringify(note));
    o['modified'] = new Date().getTime();
    return new Promise(resolve => {
      this.db.put(o, function(error, response) {
        if (error) { that.handleError(error); }
        if (response && response.ok) {
          // be sure to refresh rev number
          note.rev = response.rev;
          resolve(note);
        }
      });
    });
    /*         if(noteform.attachment.files.length){
            const reader = new FileReader();
            // Using a closure so  we can extract the File's data in the function.
            reader.onload = (function(file){
              return function(e) {
                var pos = e.target.result.search(',');
                var content= e.target.result.slice(pos+1);
                //var mimetype= e.target.result.slice(0, pos);
                //pos = mimetype.search(';');
                //mimetype = mimetype.slice(0, pos);
                //pos = mimetype.search(':');
                //mimetype = mimetype.slice(pos+1);
                pdb.putAttachment(response.id, file.name, response.rev, content, file.type).then(function (result) {
                  showerror(["Attachment saved"]);
                }).catch(function (err) {
                  console.log(err);
                });
              }
            })(noteform.attachment.files.item(0));
    
            reader.readAsDataURL(noteform.attachment.files.item(0));
          } */
  }

  deleteNote(id: string): Promise<void> {
    const that = this;
    /* IDs must be a string */
    return this.db.get(+id, function(error, doc) {
      that.db.remove(doc, function(err, resp) {
        return (err ? that.handleError(err) : new Promise(resolve => resolve()));
      });
    });
  }

  // NOTE: Another way to retrieve data via a REST call
  /* getUrl() {
      let headers = new Headers();
      headers.append("Authorization", "Basic " + btoa(this.username + ":" + this.password));
      headers.append("Content-Type", "application/x-www-form-urlencoded");

      this.api = this.remote + '/_all_docs?include_docs=true';

      return new Promise(resolve => {
        this._http.get(this.api, {headers: headers})
                .map(res => res.json())
              .subscribe(data => {
                this.results = data;

                this.data = [];

                let docs = this.results.rows.map((row) => {
                  this.data.push(row.doc);
                });

                resolve(this.data);

                this.db.changes({live: true, since: 'now', include_docs: true}).on('change', (change) => {
                    this.handleChange(change);
                });

              });
      });

  }

  getDocuments() {
    return new Promise(resolve => {
      this.db.allDocs({
        include_docs: true,
        limit: 30,
        descending: true
      }).then((result) => {
        this.data = [];
        let docs = result.rows.map((row) => { this.data.push(row.doc); });
        this.data.reverse();
        resolve(this.data);
        this.db.changes({live: true, since: 'now', include_docs:
          true}).on('change', (change) => {
              this.handleChange(change);
        });
      }).catch((error) => { console.log(error); });
     });
  }

  private initService (): Promise<any> {
    let that = this;
    return this.getDocuments().then (function () {
      that.rootNotebook = that.data.find(d=>d['id'].startsWith(Notebook.idPrefix)) as Notebook;
      if (!that.rootNotebook) that.rootNotebook = new Notebook("/"); // initial root notebook
      that.notes = that.data.filter(d=>!d['id'].startsWith(Notebook.idPrefix)) as Note[];
      return new Promise(resolve=>resolve(that));
    })
    .catch(reason=>alert("Get Root Notebook Error: " + reason.toString()));
  }

*/
}
