"use strict";
/*
 * statelite positions from trimble almanach
 * based on Benjamin W. Remondi planning.c
 */

class TrimbleAlmanac extends Almanac {
	constructor() {
		super('Trimble');
	}

	/**
	 * process trimble planning format almac file
	 * @param {String} data - ascii almanac data in trimble planing format
	 *
	*/
	Parse(data) {
		var prn = new Array();			// satellite ids in one chunk
		var health = new Array();		// satellite health code in one chunk
		var ecc = new Array();			// eccentrities in one chunk
		var ax = new Array();			// semi major axes squares in one chunk
		var raw = new Array();			// right ascension in one chunk
		var aop = new Array();			// args of perigee in one chunk
		var man = new Array();			// mean anomalies in one chunk
		var toa = new Array();			// times of almanac in one chunk
		var inc = new Array();			// inclinations in one chunk
		var rra = new Array();			// rates of right ascension in one chunk
		var cof = new Array();			// sat clock offsets in one chunk
		var cdr = new Array();			// sat clock drifts in one chunk
		var week = new Array();			// gps weeks in one chunk
		var nf;							// number of fields in line
		var k = 0;						// number of process satellite
		var w;
		var lines = data.split('\n');	// break to lines
		var n = lines.length;			// number of lines in alm file
		var i, j;
		for (i = 0; i < n; i += 14) {	// process in 14 line chunks
			nf = Math.round(lines[i].length / 10);	// number of fields
			for (j = 0; j < nf; j++) {	// satellite prn number
				prn.push(parseInt(lines[i].substr(j * 10, 10)));
			}
			for (j = 0; j < nf; j++) {	// satellite health code
				health.push(parseInt(lines[i+1].substr(j * 10, 10)));
			}
			for (j = 0; j < nf; j++) {	// eccentrity
				ecc.push(parseFloat(lines[i+2].substr(j * 10, 10)));
			}
			for (j = 0; j < nf; j++) {	// semi major axes
				w = parseFloat(lines[i+3].substr(j * 10, 10));
				ax.push(w * w);
			}
			for (j = 0; j < nf; j++) {	// right ascension
				raw.push(parseFloat(lines[i+4].substr(j * 10, 10)) * DEG2RAD);
			}
			for (j = 0; j < nf; j++) {	// arg of perigee
				aop.push(parseFloat(lines[i+5].substr(j * 10, 10)) * DEG2RAD);
			}
			for (j = 0; j < nf; j++) {	// mean anomaly
				man.push(parseFloat(lines[i+6].substr(j * 10, 10)) * DEG2RAD);
			}
			for (j = 0; j < nf; j++) {	// time of almanac in gpsseconds
				toa.push(parseFloat(lines[i+7].substr(j * 10, 10)));
			}
			for (j = 0; j < nf; j++) {	// inclination
				inc.push((parseFloat(lines[i+8].substr(j * 10, 10))) * DEG2RAD + 54.0 * DEG2RAD);
			}
			for (j = 0; j < nf; j++) {	// rate of right ascension
				rra.push(parseFloat(lines[i+9].substr(j * 10, 10)) / 1000.0 * DEG2RAD);
			}
			for (j = 0; j < nf; j++) {	// satellite clock offset
				cof.push(parseFloat(lines[i+10].substr(j * 10, 10)));
			}
			for (j = 0; j < nf; j++) {	// satellite clock drift
				cdr.push(parseFloat(lines[i+11].substr(j * 10, 10)));
			}
			for (j = 0; j < nf; j++) {	// satellite clock drift
				week.push(parseInt(lines[i+12].substr(j * 10, 10)));
			}
			
			
			for (j = 0; j < nf; j++) {	// store data
				this.data.push({prn: prn[j], health: health[j], ecc: ecc[j],
					ax: ax[j], raw: raw[j], aop: aop[j], man: man[j],
					toa: toa[j], inc: inc[j], rra: rra[j], cof: cof[j],
					cdr: cdr[j], week: week[j]});
			}
			prn.length = 0;				// reset arrays for next chunk
			health.length = 0;
			ecc.length = 0;
			ax.length = 0;
			raw.length = 0;
			aop.length = 0;
			man.length = 0;
			toa.length = 0;
			inc.length = 0;
			rra.length = 0;
			cof.length = 0;
			cdr.length = 0;
			week.length = 0;
		}
		this.state = 1;	// change to valid state
	}

	/**
	 * get satellite position
	 * @param {String} prn - satellite id
	 * @param {Date} d - date and time
	 * @returns {Array} - geocentric position of satellite
	 */
	SatPos(prn, d) {
		if (this.state == 0) {	// data ready?
			return [0,0,0];
		}
		var sat = this.PrnFind(prn);		// get satellite data
		if (typeof (sat) == 'undefined') {	// check found?
			alert('sat not found ' + String(sat));	// TODO write log?
			return [0,0,0];
		}
		// mean motion
		var n = Math.sqrt(MU / sat.ax / sat.ax / sat.ax);
		var t = 2.0 * Math.PI / n;
		var dt = Almanac.Date2Sec(d) - sat.toa;
		var m = sat.man + n * dt;
		// Kepler equation
		var e = m;
		var eOld = 0.0;
		while (Math.abs(e - eOld) > 1.0e-8) {
			eOld = e;
			e = m + sat.ecc * Math.sin(e);
		}
		// true anomaly
		var snu = Math.sqrt(1.0 - sat.ecc * sat.ecc) * Math.sin(e);
		var cnu = Math.cos(e) - sat.ecc;
		var nu = Math.atan2(snu, cnu);
		// position in orbit plane
		var u = nu + sat.aop;
		var r = sat.ax * (1.0 - sat.ecc * Math.cos(e));
		var wc = sat.raw + (sat.rra - WEDOT) * dt - sat.toa * WEDOT;
		var xdash = r * Math.cos(u);
		var ydash = r * Math.sin(u);
		// position in ECEF system
		var xsat = xdash * Math.cos(wc) -
			ydash * Math.cos(sat.inc) * Math.sin(wc);
		var ysat = xdash * Math.sin(wc) +
			ydash * Math.cos(sat.inc) * Math.cos(wc);
		var zsat = ydash * Math.sin(sat.inc);
		return [xsat, ysat, zsat];
	}
}
