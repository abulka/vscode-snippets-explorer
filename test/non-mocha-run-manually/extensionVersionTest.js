const assert = require('assert');

// node test/non-mocha-run-manually/extensionVersionTest.js

const testRegexPattern = () => {
    // Adjusted regex pattern to correctly capture extension name and version
    const pattern = /.*\/extensions\/([^\/]+?)(?:-([\d\.]+))?(?:-[a-zA-Z0-9-]+)?\/snippets\/(.*)/;

    const testCases = [
        // Standard cases
        {
            path: "/Users/andy/.vscode/extensions/ms-python.python-2019.6.96456/snippets/python.json",
            expected: { extensionName: "ms-python.python", version: "2019.6.96456", snippetName: "python.json" }
        },
        {
            path: "/Users/andy/.vscode/extensions/ms-python.python-2020.7.96456/snippets/python.json",
            expected: { extensionName: "ms-python.python", version: "2020.7.96456", snippetName: "python.json" }
        },
        {
            path: "/Users/Andy/.vscode/extensions/dart-code.dart-code-3.13.2/snippets/dart.json",
            expected: { extensionName: "dart-code.dart-code", version: "3.13.2", snippetName: "dart.json" }
        },
        {
            path: "/Users/Andy/.vscode/extensions/dart-code.dart-code-3.13.2/snippets/flutter.json",
            expected: { extensionName: "dart-code.dart-code", version: "3.13.2", snippetName: "flutter.json" }
        },
        {
            path: "/Applications/Visual Studio Code.app/Contents/Resources/app/extensions/javascript/snippets/javascript.code-snippets",
            expected: { extensionName: "javascript", version: "no version", snippetName: "javascript.code-snippets" }
        },
        // Platform-specific case
        {
            path: "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.3.1-darwin-arm64/snippets/python.json",
            expected: { extensionName: "ms-toolsai.jupyter", version: "2024.3.1", snippetName: "python.json" }
        }
    ];

    console.log("Testing regex pattern:", pattern, "\n");
    testCases.forEach(testCase => {
        const match = testCase.path.match(pattern);
        if (match) {
            const extensionName = match[1];
            const version = match[2] || "no version";
            const snippetName = match[3];
            console.log(`Path: ${testCase.path}`);
            console.log(`  Extension: ${extensionName}`);
            console.log(`  Version: ${version}`);
            console.log(`  Snippet: ${snippetName}`);
            console.log();

            assert.strictEqual(extensionName, testCase.expected.extensionName);
            assert.strictEqual(version, testCase.expected.version);
            assert.strictEqual(snippetName, testCase.expected.snippetName);
        } else {
            assert.fail(`Pattern did not match for path: ${testCase.path}`);
        }
    });
    console.log("All tests passed.");
};

testRegexPattern();