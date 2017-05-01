
# KNOT NOTES ![](https://github.com/leolivier/knot-note/raw/master/src/assets/images/knot-note-48x48.png)

Yet another note editor (more or less evernote like)...

Knot-notes is able to store the notes locally in the browser's own database and is also able to store the notes in a CouchDB database on your own server.

It is written with the help of

* Angular (v4) for the GUI, 
* PouchDB (for local database and syncing)
* and CouchDB (for server database).

Don't hesitate to create features requests or issues on [GitHub](https://github.com/leolivier/knot-note/issues).

See [TODO.md](doc/TODO.md) to check what's in the pipe currently.
See [RELEASE.md](doc/RELEASE.md) to see what has been delivered 

__WARNING: This is still an alpha release!__
------------

##Installing 

##Local database install only

*With this kind of install, you can save your notes inside your browser only. You can't share your notes in another browser or on another device.*

* You must have an http server installed (Apache, NGinx, ...)
* Create a directory named knot-notes in the root of your http server 
* Download the [1.0.alpha-2 release](https://github.com/leolivier/knot-notes/raw/master/knot-notes-1.0.0-a2.zip) zip file, 
unzip it in the directory above.
* If necessary, manage the server configuration so that the new directory can be accessed and manage fallback to index.html (see [server configuration](https://angular.io/docs/ts/latest/guide/deployment.html#!#fallback) on Angular documentation)
* That's it!

###Server database

*With this install, you can share your notes between different devices and browsers.*

* First, proceed to the *Local database install* described above.
* See [CouchDB site](http://docs.couchdb.org/en/latest/) for learning how to install and run CouchDB (I did it on a raspberrypi 2 and it works like a charm). 

*This should also work with all databases compatible with [PouchDB](https://pouchdb.com) (CouchBase, Cloudant) but has not been tested yet.*

* Create your own Couchdb database named 'knot-notes'
* Fill the settings in the application for its url (__not__ including the database name), and credentials. __Warning:__ these credentials are currently stored unencrypted in the local database!

##Developers

Please see [DEVELOPERS.md](doc/DEVELOPPERS.md) for installing the devt environment  
