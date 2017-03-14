import { INotebook } from './inotebook';

export class Notebook implements INotebook {
	parent: Notebook;
	id: number;
	name: string;
	children: Notebook[]; 
	constructor(nb: Object) {
		if (nb) {
			this.name = ''+nb['name'];
			this.id = (nb['id']?nb['id']:-1);
			this.children = (nb['children'] ? nb['children'].map(function (c) { 
				let newc = new Notebook(c);
				newc.parent = this;
				return newc; 
			  }, this) : []); 
		}
	}
	findById(id: number): Notebook {
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
		let cts = `{"id": ${this.id},  "name": "${this.name}",  "children": [`;
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

