const bunyan = require("bunyan");

var log = bunyan.createLogger({name: "fta"});

log.info("hi");

log.info({lange: "fr"}, "au revoir");