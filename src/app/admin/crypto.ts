/**
 * Implementation of cryptography based on WebCryptoAPI, AES-GCM algorithm
 */
import { SettingsService } from '../services/settings.service';
import { Settings } from './settings';
import { StatusEmitter } from '../status-bar/status';

class CryptObj {data: ArrayBuffer; iv: ArrayBufferView; };

export class Crypto {

  key: CryptoKey;

  constructor (
    private settingsService: SettingsService,
    private alerter: StatusEmitter) {}

  initCrypto(settings: Settings) {
    if (settings.cryptoKey) {
      this.importKey(settings.cryptoKey);
    } else {
      this.generateKey().then(
        key => {
          this.key = key;
          this.exportKey()
            .then(jswk => {
              settings.cryptoKey = jswk;
              this.settingsService.saveSettings(settings);
            })
            .catch(err => this.handleError(err));
        },
        error => this.handleError(error));
    }
  }

  handleError(error, reject?) {
     this.alerter.error('Crypto error: ' + error);
     console.error(error);
     if (reject) reject(error);
  }

  /*
   *  ##AES-GCM ####AES-GCM - generateKey
   * returns a Promise<CryptoKey> containing the key (to be stored in PouchDB)
   * which must be used to encrypt the data
   */
  generateKey(): Promise<CryptoKey> {
    return new Promise((resolve, reject) => {
      window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, /* extractable = */ true, ['encrypt', 'decrypt'])
      .then(key => {
        console.log(key);
        resolve(key);
      },
      err => this.handleError(err, reject));
    });
  }

/*
 * ####AES-GCM - importKey
 * imports a JsonWebKey and returns Promise<CryptoKey> that can be use to encrypt/decrypt data
 * this is an example jsonWebKey data
 * {
 *   kty: 'oct',
 *   k: 'Y0zt37HgOx-BY7SQjYVmrqhPkO44Ii2Jcb9yydUDPfE',
 *   alg: 'A256GCM',
 *   ext: true,
 * }
 * The JsonWebKey is supposed to be the result of a call to exportKey
 */
  importKey(keydata: JsonWebKey): Promise<CryptoKey> {
    return new Promise((resolve, reject) =>
      window.crypto.subtle.importKey('jwk', keydata, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'])
      .then(
        key => {
          // returns the symmetric key
          console.log(key);
          this.key = key;
          resolve(key);
        },
        err => this.handleError(err, reject))
    );
  }

  /*
   * ####AES-GCM - exportKey
   * exports the CryptoKey as a Promise<JsonWebKey> that can later be imported by importKey
   */
  exportKey(): Promise<JsonWebKey> {
    return new Promise((resolve, reject) =>
      window.crypto.subtle.exportKey('jwk', this.key)
      .then(
        key => {
          // returns the Json Web Key
          console.log(key);
          resolve(key);
        },
        err => this.handleError(err, reject))
    );
  }

  /*
   * ####AES-GCM - encrypt
   * data: ArrayBuffer of data you want to encrypt
   * returns a promise<ArrayBuffer> containing the encrypted data
   */
  encrypt(data: ArrayBuffer): Promise<CryptObj> {
    return new Promise((resolve, reject) => {
      // Don't re-use initialization vectors!
      // Always generate a new iv every time your encrypt!
      // Recommended to use 12 bytes length
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        this.key, data)
      .then(
          encrypted => {
          // returns an ArrayBuffer containing the encrypted data
          // const res = new Uint8Array(encrypted);
          console.log(new Uint8Array(encrypted));
          resolve({data: encrypted, iv: iv } as CryptObj);
        },
          err => this.handleError(err, reject));
    });
  }

/*
 * ####AES-GCM - decrypt
 * data: ArrayBuffer of the data to be decrypted
 * counter: ArrayBuffer of the counter used to encrypt
 * Returns an ArrayBuffer of the decrypted data
 */
  decrypt(encrypted: CryptObj): Promise<ArrayBuffer> {
    return new Promise ((resolve, reject) => {
      window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: encrypted.iv },
        this.key, encrypted.data)
      .then(decrypted => {
        // returns an ArrayBuffer containing the decrypted data
        console.log(new Uint8Array(decrypted));
        resolve(decrypted);
      },
      err => this.handleError(err, reject));
    });
  }

}
