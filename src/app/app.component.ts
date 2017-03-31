import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  moduleId: module.id,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'Knot Notes';
  menuValues = [
    { value: 'notes', label: 'All Notes' },
    { value: 'settings', label: 'Settings' }
  ];

  constructor(private router: Router) { }

  action(act: string) {
    this.router.navigate([act]);
  }
}

