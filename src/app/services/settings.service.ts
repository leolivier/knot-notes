import { Injectable } from '@angular/core';
import { Settings, settings_dbname, RemoteDBSettings } from '../admin/settings';
import { StatusEmitter } from '../status-bar/status';
import * as PouchDB from 'pouchdb';  
import * as PouchDBFind from 'pouchdb-find';

@Injectable()
export class SettingsService {
  settings = new Settings();
  private db: any;

  constructor(private alerter: StatusEmitter) {
    PouchDB.plugin(PouchDBFind);
    // create/open local database
    this.db = new PouchDB(settings_dbname);
    window['PouchDB'] = PouchDB; // for debugging purpose
    this.loadSettings(true);
    this.db.setMaxListeners(30);
  }

  private handleError(error: any, reject?) {
    this.alerter.error('An error occurred: ' + error);
    console.error('An error occurred', error);
    if (reject) reject(error.message || error);
  }

  useRemoteDB(): boolean { return this.settings.useRemoteDB; }
  remoteDBSettings(): RemoteDBSettings { return this.settings.remoteDBSettings; }
  skin(clazz: string) {
    return [clazz, this.settings.skin + '-' + clazz]; 
  }
  skins(clazzes: string[]) {
    let res = [];
    clazzes.forEach(clazz => res.push(clazz, this.settings.skin + '-' + clazz));
    return res; 
  }

  loadSettings(force = false): Promise<Settings> {
    if (this.settings && !force) {
      return Promise.resolve(this.settings);
    }
    const that = this;
    return new Promise((resolve, reject) => {
      that.db.get('settings').then(doc => {
        that.settings = doc as Settings;
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
    const o = JSON.parse(JSON.stringify(that.settings));
    return new Promise((resolve, reject) => {
      that.db.put(o).then(response => {
        if (response && response.ok) {
        // be sure to refresh rev number
          that.settings.rev = response.rev;
          resolve(that.settings);
        }
      }).catch(error => that.handleError(error, reject))
    });
  }
}
