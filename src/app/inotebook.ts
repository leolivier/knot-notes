export interface INotebook {
	id: string;
	name: string;
	children: INotebook[];
	findById(id: string): INotebook;
}
