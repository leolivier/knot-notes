/**
 * Defines a status to be displayed in the status bar
 */
import { EventEmitter, Output } from '@angular/core';

export enum StatusKind { Error, Warning, Info }

export class Status {
  kind: StatusKind;
  message: string;
}

export class StatusEmitter extends EventEmitter<Status> {

  error(message: string) { this.emit({message: message, kind: StatusKind.Error}); }

  warning(message: string) { this.emit({message: message, kind: StatusKind.Warning}); }

  info(message: string) { this.emit({message: message, kind: StatusKind.Info}); }
}
