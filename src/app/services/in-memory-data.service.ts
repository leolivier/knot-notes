import { Observable } from 'rxjs/Observable';
import { Response } from '@angular/http';
// import { InMemoryDbService } from 'angular-in-memory-web-api';
//export class InMemoryDataService implements InMemoryDbService {
export class InMemoryDataService {
  createDb() {
    const notebook = [{
      id: 1,
      name: '/',
      children: [
        {
          id: 2,
          name: 'lists',
          children: [
            { id: 3, name: 'gifts' },
          ]
        },
        { id: 6, name: 'holidays' },
        {
          id: 7,
          name: 'work',
          children: [
            { id: 8, name: 'contacts'  },
            { id: 9, name: 'meetings' },
            { id: 10, name: 'ideas' },
            { id: 11, name: 'tests' }
          ]
        }
      ]
    }];
    const note = [
      {
        id: 1,
        title: 'gifts for mum',
        content: 'list of gifts for mum:\n*gift1\n*gift2\n',
        type: 0,
        tags: ['gifts', 'mum'],
        notebookid: 3
      },
      {
        id: 2,
        title: 'books',
        content: 'list of books to read:\n*book 1\n*book 2\n',
        type: 0,
        tags: ['books'],
        notebookid: 2
      },
      {
        id: 3,
        title: 'movies',
        content: 'list of movies to watch:\n*movie 1\n*movie 2\n',
        type: 0,
        tags: ['movies'],
        notebookid: 2
      },
      {
        id: 4,
        title: '2016',
        content: 'holidays in 2016:\n*trip #1\n*trip #2\n',
        type: 0,
        tags: ['trips'],
        notebookid: 6
      }
    ];

    return { 'notebook': notebook, 'note': note };
  }
}
