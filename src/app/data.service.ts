import { Injectable, NgZone } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

import { Note } from './note';
import { Notebook } from './notebook';

var PouchDB = require('pouchdb');

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
    let options = {
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
  this.db.changes({live: true, since: 'now', include_docs: true})
    .on('change', (change) => { this.handleChange(change); });
  }

  initCall() {
    // make sure UI is initialised
    // correctly after sync.
    this.zone.run(() => {});
  }
 
  handleChange(change){
    if (this.rootNotebook && this.rootNotebook === change.id) {
      if (change.deleted) alert ("root notebook deleted!!!");
      else {
        this.rootNotebook = new Notebook(change.doc);
      }
    } else {
      let changedNote = null;
      let changedIndex = null;
 
      this.notes.forEach((note, index) => {
        if(note.id === change.id){
          changedNote = note;
          changedIndex = index;
        }
      });
       //A note was deleted
      if(change.deleted) this.notes.splice(changedIndex, 1);
      else {
        //A note was updated
        if(changedNote) this.notes[changedIndex] = new Note(change.doc);
        //A note was added
        else this.notes.push(new Note(change.doc));                
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
        //startkey: Notebook.idPrefix,
        //endkey: Notebook.idPrefix+'\uffff',
        descending: true
      }).then((result) => {
        if (result.rows.length==0) {
          // initial root notebook
          this.saveRootNotebook(new Notebook("/"));
        } else {
          let doc = result.rows[0].doc;
          if (this.rootNotebook) this.rootNotebook.updateFrom(doc);
          else this.rootNotebook = new Notebook(doc);
        }
        resolve(this.rootNotebook);
      }).catch((error) => this.handleError(error)); 
     });
  }
  
  saveRootNotebook(root: Notebook): Promise<Notebook> {
    let that = this;
    this.rootNotebook = root;
    var o = JSON.parse(root.toJSON());
    return new Promise(resolve=> {
      this.db.put(o, function (error, response) {
        if(error) that.handleError(error);
        if(response && response.ok) {
          root.updateRev(response.rev);
          resolve(root);
        }
      });
    }); // be sure to refresh rev number
  }

  getNotebook(notebookid: string): Promise<Notebook> {
    let that = this;
    if (this.rootNotebook) return new Promise(resolve=> resolve(that.rootNotebook.findById(notebookid)));
    return this.getRootNotebook().then(nb=>nb.findById(notebookid));
  }

  getNotebookNotes(notebookid: string): Promise<Note[]> {
    let that = this;
//    if (this.rootNotebook) return new Promise(resolve=> resolve(that.notes.filter(n=>n.notebookid==notebookid)));
//    return new Promise(resolve=>that.initService().then(()=>that.notes.find(n=>n.notebookid==notebookid)));
    return new Promise(resolve => {
      that.db.query((doc, emit) => {
        if (doc.notebookid && doc.notebookid===notebookid) emit(doc);
      },
      {
        include_docs: true,
        limit: 60,
        descending: true,
      }).then((result) => {
        this.notes = [];
        let docs = result.rows.map((row) => { this.notes.push(new Note(row.doc)); });
        this.notes.reverse();
        resolve(this.notes);
      }).catch((error) => that.handleError(error)); 
    });
  }

  getNote(id: number): Promise<Note> {
    let that = this;
    let n = this.notes.find(n=>n.id===id);
    if (n) return new Promise(resolve=> resolve(n));
    return new Promise(resolve=>{
      that.db.get(id).then(doc=>{
        doc.id = doc._id;
        let n = new Note(doc);
        that.notes.push(n);
        resolve(n);
        if (!that.rootNotebook) {
          that.getRootNotebook().then(()=>that.getNotebookNotes(n.notebookid));
        }
      })
    });
  }

  saveNote(note: Note): Promise<Note> {
    let that = this;
    var o = {};
    o['_id'] = note.id;
    o['_rev'] = (note.rev? note.rev + 1: 0);
    o['title'] = note.title;
    o['content'] = note.content;
    o['notebookid'] = note.notebookid;
    o['type'] = note.type;
    o['tags'] = note.tags;
    o['modified']  = new Date().getTime();
    
    return this.db.put(o, function (error, response) {
        if(error) return that.handleError(error);
        if(response && response.ok){             
          return new Promise(resolve=>resolve(note));        
/*         if(noteform.attachment.files.length){
        var reader = new FileReader();
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
    });
  }

  deleteNote(id: number): Promise<void> {
    let that = this;
    /* IDs must be a string */
    return this.db.get(+id, function (error, doc) {
      that.db.remove(doc, function (err, resp) {  
          if(err) return that.handleError(err);
          else return new Promise(resolve=>resolve());            
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