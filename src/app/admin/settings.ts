import { Crypto } from './crypto';

export const knot_notes_dbname = 'knot-notes';
export const settings_id = 'settings';
export const skins = ['lightblue', 'darkblue', 'lightgreen', 'darkgreen'];

export class RemoteDBSettings {
  name = knot_notes_dbname;
  baseUrl: string;
  username: string;
  password: string;
}

export class Settings {
  private _id = settings_id;
  _rev: string;
  useRemoteDB = false;
  remoteDBSettings = new RemoteDBSettings;
  crypt = false;
  cryptoKey: JsonWebKey;
  // passphrase: string;
  skin = 'lightblue';
}
