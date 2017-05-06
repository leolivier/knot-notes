import { Injectable } from '@angular/core';

import { Note } from '../note';
import { Notebook } from '../notebook/notebook';
import { StatusEmitter } from '../status-bar/status';
import { SettingsService } from '../services/settings.service';
import * as PouchDB from 'pouchdb';  
import * as PouchDBFind from 'pouchdb-find';
import { Settings, knot_notes_dbname, settings_id } from '../admin/settings';

@Injectable()
export class DataService {

  private db: any;
  private remote: string;
  private sync;

  rootNotebook: Notebook;
  notes: Note[];

  constructor(
    private settingsService: SettingsService,
    private alerter: StatusEmitter
  ) {
    PouchDB.plugin(PouchDBFind);
    this.initDB();
  }

  private initDB() {
    // create/open local database
    this.db = new PouchDB(knot_notes_dbname);
    window['PouchDB'] = PouchDB; // for debugging purpose
    this.db.setMaxListeners(30);
    // set up changes callback
    this.db.changes({ live: true, since: 'now', include_docs: true })
      .on('change', (change) => { this.handleChange(change); })
      .on('error', err => this.handleError(err));
    const that = this;
    this.db.info().then(res => {
      console.log(that.db);
      console.log(res);
      if (res.update_seq === 0) { // new database => create initial root notebook
        that.rootNotebook = new Notebook({_id: Notebook.rootId, name: '/'});
        that.settingsService.loadSettings(that.db, true);
        that.saveRootNotebook(that.rootNotebook).catch(err => that.handleError(err));
      } else {
        that.db.compact();
        that.settingsService.loadSettings(that.db, true)
          .then(settings => that.trySyncToRemote(settings))
          .catch(err => that.handleError(err));
        that.getRootNotebook();
      }
    });
  }

  private handleError(error: any, reject?) {
    this.alerter.error('An error occurred: ' + error);
    console.error('An error occurred', error);
    if (reject) reject(error.message || error);
  }

  trySyncToRemote(settings: Settings) {
    const that = this;
    if (settings.useRemoteDB) {
      // check remote settings
      const rs = settings.remoteDBSettings;
      if (!rs || !rs.baseUrl || !rs.username || !rs.password) { return; }
      this.remote = rs.baseUrl + '/' + knot_notes_dbname;
      // remote db options
      const options = {
        live: true,
        retry: true,
        continuous: true,
        filter: function (doc) {
          return doc._id !== settings_id;
        },
        auth: {
          username: settings.remoteDBSettings.username,
          password: settings.remoteDBSettings.password
        }
      };

      this.sync = this.db.sync(this.remote, options)
        .on('error', err => that.alerter.syncState('error: ' + err))
        .on('change', info => this.handleChange(info))
  // replication paused (e.g. replication up to date, user went offline)
        .on('paused', err => this.alerter.syncState('paused'))
  // replicate resumed (e.g. new changes replicating, user went back online)
        .on('active', () => this.alerter.syncState('active'))
  // a document failed to replicate (e.g. due to permissions)
        .on('denied', err => this.alerter.syncState('access denied'))
  // handle complete
        .on('complete', info => this.alerter.syncState('complete: ' + info));
    }
  }

  stopSyncing() {
    if (this.sync) { this.sync.cancel(); }
  }

  handleChange(change) {
    if (change.id === settings_id) {
      this.settingsService.handleChange(change);
    } else if (this.rootNotebook && this.rootNotebook.id === change.id) {
      if (change.deleted) {
        this.alerter.error('Root notebook deleted!!!');
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

  private _getRootNotebook(resolve, reject) {
    const that = this;
    if (this.rootNotebook) { resolve(this.rootNotebook); } 
    
    that.db.get(Notebook.rootId).then(doc => {
      if (that.rootNotebook) {
        that.rootNotebook.updateFrom(doc);
      } else {
        that.rootNotebook = new Notebook(doc);
      }
      resolve(that.rootNotebook);
    }).catch((error) => {
      if (error.reason === 'missing') {
        setTimeout(() => {
          // retry later
          that._getRootNotebook(resolve, reject);
        }, 150);
      } else {
        that.handleError(error, reject);
      }
    });    
  }  

  getRootNotebook(): Promise<Notebook> {
    const that = this;
    if (this.rootNotebook) { return Promise.resolve(this.rootNotebook); } 
    return new Promise((resolve, reject) => {
      that._getRootNotebook(resolve, reject);
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
    return new Promise((resolve, reject) => {
      this.getRootNotebook().then(rnb => {
        const nb = that.rootNotebook.findById(notebookid);
        if (nb) resolve(nb); else reject('Notebook #' + notebookid + ' not found');
      }).catch(err => this.handleError("root book not found: " + err))
    });
  }

  getNotebookNotes(notebookid: string): Promise<Note[]> {
    const that = this;
    return new Promise((resolve, reject) => {
      this.getNotebook(notebookid).then(nb => {  // ensure root note book loaded first and note book id exists
        that.db.createIndex({
          index: {fields: ['notebookid']}
        }).then(function () {
          that.db.find ({
            selector: {
              $and: [
                {notebookid: {$exists: true}},
                {notebookid: {$eq: notebookid}},
                {order: {$gt: true}}
              ]},
//            sort: [{'order': 'desc'}]
          }).then (result => {
            that.notes = [];  // reset notes
            that.notes.sort((a, b) => a.order - b.order);
            result.docs.map((doc) => { that.notes.push(new Note(doc)); });
            resolve(that.notes);
          }).catch((error) => that.handleError("cannot load notebook '" + nb.name + "' notes: " + error, reject));
        });
      }).catch(err => this.handleError(err, reject));
    });
  }

  getNote(id: string): Promise<Note> {
    const that = this;
     // try to find in already loaded notes
    if (this.notes)  {
      const n = that.notes.find(nt => nt.id === id);
      if (n) { return Promise.resolve(n); }
    }
    // if not found, try to get it from database
    return new Promise((resolve, reject) => {
      that.db.get(id).then(doc => {
        doc.id = doc._id;
        const nt = new Note(doc);
        if (!that.notes) that.notes = [];
        that.notes.push(nt);
        resolve(nt);
        that.getNotebookNotes(nt.notebookid); // load full notebook if not already done
      }).catch(err => that.handleError(err, reject)); // note not found probably
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
  
  destroydb() {
    this.db.destroy().then(() => {
      this.alerter.warning("Local database destroyed...");
 //     this.initDB();
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
