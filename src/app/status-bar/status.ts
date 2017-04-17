/**
 * Defines a status to be displayed in the status bar
 */
import { EventEmitter, Output, Injectable } from '@angular/core';

export enum StatusKind { Error, Warning, Info }

export class Status {
  kind = StatusKind.Info ;
  message = 'No message...';
}

@Injectable()
export class StatusEmitter {
  emitter = new EventEmitter<Status> ();

  private emit(message: string, kind: StatusKind) {
    this.emitter.emit({message: message, kind: kind} as Status);
    console.log(message);
  }

  error(message: string) { this.emit(message, StatusKind.Error); }

  warning(message: string) { this.emit(message, StatusKind.Warning); }

  info(message: string) { this.emit(message, StatusKind.Info); }

  subscribe(method) { this.emitter.subscribe(method); }

}
