import { Component, OnInit } from '@angular/core';
import { Settings, RemoteDBSettings } from '../settings';
import { Crypto } from '../crypto';
import { DataService } from '../../services/data.service';

@Component({
  moduleId: module.id,
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  settings = new Settings;
  showKey: string;
  crypto: Crypto;

  get useRemoteDB(): boolean { return this.settings.useRemoteDB; }
  set useRemoteDB(val: boolean) {
    this.settings.useRemoteDB = val;
    if (val && !this.settings.remoteDBSettings) { this.settings.remoteDBSettings = new RemoteDBSettings(); }
  }

  constructor(private dataService: DataService) {
      this.crypto = new Crypto(dataService);
  }

  ngOnInit() {
    this.dataService.loadSettings()
      .then(settings => {
        this.settings = settings;
        if (settings.crypt) { this.crypto.initCrypto(this.settings); }
    });
  }

  checkCrypto() {
        if (this.settings.crypt) { this.crypto.initCrypto(this.settings); }
  }

  save() {
    this.dataService.saveSettings(this.settings);
  }

  showEncryptionKey() {
    if (this.settings.crypt && this.settings.cryptoKey) {
      this.showKey = this.settings.cryptoKey.k;
    }
  }

  see() {
    alert('Have a look, please! ' + JSON.stringify(this.settings));
  }
}
