import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { TreeModule } from 'angular-tree-component';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { DataService } from './services/data.service';
import { SettingsService } from './services/settings.service';
import { NoteEditorComponent } from './note-editor/note-editor.component';
import { NotebookShowComponent } from './notebook/notebook-show/notebook-show.component';
import { NotebookTreeComponent, TreeInputDirective } from './notebook/notebook-tree/notebook-tree.component';
import { MenuComponent } from './menu/menu.component';
import { PageNotFoundComponent } from './not-found.component';
import { SettingsComponent } from './admin/settings/settings.component';
import { StatusBarComponent } from './status-bar/status-bar.component';
import { StatusEmitter } from './status-bar/status';
@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRoutingModule,
    TreeModule
  ],
  declarations: [
    AppComponent,
    DashboardComponent,
    NoteEditorComponent,
    NotebookShowComponent,
    NotebookTreeComponent,
    TreeInputDirective,
    MenuComponent,
    PageNotFoundComponent,
    SettingsComponent,
    StatusBarComponent
  ],
  providers: [DataService, StatusEmitter, SettingsService],
  bootstrap: [AppComponent]
})
export class AppModule { }
