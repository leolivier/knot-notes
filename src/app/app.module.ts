import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { TreeModule } from 'angular2-tree-component';

import { AppRoutingModule } from './app-routing.module';

// Imports for loading & configuring the in-memory web api
import { InMemoryWebApiModule } from 'angular-in-memory-web-api';
import { InMemoryDataService } from './in-memory-data.service';

import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
// import { HeroSearchComponent } from './hero-search.component';
import { NoteService } from './note.service';
import { NoteEditorComponent } from './note-editor/note-editor.component';
import { NotebookShowComponent } from './notebook/notebook-show/notebook-show.component';
import { AdminMenuComponent } from './admin/admin-menu/admin-menu.component';
import { NotebookTreeComponent } from './notebook/notebook-tree/notebook-tree.component';
import { MenuComponent } from './menu/menu.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    InMemoryWebApiModule.forRoot(InMemoryDataService),
    AppRoutingModule,
    TreeModule
  ],
 declarations: [
    AppComponent,
    DashboardComponent,
    NoteEditorComponent,
    NotebookShowComponent,
    AdminMenuComponent,
    NotebookTreeComponent,
    MenuComponent
  ],
  providers: [ NoteService ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
