"use strict";

const Chai = require("chai");


let untab;
let untabChar = "\t";   // What defines a "tab"
let untabTrim = false;  // Whether leading/trailing blank lines should be stripped
let untabPatt = null;   // RegExp that strips leading indentation
let hooked    = false;  // Whether we've already hooked into Chai's API



/**
 * Remove leading indentation using Chai's current untab- settings.
 *
 * Called automatically, but exposed for external use. If the supplied
 * argument isn't a string, it's returned untouched without further ado.
 *
 * @param {Mixed} input
 * @return {Mixed|String}
 * @public
 */
function doUntab(input){
	
	/** Not a string? Leave it. */
	if("[object String]" !== Object.prototype.toString.call(input))
		return input;
	
	/** Strip leading and trailing lines if told to */
	if(untabTrim)
		input = input.replace(/^(?:[\x20\t]*\n)*|(?:\n[\x20\t]*)*$/gi, "");
	
	return input.replace(untabPatt, "");
}


/**
 * Prepare unindentation for this suite level.
 *
 * @param {Number} amount
 * @private
 */
function setPattern(amount){
	if(amount){
		untab = amount;
		untabPatt = new RegExp("^(?:" + untabChar + "){0," + untab + "}", "gm");
	}
	
	else{
		untab = null;
		untabPatt = null;
	}
}


/**
 * Hook into the test-runner's beforeEach/afterEach callbacks.
 *
 * This sets the untabbing amount relative to the current suite level.
 * Intended to work in Mocha, but may also work for any test-runner which
 * uses an API with identically-named callbacks.
 *
 * @param {Number} amount
 * @private
 */
function hook(amount){
	beforeEach(() => setPattern(amount));
	afterEach(()  => setPattern(false));
	hookIntoChai();
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


Object.defineProperties(Chai, {
	
	untab: {
		get(){ return untab },
		set(i){
			if(i === untab) return;
			hook(i);
		}
	},
	
	doUntab: {
		value: doUntab
	}
});
