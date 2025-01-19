// node test/pathPrefixStripTest.js

const { pathPrefixStrip } = require('../../lib/pathPrefixStrip.js');
const assert = require('assert');

// Example usage:
const filePaths = [
    '/Users/andy/Library/Application Support/Code/User/snippets/javascript.json',
    '/Users/andy/.vscode/extensions/sdras.vue-vscode-snippets-3.2.0/snippets/nuxt-config.json'
];

filePaths.forEach(filePath => {
    console.log(pathPrefixStrip(filePath));
});

const expectedResults = [
    'User/snippets/javascript.json',
    'extensions/sdras.vue-vscode-snippets-3.2.0/snippets/nuxt-config.json'
];

filePaths.forEach((filePath, index) => {
    assert.strictEqual(pathPrefixStrip(filePath), expectedResults[index]);
});

console.log('All tests passed.');