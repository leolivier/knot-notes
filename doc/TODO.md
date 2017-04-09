# TODO List

## Enhancements requests
* Don't save at each note change, add a timeout between 2 saves
* Syncing with a remote is not clearly shown
* Better management of errors for users
* Internationalization
* Manage deep links correctly so that url containing note ids can work and show the note  

## New features requests
* Crypt content when stored in a remote db
* Implement tags
* Add account management (be able to manage several accounts on one CouchDB server)
* Create a mobile application

## Bugs
* Initialization (first usage) randomly working or not
* Probably don't work on IE (not tested)
* css need some fix in Firefox
* Base url in index.html works good in ng serve if set to '/' or good in prod if set to '/'+document.location but no way to find something compatible between the 2 environments
 
## Ideas
* Mix list of notes inside the notebook tree
* Use Bootstrap for Angular

## Development and Code quality
* Test real time update/sync between 2 browsers
* Implement end to end (e2e) tests
* Manage css for tree node at the right place
