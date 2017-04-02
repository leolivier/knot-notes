
# KNOT NOTES ![](https://github.com/leolivier/knot-note/raw/master/src/assets/images/knot-note.png)

Yet another note editor (more or less evernote like)...
This one is written with angular.

__WARNING: This is an alpha release!__
---
Don't hesitate to create features requests.

This version is able to store the notes locally in the browser's own database and is also able to store the notes in a CouchDB database on your own server.

See [CouchDB site](http://docs.couchdb.org/en/latest/) for learning how to install and run CouchDB (I did it on a raspberrypi 2 and it works like a charm). 

*This should also work with all databases compatible with [PouchDB](https://pouchdb.com) (CouchBase, Cloudant) but has not been tested yet.*

You will first have to create your own cloudb database named 'knot-notes' and fill the settings in the application for its url (__not__ including the database name), and credentials. Warning: these credentials are stored unencrypted in the local http database!

When finished, it should be able to store the notes locally in the browser database and be synchronized with a CouchDB (or Couchbase or Cloudant as you like) database server so that you can use it on different devices and yoy can share your notes with otehr people.

## Installation
To install, first run 'npm install' then follow below instructions.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.0.0-beta.31.

## Development server
Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive/pipe/service/class/module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
