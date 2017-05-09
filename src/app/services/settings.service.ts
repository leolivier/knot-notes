import { Injectable } from '@angular/core';
import { Settings, settings_id, RemoteDBSettings } from '../admin/settings';
import { StatusEmitter } from '../status-bar/status';
import * as PouchDB from 'pouchdb';  
import * as PouchDBFind from 'pouchdb-find';

@Injectable()
export class SettingsService {
  settings: Settings;
  private db: any;

  constructor(private alerter: StatusEmitter) {}

  private handleError(error: any, reject?) {
    this.alerter.error('An error occurred: ' + error);
    console.error('An error occurred', error);
    if (reject) reject(error.message || error);
  }

  useRemoteDB(): boolean { return this.settings.useRemoteDB; }
  remoteDBSettings(): RemoteDBSettings { return this.settings.remoteDBSettings; }
  skin(): string { 
    if (this.settings) {
      if (!this.settings.skin) {
        this.settings.skin = 'lightblue';
      }
      return this.settings.skin+'-skin'
    } else { return 'lightblue-skin'; }
  }

  loadSettings(db = null, force = false): Promise<Settings> {
    if (!force && this.settings) {
      return Promise.resolve(this.settings);
    }
    if (db) {
     // use provided local database (from data services)
      this.db = db; // new PouchDB(settings_dbname);
    } else if (!this.db) {
      return Promise.reject('Cannot load settings: database not set');
    }
    const that = this;
    return new Promise((resolve, reject) => {
      that.db.get(settings_id).then(doc => {
        that.settings = <Settings>doc;
        if (!that.settings.remoteDBSettings) { that.settings.remoteDBSettings = new RemoteDBSettings(); }
        resolve(that.settings);
      }).catch (err => {
        if (err.name === 'not_found') {
          that.settings = new Settings(); // default empty settings
        } else {
          that.handleError(err, reject);
        }
      });
    });
  }

  saveSettings(settings?: Settings): Promise<Settings> {
    const that = this;
    if (settings) { that.settings = settings; }
//    if (!that.settings.rev) { that.settings.rev = '0'; }
    const o = JSON.parse(JSON.stringify(that.settings));
    return new Promise((resolve, reject) => {
      that.db.put(o).then(response => {
        if (response && response.ok) {
        // be sure to refresh rev number
          that.settings._rev = response.rev;
          resolve(that.settings);
          that.alerter.info('Settings saved');
        }
      }).catch(error => that.handleError(error, reject))
    });
  }

  handleChange(change) {
//    this.settings = <Settings>change.doc;
  }
}
