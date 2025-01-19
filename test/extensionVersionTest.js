const testRegexPattern = () => {
    // Adjusted regex pattern to correctly capture extension name and version
    const pattern = /.*\/extensions\/([^\/]+?)(?:-([\d\.]+))?(?:-[a-zA-Z0-9-]+)?\/snippets\/(.*)/;

    const testCases = [
        // Standard cases
        "/Users/andy/.vscode/extensions/ms-python.python-2019.6.96456/snippets/python.json",
        "/Users/andy/.vscode/extensions/ms-python.python-2020.7.96456/snippets/python.json",
        "/Users/Andy/.vscode/extensions/dart-code.dart-code-3.13.2/snippets/dart.json",
        "/Users/Andy/.vscode/extensions/dart-code.dart-code-3.13.2/snippets/flutter.json",
        "/Applications/Visual Studio Code.app/Contents/Resources/app/extensions/javascript/snippets/javascript.code-snippets",
        // Platform-specific case
        "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.3.1-darwin-arm64/snippets/python.json"
    ];

    console.log("Testing regex pattern:", pattern, "\n");
    testCases.forEach(testPath => {
        const match = testPath.match(pattern);
        if (match) {
            const extensionName = match[1];
            const version = match[2] || "no version";
            const snippetName = match[3];
            console.log(`Path: ${testPath}`);
            console.log(`  Extension: ${extensionName}`);
            console.log(`  Version: ${version}`);
            console.log(`  Snippet: ${snippetName}`);
            console.log();
        }
    });
};

testRegexPattern();