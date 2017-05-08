import { Component, ViewChild } from '@angular/core';
import { SettingsService } from './services/settings.service';

@Component({
  moduleId: module.id,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  constructor(
    private settingsService: SettingsService,
  ) { }

  skin() { return this.settingsService.skin(); }
}

