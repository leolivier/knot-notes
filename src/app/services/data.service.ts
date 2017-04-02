import { Injectable, NgZone } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';

// import 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

import { Note } from '../note';
import { Notebook } from '../notebook/notebook';
import { Settings, knot_notes_dbname, RemoteDBSettings } from '../admin/settings';

const PouchDB = require('pouchdb');

@Injectable()
export class DataService {

  private settings: Settings;
  private db: any;
  private remote: string;

  rootNotebook: Notebook;
  notes: Note[];

  constructor(private _http: Http) {

    // create/open local database
    this.db = new PouchDB(knot_notes_dbname);
    PouchDB.plugin(require('pouchdb-find'));

    window['PouchDB'] = PouchDB; // for debugging purpose

    this.loadSettings()
      .then(() => this.trySyncToRemote())
      .catch((err) => this.handleError(err));

    this.db.setMaxListeners(30);
    // set up changes callback
    this.db.changes({ live: true, since: 'now', include_docs: true })
      .on('change', (change) => { this.handleChange(change); });
  }

  trySyncToRemote() {
    if (this.settings && this.settings.useRemoteDB) {
      // check remote settings
      const rs = this.settings.remoteDBSettings;
      if (!rs || !rs.baseUrl || !rs.username || !rs.password) { return; }
      this.remote = rs.baseUrl + '/' + knot_notes_dbname;
      // remote db options
      const options = {
        live: true,
        retry: true,
        continuous: true,
        auth: {
          username:  this.settings.remoteDBSettings.username,
          password: this.settings.remoteDBSettings.password
        }
      };

      this.db.sync(this.remote, options).on('error', err => this.handleError(err));
    }
  }

  loadSettings(force = false): Promise<Settings> {
    if (this.settings && !force) {
      return new Promise (resolve => resolve(this.settings));
    }
    const that = this;
    return new Promise(resolve => {
      that.db.get('settings').then(doc => {
        that.settings = doc as Settings;
        if (!that.settings.remoteDBSettings) { that.settings.remoteDBSettings = new RemoteDBSettings(); }
        resolve(that.settings);
      }).catch (err => {
        that.settings = new Settings(); // default empty settings
        that.handleError(err);
      });
    });
  }

  saveSettings(settings?: Settings): Promise<Settings> {
    const that = this;
    if (settings) { that.settings = settings; }
    const o = JSON.parse(JSON.stringify(that.settings));
    return new Promise(resolve => {
      that.db.put(o, function(error, response) {
        if (error) { that.handleError(error); }
        if (response && response.ok) {
          // be sure to refresh rev number
          that.settings.rev = response.rev;
          resolve(that.settings);
          that.trySyncToRemote();
        }
      });
    });
  }

  handleChange(change) {
    if (change.id === 'settings') {
      this.settings = (change.deleted ? /* reset settings */ new Settings() : change.doc as Settings);
      return;
    }

    if (this.rootNotebook && this.rootNotebook.id === change.id) {
      if (change.deleted) {
        alert('root notebook deleted!!!');
      } else if (this.rootNotebook.rev !== change.doc._rev) { // do nothing if same rev
        this.rootNotebook.updateFrom(change.doc);
      }
    } else {
      let changedNote = null;
      let changedIndex = null;

     if (this.notes && Array.isArray(this.notes)) {
       this.notes.forEach((note, index) => {
         if (note.id === change.id) {
           changedNote = note;
           changedIndex = index;
         }
        });
      }
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
        if (!this.notes) {
          this.notes[0] = new Note(change.doc);
        } else {
          this.notes.push(new Note(change.doc));
        }
      }
    }
  }

  private handleError(error: any): Promise<any> {
    // TODO: manage error correctly
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }

  getRootNotebook(): Promise<Notebook> {
    const that = this;
    return new Promise(resolve => {
      that.db.get(Notebook.rootId).then(doc => {
        if (that.rootNotebook) {
          that.rootNotebook.updateFrom(doc);
        } else {
          that.rootNotebook = new Notebook(doc);
        }
        resolve(that.rootNotebook);
      }).catch((error) => {
        if (error.name === 'not_found') {
          // initial root notebook
          that.saveRootNotebook(new Notebook({_id: Notebook.rootId, name: '/'}));
        } else {
          that.handleError(error);
        }
      });
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
      /*
      that.db.query((doc, emit) => {
        if (doc.notebookid && doc.notebookid === notebookid) { emit(doc); }
      },
        {
          include_docs: true,
          limit: 60,
          descending: true,
        }).then((result) => {
          that.notes = [];
          const docs = result.rows.map((row) => { that.notes.push(new Note(row.doc)); });
          that.notes.reverse();
          resolve(that.notes);
        }).catch((error) => that.handleError(error));
    */
      that.db.createIndex({
        // index: {fields: ['order', 'notebookid']}
        index: {fields: ['notebookid']}
      }).then(function () {
        that.db.find ({
          selector: {
            $and: [
              {notebookid: {$exists: true}},
              {notebookid: {$eq: notebookid}}
             ]},
//          sort: [{'order': 'desc'}]
        }).then (result => {
          that.notes = [];
          result.docs.map((doc) => { that.notes.push(new Note(doc)); });
          that.notes.sort((n1, n2) => n1.order - n2.order);
          // that.notes.reverse();
          resolve(that.notes);
        }).catch((error) => that.handleError(error));
      });
    });
  }

  getNote(id: string): Promise<Note> {
    const that = this;
    const n = that.notes.find(nt => nt.id === id);
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
      that.db.put(o, function(error, response) {
        if (error) { that.handleError(error); }
        if (response && response.ok) {
          // be sure to refresh rev number
          note.rev = response.rev;
          resolve(note);
        }
      });
    });
    // TODO: manage attachments and images
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
    return that.db.get(+id, function(error, doc) {
      that.db.remove(doc, function(err, resp) {
        return (err ? that.handleError(err) : new Promise(resolve => resolve()));
      });
    });
  }
}

/*
      that.db.allDocs({
        include_docs: true,
        limit: 30,
        // startkey: Notebook.idPrefix,
        // endkey: Notebook.idPrefix+'\uffff',
        descending: true
      }).then((result) => {
        if (result.rows.length === 0) {
          // initial root notebook
          that.saveRootNotebook(new Notebook('/'));
        } else {
          const doc = result.rows[0].doc;
          if (that.rootNotebook) {
            that.rootNotebook.updateFrom(doc);
          } else {
            that.rootNotebook = new Notebook(doc);
          }
        }
 */