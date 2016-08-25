"use strict";

const Chai = require("chai");


let untabChar = "\t";   // What defines a "tab"
let untabPatt = null;   // RegExp that strips leading indentation
let hooked    = false;  // Whether we've already hooked into Chai's API

/** Pointers to the most recently-assigned properties */
let lastDepth;
let lastTrim;


Object.defineProperties(Chai, {
	doUntab: {value: doUntab},
	untab: {
		get(){ return lastDepth },
		set(depth){
			if(depth === lastDepth) return;
			hook(depth, lastTrim);
		}
	},
	
	untabTrim: {
		get(){ return lastTrim },
		set(trim){
			trim = !!trim;
			if(trim === lastTrim) return;
			hook(lastDepth, trim);
		}
	},
	
	untabChar: {
		get(){ return untabChar },
		set(char){ untabChar = char }
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
	afterEach(()  => setUntab(false));
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
	
	/** If this is false, we're undoing existing indentation settings */
	if(false == depth){
		lastDepth = null;
		lastTrim = false;
	}
	
	else{
		lastDepth = depth;
		lastTrim = trim;
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
	
	if(trim === undefined)  trim  = lastTrim;
	if(depth === undefined) depth = lastDepth;
	
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
