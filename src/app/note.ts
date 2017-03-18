export enum NoteType { Text, Bookmark, Password, File, Image }
export class Note {
  id: number; /* id of the note, should be given by the data service */
  title: string; /* note title, not required */
  content: string; /* note content (html, md or basic?), required */
  type: NoteType; /* see enum above */
  tags: string[] = []; /* a list of tags for the note */
  notebookid: string; /* id of the containing notebook or null */
  rev: string; /* revision number of the note */
  modified : Date; /* date last modified */

  getId(): number {
    return Date.now() + Math.ceil(Math.random()*1000);
  }

  constructor(n:any) {
  	this.id = (n['id']?n['id']:this.getId());
  	this.title = (n['title']? n['title']: "new note");
  	this.content = (n['content']? n['content']: "");
  	this.tags = (n['tags'] ? (Array.isArray(n['tags']) ? n['tags']: [n['tags']]) : []);
  	this.notebookid = (n['notebookid']? n['notebookid']: undefined);
  }
}
