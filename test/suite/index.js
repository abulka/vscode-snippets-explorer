const path = require('path');
const Mocha = require('mocha');
const glob = require('glob');

function run() {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true
	});

	// ANDY HAD TO REMOVE
	// Use any mocha API
	// (node:366166) DeprecationWarning: "useColors()" is DEPRECATED, please use "color()" instead.
	// mocha.useColors(true);
	// mocha.color(true);

	// ANDY HAD TO ADD
	const testsRoot = path.resolve(__dirname, '..');

	return new Promise((c, e) => {
		glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
			if (err) {
				return e(err);
			}

			// Add files to the test suite
			files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

			try {
				// Run the mocha test
				mocha.run(failures => {
					if (failures > 0) {
						e(new Error(`${failures} tests failed.`));
					} else {
						c();
					}
				});
			} catch (err) {
				e(err);
			}
		});
	});
}

module.exports = {
	run
};
