var config,
	configParser = require("../configParser");

configParser.getConfig(function(err,resp) {
	if ( process.argv.length > 4 && process.argv[4] == "-p" ) {
		configParser.switchProd();
	}else {
		configParser.switchDev();
	}
	config = resp;
	onConfig();
});

var onConfig = function() {

	var d10 = require("../d10"),
		users = require("../d10.users");
	d10.setConfig(config);

	if ( process.argv.length < 4 ) {
		console.log("Usage: "+process.argv[0]+" "+process.argv[1]+" login passwd [-p]");
		process.exit(1);
	}

	setTimeout(function() {

		var login = process.argv[2],
			password = process.argv[3];


		users.createUser(login,password, {
			callback: function(err,resp) {
				if ( err ) {
					console.log("not created : something went wrong : ",err);
				} else {
					console.log("user created, id = us"+resp);
				}
			}
		});


	},5000);


	console.log("Creating user "+process.argv[2]+" with password "+process.argv[3]);
	console.log("Hit <Crtl>+C to cancel or wait 5 secs");


};
