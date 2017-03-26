export enum NoteType { Text, Bookmark, Password, File, Image }
export class Note {
  title: string; /* note title, not required */
  content: string; /* note content (html, md or basic?), required */
  type: NoteType; /* see enum above */
  tags: string[] = []; /* a list of tags for the note */
  notebookid: string; /* id of the containing notebook or null */
  modified: Date; /* date last modified */
  get id(): string { return this._id; }
  set id(id: string) { this.id = id; }
  private _id: string; /* id of the note, should be given by the data service */

  private _rev: string; /* revision number of the note */
  // setter for data.service only!
  set rev(rev: string) { this._rev = rev; }
  get rev(): string { return this._rev; }

  newId(): string {
    return '' + Date.now() + Math.ceil(Math.random() * 1000);
  }

  constructor(n: any) {
    this._id = (n['_id'] ? n['_id'] : this.newId());
    this.title = (n['title'] ? n['title'] : 'new note');
    this.content = (n['content'] ? n['content'] : '');
    this.tags = (n['tags'] ? (Array.isArray(n['tags']) ? n['tags'] : [n['tags']]) : []);
    this.notebookid = (n['notebookid'] ? n['notebookid'] : undefined);
    if (n['_rev']) { this._rev = n['_rev']; }
  }
}
