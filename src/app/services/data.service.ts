import { Injectable, NgZone } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';

// import 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

import { Note } from '../note';
import { Notebook } from '../notebook/notebook';
import { Settings, knot_notes_dbname, RemoteDBSettings } from '../admin/settings';
import { StatusEmitter } from '../status-bar/status';

// import { PouchDB } from 'pouchdb';
//const PouchDB = require('pouchdb');

import * as PouchDB from 'pouchdb';  
import * as PouchDBFind from 'pouchdb-find';

@Injectable()
export class DataService {

  private settings: Settings;
  private db: any;
  private remote: string;

  rootNotebook: Notebook;
  notes: Note[];

  constructor(
    private _http: Http,
    private alerter: StatusEmitter) {

    PouchDB.plugin(PouchDBFind);
    // create/open local database
    this.db = new PouchDB(knot_notes_dbname);
  //  PouchDB.plugin(require('pouchdb-find'));
    window['PouchDB'] = PouchDB; // for debugging purpose

    this.loadSettings()
      .then(() => this.trySyncToRemote())
      .catch((err) => this.handleError(err));

    this.db.setMaxListeners(30);
    // set up changes callback
    this.db.changes({ live: true, since: 'now', include_docs: true })
      .on('change', (change) => { this.handleChange(change); })
      .on('error', err => this.handleError(err));

    this.getRootNotebook();
  }

  private handleError(error: any, reject?) {
    this.alerter.error('An error occurred: ' + error);
    console.error('An error occurred', error);
    if (reject) reject(error.message || error);
  }

  trySyncToRemote() {
    const that = this;
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

      this.db.sync(this.remote, options)
        .on('error', err => that.handleError(err))
        .on('change', info => this.handleChange(info))
  // replication paused (e.g. replication up to date, user went offline)
        .on('paused', err => this.alerter.warning(err))
  // replicate resumed (e.g. new changes replicating, user went back online)
        .on('active', () => this.alerter.info('Sync active'))
  // a document failed to replicate (e.g. due to permissions)
        .on('denied', err => this.handleError(err))
  // handle complete
        .on('complete', info => this.alerter.info('Sync complete: ' + info));
    }
  }

  loadSettings(force = false): Promise<Settings> {
    if (this.settings && !force) {
      return new Promise (resolve => resolve(this.settings));
    }
    const that = this;
    return new Promise((resolve, reject) => {
      that.db.get('settings').then(doc => {
        that.settings = doc as Settings;
        if (!that.settings.remoteDBSettings) { that.settings.remoteDBSettings = new RemoteDBSettings(); }
        resolve(that.settings);
      }).catch (err => {
        if (err.name === 'not_found') {
          that.settings = new Settings(); // default empty settings
        } else {
          that.handleError(err, reject);
        }
      });
    });
  }

  saveSettings(settings?: Settings): Promise<Settings> {
    const that = this;
    if (settings) { that.settings = settings; }
    const o = JSON.parse(JSON.stringify(that.settings));
    return new Promise((resolve, reject) => {
      that.db.put(o).then(response => {
        if (response && response.ok) {
        // be sure to refresh rev number
          that.settings.rev = response.rev;
          resolve(that.settings);
          that.trySyncToRemote();
        }
      }).catch(error => that.handleError(error, reject))
    });
  }

  handleChange(change) {
    if (change.id === 'settings') {
      this.settings = (change.deleted ? /* reset settings */ new Settings() : change.doc as Settings);
      return;
    }

    if (this.rootNotebook && this.rootNotebook.id === change.id) {
      if (change.deleted) {
        this.alerter.error('root notebook deleted!!!');
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
          this.notes = [];
        }
        this.notes.push(new Note(change.doc));
      }
    }
  }

  getRootNotebook(): Promise<Notebook> {
    const that = this;
//    if (this.rootNotebook) { return Promise.resolve(this.rootNotebook); } must reread if changed by someone else
    return new Promise((resolve, reject) => {
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
          that.handleError(error, reject);
        }
      });
    });
  }

  saveRootNotebook(root: Notebook): Promise<Notebook> {
    const that = this;
    this.rootNotebook = root;
    const o = JSON.parse(root.toJSON());
    return new Promise((resolve, reject) => {
      this.db.put(o).then(response => {
        if (response && response.ok) {
          // be sure to refresh rev number
          root.rev = response.rev;
          resolve(root);
        }
      }).catch(error => that.handleError(error, reject))
     });
  }

  getNotebook(notebookid: string): Promise<Notebook> {
    const that = this;
    if (this.rootNotebook) {
      const nb = that.rootNotebook.findById(notebookid);
      return (nb? Promise.resolve(nb) : Promise.reject('Notebook #' + notebookid + ' not found'));
    }
    return this.getRootNotebook().then(nb => nb.findById(notebookid));
  }

  getNotebookNotes(notebookid: string): Promise<Note[]> {
    const that = this;
    return new Promise((resolve, reject) => {
      that.db.createIndex({
        // index: {fields: ['notebookid', 'order']}
        // index: {fields: ['order', 'notebookid']}
        index: {fields: ['notebookid']}
      }).then(function () {
        that.db.find ({
          selector: {
            $and: [
              {notebookid: {$exists: true}},
              {notebookid: {$eq: notebookid}},
          //    {order: {$exists: true}}
             ]},
        //  sort: [{'order': 'desc'}]
        }).then (result => {
          that.notes = [];
          result.docs.map((doc) => { that.notes.push(new Note(doc)); });
          that.notes.sort((n1, n2) => n1.order - n2.order);
          // that.notes.reverse();
          resolve(that.notes);
        }).catch((error) => that.handleError(error, reject));
      });
    });
  }

  getNote(id: string): Promise<Note> {
    const that = this;
    const n = that.notes.find(nt => nt.id === id);
    if (n) { return Promise.resolve(n); }
    return new Promise((resolve, reject) => {
      that.db.get(id).then(doc => {
        doc.id = doc._id;
        const nt = new Note(doc);
        that.notes.push(nt);
        resolve(nt);
        if (!that.rootNotebook) { // load root notebook if not already done
          that.getRootNotebook().then(() => that.getNotebookNotes(nt.notebookid)); // load notebook if not already done
        }
      });
    });
  }

  saveNote(note: Note): Promise<Note> {
    const that = this;
    const o = JSON.parse(JSON.stringify(note));
    o['modified'] = new Date().getTime();
    return new Promise((resolve, reject) => {
      that.db.put(o).then(response => {
        if (response && response.ok) {
          // be sure to refresh rev number
          note.rev = response.rev;
          resolve(note);
          that.alerter.info("Note saved");
        }
      }).catch(error => that.handleError(error, reject))
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

  deleteNote(id: string): Promise<any> {
    const that = this;
    return new Promise((resolve, reject) => {
      that.db.get(id).then(doc => {
        that.db.remove(doc).then(() => resolve())
          .catch(err => that.handleError(err, reject))
      }).catch(error => that.handleError(error, reject))
    });
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
}