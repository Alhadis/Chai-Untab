"use strict";

const Chai = require("chai");


let _depth    = null;   // How many columns to strip
let _trim     = true;   // Whether to remove leading/trailing blank lines

let untabChar = "\t";   // What defines a "tab"
let untabPatt = null;   // RegExp that strips leading indentation
let hooked    = false;  // Whether we've already hooked into Chai's API


Object.defineProperties(Chai, {
	doUntab: {value: doUntab},
	untab: {
		get(){ return _depth },
		set(i){
			if(i === _depth) return;
			hook(i, _trim);
		}
	},
	
	untabTrim: {
		get(){ return _trim },
		set(i){
			i = !!i;
			if(i === _trim) return;
			hook(_depth, _trim);
		}
	},
	
	untabChar: {
		get(){ return untabChar },
		set(i){ untabChar = i }
	}
});



/**
 * Hook into the test-runner's beforeEach/afterEach callbacks.
 *
 * This sets the untabbing amount relative to the current suite level.
 * Intended to work in Mocha, but may also work for any test-runner which
 * uses an API with identically-named callbacks.
 *
 * @private
 */
function hook(...args){
	beforeEach(() => setUntab(...args));
	afterEach(()  => setUntab(null));
	hookIntoChai();
}


/**
 * Set unindentation settings for this suite level.
 *
 * @param {Number} depth
 * @param {Boolean} trim
 * @private
 */
function setUntab(depth, trim){
	
	/** Disable untab */
	if(!depth){
		_depth = null;
		_trim = false;
	}
	
	else{
		_depth = depth;
		_trim = trim;
	}
}


/**
 * Remove leading indentation using Chai's current untab- settings.
 *
 * Called automatically, but exposed for external use. If the supplied
 * argument isn't a string, it's returned untouched without further ado.
 *
 * Arguments beyond the first are optional: if either depth or trim are
 * omitted, they default to those set for the current suite level.
 *
 * @param {Mixed} input
 * @param {Number} depth
 * @param {Boolean} trim
 * @return {Mixed|String}
 * @public
 */
function doUntab(input, depth = undefined, trim = undefined){
	
	/** Not a string? Leave it. */
	if("[object String]" !== Object.prototype.toString.call(input))
		return input;
	
	if(trim === undefined)  trim  = _trim;
	if(depth === undefined) depth = _depth;
	
	/** Strip leading and trailing lines if told to */
	if(trim)
		input = input.replace(/^(?:[\x20\t]*\n)*|(?:\n[\x20\t]*)*$/gi, "");
	
	const untabPatt = new RegExp("^(?:" + untabChar + "){0," + depth + "}", "gm");
	return input.replace(untabPatt, "");
}


/**
 * Overwrite the necessary Chai methods for comparing string-blocks.
 *
 * Only executed the first time Chai.untab is set.
 * @private
 */
function hookIntoChai(){
	if(hooked) return;
	hooked = true;
	
	for(const method of ["equal", "string"]){
		Chai.Assertion.overwriteMethod(method, function(__super){
			return function(input, ...rest){
				__super.apply(this, [ doUntab(input), ...rest ]);
			}
		});
	}
}
