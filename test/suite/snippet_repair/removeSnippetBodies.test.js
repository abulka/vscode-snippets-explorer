const assert = require('assert');
const { removeSnippetBodies } = require("../../../lib/snippet_repair/removeSnippetBodies");

suite('Remove snippet bodies (util for testing)', () => {

    test('repairWeirdNestedSnippets fixes one level', () => {
        let snippets = {
            "python": {
                "/Users/andy/.vscode/extensions/ms-python.python-2019.6.96456/snippets/python.json": {
                    "_meta_": {
                        "kind": 1,
                        "kindNiceName": "EXTENSION",
                        "languageId": "python",
                        "extensionId": "ms-python.python-",
                        "fullPath": "/Users/andy/.vscode/extensions/ms-python.python-2019.6.96456/snippets/python.json",
                    },
                    "name1": {
                        "prefix": "prefix1",
                        "body": [],
                        "description": "description1"
                    },
                    "name2": {
                        "prefix": "prefix2",
                        "body": [],
                        "description": "description2"
                    }
                },
                "/Users/andy/.vscode/extensions/ms-python.python-2020.7.96456/snippets/python.json": {
                    "_meta_": {
                        "kind": 1,
                        "kindNiceName": "EXTENSION",
                        "languageId": "python",
                        "extensionId": "ms-python.python-",
                        "fullPath": "/Users/andy/.vscode/extensions/ms-python.python-2020.7.96456/snippets/python.json",
                    },
                    "name1": {
                        "prefix": "prefix1",
                        "body": [],
                        "description": "description1"
                    },
                    "name2": {
                        "prefix": "prefix2",
                        "body": [],
                        "description": "description2"
                    }
                }
            }
        }
        let expectedSnippets = {
            "python": {
                "/Users/andy/.vscode/extensions/ms-python.python-2019.6.96456/snippets/python.json": {},
                "/Users/andy/.vscode/extensions/ms-python.python-2020.7.96456/snippets/python.json": {}
            }
        }
        removeSnippetBodies(snippets)
        assert.deepEqual(snippets, expectedSnippets);
    });

});

