import { INotebook } from './inotebook';

export class Notebook implements INotebook {
	private _id: string;
	private _rev: string;
	static idPrefix : string = "nb@";
	parent: Notebook;
	get id(): string { return this._id; }
	set id(id: string) {
		this._id = id;
	}
	name: string;
	children: Notebook[]; 
	
	constructor(nb: Object) {
		if (nb) this.updateFrom(nb);
	}

	updateFrom (nb) {
		// name is mandatory
		this.name = ''+nb['name'];
		// use the given id or create one
		this._id = (nb['_id']?''+nb['_id']:this.getId());
		this.children = (nb['children'] ? nb['children'].map(function (c) { 
			let newc = new Notebook(c);
			newc.parent = this;
			return newc; 
		}, this) : []);
		if (nb['_rev']) this._rev = nb['_rev'];
		if (nb['parent'])
			this.parent = new Notebook(nb['parent']);		
	}
	// only for data.service
	updateRev(rev: string) {
		this._rev = rev;
	}

	private getId(): string {
	    return Notebook.idPrefix + Date.now() + Math.ceil(Math.random()*1000);
	}

	findById(id: string): Notebook {
		if (this.id == id) return this;
		else if (this.children && this.children.length>0) {
			for (let c of this.children) {
				let r = c.findById(id);
				if (r) return r;
			}
		}
		return null;
	}
	
	fullName(): string {
		if (this.parent)
			if (this.parent.parent) return this.parent.fullName()+ '/' + this.name;
			else return '/' + this.name;
		else return '/';
	}
	
	toJSON(): string {
		let first=true;
		let cts = `{"_id": "${this._id}",  "name": "${this.name}",  `;
		if (this._rev) cts += `"_rev": "${this._rev}", `;
		cts += `"children": [`;
		if (Array.isArray(this.children))
			this.children.forEach(function(c) {
				if (first) first = false;
				else cts += ", ";
				cts += c.toJSON();
			});
		cts += "]}";
		return cts;
	}
}

