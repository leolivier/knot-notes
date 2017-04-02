import { Component, OnInit } from '@angular/core';
import { Settings, RemoteDBSettings } from '../settings';
import { DataService } from '../../services/data.service';

@Component({
  moduleId: module.id,
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  settings = new Settings;

  get useRemoteDB(): boolean { return this.settings.useRemoteDB; }
  set useRemoteDB(val: boolean) {
    this.settings.useRemoteDB = val;
    if (val && !this.settings.remoteDBSettings) { this.settings.remoteDBSettings = new RemoteDBSettings(); }
  }

  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.dataService.loadSettings()
      .then(settings => this.settings = settings);
  }

  save() {
    this.dataService.saveSettings(this.settings);
  }

  see() {
    alert('Have a look, please! ' + JSON.stringify(this.settings));
  }
}
