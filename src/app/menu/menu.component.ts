import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SettingsService } from '../services/settings.service';

export class DropdownValue {
  value: string;
  label: string;

  constructor(value: string, label: string) {
    this.value = value;
    this.label = label;
  }
}

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent {
  opened: boolean;
  @Input() values: DropdownValue[];
  @Input() position: string;

  @Output() onSelect = new EventEmitter<string>();

  constructor(private settingsService: SettingsService) {}
}
