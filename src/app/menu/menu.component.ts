import { Component, Input, Output, EventEmitter } from '@angular/core';

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
  styleUrls: ['./menu.component.css']
})
export class MenuComponent {
  opened: boolean;
  @Input() values: DropdownValue[];
  @Input() position: string;

  @Output() onSelect = new EventEmitter<string>();
}
