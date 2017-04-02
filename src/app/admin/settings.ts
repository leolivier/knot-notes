export const knot_notes_dbname = 'knot-notes';

export class RemoteDBSettings {
  name = knot_notes_dbname;
  baseUrl: string;
  username: string;
  password: string;
}

export class Settings {
  private _id = 'settings';
  private _rev: string;
  // setter for data.service only!
  set rev(rev: string) { this._rev = rev; }
  get rev(): string { return this._rev; }
  useRemoteDB = false;
  remoteDBSettings = new RemoteDBSettings;
  crypt = false;
  cryptoKey: string;
}
