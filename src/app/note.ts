export enum NoteType { Text, Bookmark, Password, File, Image }
export class Note {
  id: number; /* id of the note, should be given by couchdb */
  title: string; /* note title, not required */
  content: string; /* note content (html, md or basic?), required */
  type: NoteType; /* see enum above */
  tags: string[] = []; /* a list of tags for the note */
  notebookid: number; /* id of the containing notebook or null */
}
