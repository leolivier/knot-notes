import { Component, Input, OnInit } from '@angular/core';
import { Status } from '../status-bar/status';

@Component({
  selector: 'app-status-bar',
  templateUrl: './status-bar.component.html',
  styleUrls: ['./status-bar.component.scss']
})
export class StatusBarComponent implements OnInit {
  @Input()
  status: Status;
  constructor() { }

  ngOnInit() {
  }

}
