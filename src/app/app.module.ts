import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { TreeModule } from 'angular2-tree-component';

import { AppRoutingModule } from './app-routing.module';

// Imports for loading & configuring the in-memory web api
import { InMemoryWebApiModule } from 'angular-in-memory-web-api';
import { InMemoryDataService } from './services/in-memory-data.service';

import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { DataService } from './services/data.service';
import { NoteService } from './services/note.service';
import { NoteEditorComponent } from './note-editor/note-editor.component';
import { NotebookShowComponent } from './notebook/notebook-show/notebook-show.component';
import { NotebookTreeComponent } from './notebook/notebook-tree/notebook-tree.component';
import { MenuComponent } from './menu/menu.component';
import { PageNotFoundComponent } from './not-found.component';
import { SettingsComponent } from './admin/settings/settings.component';

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
    NotebookTreeComponent,
    MenuComponent,
    PageNotFoundComponent,
    SettingsComponent
  ],
  providers: [NoteService, DataService],
  bootstrap: [AppComponent]
})
export class AppModule { }
