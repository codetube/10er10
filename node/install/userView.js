var config,
	configParser = require("../configParser"),
	when = require("../when");
/*
configParser.getConfig(function(err,resp) {
// 	if ( process.argv.length > 4 && process.argv[4] == "-p" ) {
// 		configParser.switchProd();
// 	}else {
		configParser.switchDev();
// 	}
	config = resp;
	onConfig();
});
*/
exports.createUserDesignDocs = function(couchd10, couchAuth, then) {
	when(
		{
			users: function(cb) {
				findUsers(couchAuth, cb);
			},
			views: function(cb) {
				getViews(couchd10, cb);
			}/*,
			lists: function(cb) {
				getLists(couchd10, cb);
			}*/
		},
		function(err,resp) {
			if ( err ) {
				console.log(err);
				then(err);
			}
			var users = [];
			resp.users.rows.forEach(function(row) {
				users.push(row.id);			
			});
			getUsersDocRev(couchd10, users,function(err,userRevs) {
				if ( err ) {
					console.log(err);
					then(err);
				}
				var docs = [];
				users.forEach(function(uid) {
					docs.push(
						prepareUserViews (uid, userRevs[uid], resp.views)
						 );
				});
// 				console.log(docs);
				console.log("recording docs");
				couchd10.storeDocs(docs, then);
			});
		}
	);
};



var getUsersDocRev = function(ncouch, users, then) {
	console.log("getting existing design doc revisions");
	var onceAgain = {};
	users.forEach(function(id) {
	onceAgain[id] = (
		function(id) {
			return function(cb) {
				ncouch.getDoc("_design/"+id, function(err,resp) {
					if ( err && err.statusCode && err.statusCode == 404 ) {
						return cb(null, "");
					} else if ( err ) {
						console.log(err, typeof err);
						return cb(err);
					} else {
						return cb(null, resp._rev);
					}
				});
			}
		}
		)(id);
	});
	when(onceAgain, then);
};


/*
var getUserDoc = function(uid, ncouch, then ) {
	
	d10.couch.d10.getDoc("_design/"+id, function(err,resp) {
		if ( err  && err != 404 ) {
			return then(err,resp);
		}
		if ( err == 404 ) {
			return then(null,"");
		} else {
			return then(null,resp._rev);
		}
	});
};
*/

var findUsers = function(ncouch, then) {
	ncouch.getAllDocs({startkey: "us", endkey: "ut", inclusive_end: false}, then);
};

var getViews = function(ncouch, then) {
	var jobs = {};
	d10views.forEach(function(v) {
		var spl = v.split("/"), doc = spl[0], view = spl[1];
		jobs[v] = 
			(function(doc, view) {
				return function(cb) {
					ncouch.getDoc("_design/"+doc, function(err,resp) {
						if ( err ) { return cb(err); }
						return cb(null, resp.views[view]);
					});
				};
			})(doc,view) 
			
		;
	});
	when(jobs,then);
};

/*
var getLists = function(ncouch, then) {
	var jobs = {};
	d10lists.forEach(function(v) {
		var spl = v.split("/"), doc = spl[0], list = spl[1];
		jobs[v] = 
			(function(doc, list) {
				return function(cb) {
					ncouch.getDoc("_design/"+doc, function(err,resp) {
						if ( err ) { return cb(err); }
						return cb(null, resp.lists[list]);
					});
				};
			})(doc,list) 
			
		;
	});
	when(jobs,then);
};
*/

var prepareUserViews = function(uid, rev, views) {
	console.log("parsing user view for ",uid);
	var doc = {_id: "_design/"+uid, language: "javascript", views: {}};
	if ( rev ) {
		doc._rev = rev;
	}
	for ( var fullName in views ) {
		var view = JSON.parse(JSON.stringify(views[fullName])), spl =  fullName.split("/");
		view.map = view.map.replace(/function\s*\(doc\)\s*{/,"function (doc) { if ( doc.user && doc.user != '"+uid+"' ) return ;");
// 		console.log(view.map);
		doc.views[ spl.join("_") ] = view;
	}
	return doc;
};


// not supported : list/hits
/*
var d10views = [
	"title/search",
	"genre/unsorted",
	"ts_creation/name",
	"genre/name",
	"album/name",
	"artist/basename",
	"title/name"
	"album/search",
	"album/artists",
	"artist/search",
	"artist/tokenized",
	"artist/related",
	"artist/albums",
	"artist/genres",
	"album/artists"
];
*/


var d10views = [
	"album/artists",
	"album/name",
	"album/search",
	"artist/albums",
	"artist/basename",
	"artist/genres",
	"artist/name",
	"artist/related",
	"artist/search",
	"artist/tokenized",
	"genre/artist",
	"genre/name",
	"genre/unsorted",
	"song/search",
	"title/name",
	"title/search",
	"ts_creation/name"
];
var d10lists = [
	"title/search",
	"album/search"
];



