const assert = require('assert');
const { SnippetKind, snippetKindToNiceName } = require("../../lib/snippet_kind");

suite('Snippet general tests', () => {

    test('snippetKindToNiceName has nice names', () => {
        assert.equal(snippetKindToNiceName(SnippetKind.PROJECT), "PROJECT (defined in this project)");
        assert.equal(snippetKindToNiceName(SnippetKind.USER), "USER (user defined)");
        // etc.
    });

});
