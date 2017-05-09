import { Component, Input, OnInit } from '@angular/core';
import { StatusEmitter, Status, StatusKind } from '../status-bar/status';

const StatusClasses = [ 'error', 'warning', 'info', 'sync']; // must match StatusKind

@Component({
  selector: 'app-status-bar',
  templateUrl: './status-bar.component.html',
  styleUrls: ['./status-bar.component.scss']
})
export class StatusBarComponent implements OnInit {
  status = new Status;
  syncState = <Status>{message: 'None', kind: StatusKind.Sync};

  constructor(private alerter: StatusEmitter) {}

  ngOnInit() {
    this.alerter.subscribe(status => this.setStatus(status));
  }

  setStatus(status: Status) {
    if (status.kind === StatusKind.Sync) {
      this.syncState = status;
    } else {
      this.status = status;
    }
  }

  class(): string { 
    return StatusClasses[this.status.kind] + '-status'; 
  } 

}
