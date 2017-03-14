import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
//import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { DashboardComponent } from './dashboard/dashboard.component';
import { NoteEditorComponent } from './note-editor/note-editor.component';
import { NotebookShowComponent } from './notebook/notebook-show/notebook-show.component';
import { AdminMenuComponent } from './admin/admin-menu/admin-menu.component';

const routes: Routes = [
  { path: '', redirectTo: '/notes', pathMatch: 'full' },
  { path: 'notes',         component: DashboardComponent },
  { path: 'settings',         component: AdminMenuComponent },
  { path: 'note/edit/:id',     component: NoteEditorComponent },
  { path: 'notebook/view/:id', component: NotebookShowComponent },
];

@NgModule({
  imports: [ 
  	RouterModule.forRoot(routes),
//  	NgbModule.forRoot()
  ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
