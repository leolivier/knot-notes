import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
//import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { DashboardComponent } from './dashboard/dashboard.component';
import { NoteEditorComponent } from './note-editor/note-editor.component';
import { NotebookShowComponent } from './notebook/notebook-show/notebook-show.component';
import { AdminMenuComponent } from './admin/admin-menu/admin-menu.component';
import { PageNotFoundComponent } from './not-found.component';

const routes: Routes = [
  { path: 'notes', component: DashboardComponent },
  { path: 'settings', component: AdminMenuComponent },
  { path: 'note/:id', component: DashboardComponent },
  { path: 'notebook/:id', component: DashboardComponent },
  { path: '', redirectTo: '/notes', pathMatch: 'full' },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [ 
  	RouterModule.forRoot(routes)
//  	NgbModule.forRoot()
  ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
