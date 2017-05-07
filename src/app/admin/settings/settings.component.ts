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
  set skin(s: string) { this.settings.skin = s; }
  get skin(): string { return this.settings.skin; }
  skins(): string[] {
    return skins;
  }

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
    const that = this;
    if (this.settingsService.settings) {
      this.settings = this.settingsService.settings;
      this.checkCrypto();
    } else {
      setTimeout(()=>that.ngOnInit(), 500);
    }
  }

  checkCrypto() {
        if (this.settings.crypt) { this.crypto.initCrypto(this.settings); }
  }

  save() {
    this.settingsService.saveSettings(this.settings).then(settings => {
      this.settings = settings;
    });
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

  destroy_db() {
    if (confirm('Warning! You will destroy the local database. It has no impact on the server database if you are synchronized.\nPlease confirm or cancel...')) {
      this.dataService.destroydb();
    }
  }
}
