export interface INotebook {
	id: number;
	name: string;
	children: INotebook[];
	findById(id: number): INotebook;
}
