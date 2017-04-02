import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { DashboardComponent } from './dashboard/dashboard.component';
import { NoteEditorComponent } from './note-editor/note-editor.component';
import { NotebookShowComponent } from './notebook/notebook-show/notebook-show.component';
import { SettingsComponent } from './admin/settings/settings.component';
import { PageNotFoundComponent } from './not-found.component';

const routes: Routes = [
  { path: 'notes', component: DashboardComponent },
  { path: 'settings', component: SettingsComponent },
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
  exports: [RouterModule]
})
export class AppRoutingModule { }
