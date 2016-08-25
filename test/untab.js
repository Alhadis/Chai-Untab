"use strict";

const Chai = require("chai");
require("../chai-untab.js");
const {expect} = Chai;

const input = `
	A
	B
	C
`;


describe("Untabbing", () => {
	Chai.untab = 2;
	
	it("unindents string blocks", () => {
		expect(input).to.equal(`
			A
			B
			C
		`);
	});
	
	
	describe("Nested calls", () => {
		Chai.untab = 3;
		
		it("still unindents string blocks", () => {
			expect(input).to.equal(`
				A
				B
				C
			`);
		});
	});
});
