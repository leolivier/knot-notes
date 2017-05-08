import { Component, ViewChild } from '@angular/core';
import { SettingsService } from './services/settings.service';

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

  constructor(
    private settingsService: SettingsService,
  ) { }

  skin() { return this.settingsService.skin(); }
}

