import { Component, OnInit } from '@angular/core';
import { Settings, RemoteDBSettings, skins } from '../settings';
import { Crypto } from '../crypto';
import { DataService } from '../../services/data.service';
import { StatusEmitter } from '../../status-bar/status';
import { SettingsService } from '../../services/settings.service';

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
  setSkin($event) { 
    this.settings.skin = $event.target.value; 
  }
  skins(): string[] {
    return skins;
  }
  skin(): string { return this.settings.skin; }

  get useRemoteDB(): boolean { return this.settings.useRemoteDB; }
  set useRemoteDB(val: boolean) {
    if (val && !this.settings.useRemoteDB) { // start using remote db, the real sync starts when saving only
      if (!this.settings.remoteDBSettings) { this.settings.remoteDBSettings = new RemoteDBSettings(); }
    } else if (!val && this.settings.useRemoteDB) { // stop using remote db
      this.dataService.stopSyncing();
    }
    this.settings.useRemoteDB = val;
  }

  constructor(
    private settingsService: SettingsService,
    private dataService: DataService,
    private alerter: StatusEmitter) {
      this.crypto = new Crypto(settingsService, alerter);
  }

  ngOnInit() {
    this.settingsService.loadSettings()
      .then(settings => {
        this.settings = settings;
        this.checkCrypto();
    });
  }

  checkCrypto() {
        if (this.settings.crypt) { this.crypto.initCrypto(this.settings); }
  }

  save() {
    this.settingsService.saveSettings(this.settings);
    if (this.settings.useRemoteDB) { this.dataService.trySyncToRemote(this.settings); }
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
