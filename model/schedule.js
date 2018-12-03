const moment = require("moment");
const bunyan = require("bunyan");
const { LAYOUT } = require("../util/time-formatter");

const log = bunyan.createLogger({name: "schedule"});

/**
 * Test if now falls within a specified time range.
 * @param {string} startAt - ISO 8601 date string 2018-11-11T16:00:00Z
 * @param {string} endAt - ISO 8601 date string
 */
exports.isInEffect = function(startAt, endAt) {
  const start = moment(startAt, LAYOUT.ISO8601);
  const end = moment(endAt, LAYOUT.ISO8601);
  const now = moment();

  log.info({startAt, endAt}, "Test promotion time span");
  
  if (now.isAfter(start) && now.isBefore(end)) {
    return true;
  }

  return false;
}