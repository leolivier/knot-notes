import { Component, Input, OnInit } from '@angular/core';
import { StatusEmitter, Status } from '../status-bar/status';
import { SettingsService } from '../services/settings.service';

const StatusClasses = [ 'error', 'warning', 'info']; // must match StatusKind

@Component({
  selector: 'app-status-bar',
  templateUrl: './status-bar.component.html',
  styleUrls: ['./status-bar.component.scss']
})
export class StatusBarComponent implements OnInit {
  status = new Status;


  constructor(
    private alerter: StatusEmitter,
    private settingsService: SettingsService,
  ) {}

  ngOnInit() {
    this.alerter.subscribe(status => this.status = status);
  }

  class(): string[] { 
    return this.settingsService.skin(StatusClasses[this.status.kind] + '-status'); 
  } 

}
