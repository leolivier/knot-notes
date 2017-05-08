import { Component } from '@angular/core';

@Component({
  template: `<h2>Page not found</h2>
  <button [routerLink]="['/notes']">Go to Home</button>`
})
export class PageNotFoundComponent {}
