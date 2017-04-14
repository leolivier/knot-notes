import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Status } from './status-bar/status';

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

  status: Status;

  constructor(private router: Router) { }

  action(act: string) {
    this.router.navigate([act]);
  }
  setStatus($event) {
    this.status = $event;
  }
}

