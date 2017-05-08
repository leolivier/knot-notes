import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent {
  opened: boolean;
  @Input() items: Map<string, string>;
  @Input() position: string;
}
