import { INotebook } from './inotebook';

export class Notebook implements INotebook {
  static rootId = 'rootNotebook';
  parent: Notebook;
  name: string;
  children: Notebook[];

  get id(): string { return this._id; }
  set id(id: string) { this._id = id; }
  private _id: string;

  private _rev: string;
  // only for data.service
  set rev(rev: string) { this._rev = rev; }
  get rev(): string { return this._rev; }

  constructor(nb: Object) {
    if (nb) { this.updateFrom(nb); }
  }

  updateFrom(nb) {
    // name is mandatory
    this.name = '' + nb['name'];
    // use the given id or create one
    this._id = (nb['_id'] ? '' + nb['_id'] : this.getId());
    this.children = (nb['children'] ? nb['children'].map(c => {
      const newc = new Notebook(c);
      newc.parent = this;
      return newc;
    }, this) : []);
    if (nb['_rev']) { this._rev = nb['_rev']; }
    if (nb['parent']) {
      this.parent = new Notebook(nb['parent']);
    }
  }

  private getId(): string {
    return '' + Date.now() + Math.ceil(Math.random() * 1000);
  }

  findById(id: string): Notebook {
    if (this.id === id) {
      return this;
    } else if (this.children && this.children.length > 0) {
      return this.children.find(c => c.findById(id) != null);
//      for (let c of this.children) {
//        const r = c.findById(id);
//        if (r) { return r; }
//      }
    }
    return null;
  }

  fullName(): string {
    if (this.parent) {
      if (this.parent.parent) {
        return this.parent.fullName() + '/' + this.name;
      } else { return '/' + this.name; }
    } else { return '/'; }
  }

  toJSON(): string {
   return `{"_id": "${this._id}",  "name": "${this.name}",  ` +
      (this._rev ? `"_rev": "${this._rev}", ` : '') +
      `"children": [` +
        (Array.isArray(this.children) ? this.children.map(c => c.toJSON()).join(', ') : '') +
      ']}';
  }
}

