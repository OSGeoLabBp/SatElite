"use strict";

/* base class for almanac processing */

const JAN11901 = 15385;
const JAN61980 = 44244;
const SEC_PER_DAY = 86400.0;
const DEG2RAD = Math.PI / 180.0;
const MU = 3.986005e+14         // WGS 84 value of earth's univ. grav. par.
const WEDOT = 7.2921151467e-5   // WGS 84 value of earth's rotation rate

/**
 * Base class for differenc almanac formats
 * @member {String} type
 * @member {Array} data
 * @member {Number} state
 */
class Almanac {
	constructor(type) {
		this.type = type;
		/** @member {Array} */
		this.data = new Array();
		this.state = 0;	// initial state
	}

	/**
	 * check for leap year
	 * @param {Number} year - year with four digit
	 * @returns {Boolean} - true if input is leap year
	 */
	static LeapYear(year) {
		return (year % 4 == 0) && (year % 100 > 0 || year % 400 == 0);
	}

	/**
	 * count GPS seconds from date
	 * @param {Date} d - date to convert
	 * @returns {Number} second of the week
	 */
	static Date2Sec(d) {

		var monthDay = [[0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
						[0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]];

		var leap = Almanac.LeapYear(d.getFullYear()) ? 1 : 0;
		var yearDay = monthDay[leap][d.getMonth()] + d.getDate();
		var mjd = Math.floor((d.getFullYear() - 1901) / 4) * 1461 +
			((d.getFullYear() - 1901) % 4) * 365 + yearDay + JAN11901;
		var fmjd= ((d.getSeconds() / 60.0 + d.getMinutes()) / 60.0 +
			d.getHours()) / 24.0;
		var gps_week = Math.floor((mjd - JAN61980) / 7);
		return ((mjd - JAN61980) - gps_week * 7 + fmjd) * SEC_PER_DAY;
	}

	/**
	 * Parse downloaded almanac data
	 * @param {String} data - downloaded almanac data
	 */
	Parse(data) {
		alert("Not implemented");
	}

	/**
	 * download a text file using ajax
	 * @param {String} url - url to text file to download
	 * @param {function} callback - this function run, when tha ajax is done
	 */
	Download(url, callback) {
		var self = this;
		$.ajax({
			url: url,
			async: false,	// TODO slow, async is dangerous (wait for ready)
			type: 'GET',
			dataType: 'text'
		}).done(function(data) {
			self.Parse(data);
			callback();
		}).fail(function(xhr, stat, error) {
			alert(stat + ' ' + error)	// TODO write log?
		});
	}

	/**
	 * find staellite record by prn
	 * @param {String} prn - satellite id
	 * @returns satellite data JSON
	 */
	PrnFind (prn) {
        var id = this.data.find(function (o) { return o.prn == prn;});
		return id;
    }

	/**
	 * Get all satellite ids from this almanac
	 * @returns {Array}
	 */
	GetPrns() {
		var res = new Array();
		var i;
		for (i=0; i < this.data.length; i++) {
			res.push(this.data[i].prn);
		}
		return res;
	}

	/**
	 * Get satellite position
	 * @param {String} prn - satellite id
	 * @param {Date} d - date & time
	 */
	SatPos(prn, d) {
		alert("Not implemented");
	}
}
