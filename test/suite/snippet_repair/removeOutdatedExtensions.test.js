const assert = require('assert');
const { removeOutdatedExtensions } = require("../../../lib/snippet_repair/removeOutdatedExtensions");
const { removeSnippetBodies } = require("../../../lib/snippet_repair/removeSnippetBodies");
const { SnippetKind } = require("../../../lib/snippet_kind")
const { createMetaEntry } = require("../../../lib/extensionPathInfo")

suite('Remove outdated extension snippets', () => {

    test('remove outdated extension snippets', () => {
        let snippetTree = {
            "python": {
                "/Users/andy/.vscode/extensions/ms-python.python-2019.6.96456/snippets/python.json": {
                    "_meta_": {
                        "languageId": "python",
                        "kind": SnippetKind.EXTENSION,
                        "kindNiceName": "EXTENSION",
                        "extensionPathInfo": {
                            "fullPath": "/Users/andy/.vscode/extensions/ms-python.python-2019.6.96456/snippets/python.json",
                            "extensionId": "ms-python.python",
                            "extensionVersion": "2019.6.96456",
                            "basename": "python.json"
                        }
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
                        "languageId": "python",
                        "kind": SnippetKind.EXTENSION,
                        "kindNiceName": "EXTENSION",
                        "extensionPathInfo": {
                            "fullPath": "/Users/andy/.vscode/extensions/ms-python.python-2020.7.96456/snippets/python.json",
                            "extensionId": "ms-python.python",
                            "extensionVersion": "2020.7.96456",
                            "basename": "python.json"
                        }
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
        removeOutdatedExtensions(snippetTree)
        assert.deepEqual(Object.keys(snippetTree), ["python"]);
        // we want the last one to be picked
        assert.deepEqual(Object.keys(snippetTree.python), ["/Users/andy/.vscode/extensions/ms-python.python-2020.7.96456/snippets/python.json"]);
    });

    test('remove outdated extension snippets - difficult', () => {  // to skip use test.skip()
        let snippetTree = {
            "python": {
                "/Users/Andy/Library/Application Support/Code/User/snippets/python.json": {
                    "_meta_": { "kind": SnippetKind.USER }
                },
                "/Users/Andy/.vscode/extensions/.ms-python.python-2018.9.1/snippets/python.json": {
                    "_meta_": { "kind": SnippetKind.EXTENSION }
                },
                "/Users/Andy/.vscode/extensions/ms-python.python-2020.7.96456/snippets/python.json": {
                    "_meta_": { "kind": SnippetKind.EXTENSION }
                }
            },
            "dart": {
                "/Users/Andy/.vscode/extensions/dart-code.dart-code-3.13.2/snippets/dart.json": {
                    "_meta_": { "kind": SnippetKind.EXTENSION }
                },
                "/Users/Andy/.vscode/extensions/dart-code.dart-code-3.13.2/snippets/flutter.json": {
                    "_meta_": { "kind": SnippetKind.EXTENSION }
                },
                "/Users/Andy/.vscode/extensions/dart-code.dart-code-3.13.1/snippets/dart.json": {
                    "_meta_": { "kind": SnippetKind.EXTENSION }
                },
            },
            "flutter": {
                "/Users/Andy/.vscode/extensions/dart-code.dart-code-3.13.2/snippets/flutter.json": {
                    "_meta_": { "kind": SnippetKind.EXTENSION }
                },
                "/Users/Andy/.vscode/extensions/nash.awesome-flutter-snippets-2.0.4/snippets/snippets.json": {
                    "_meta_": { "kind": SnippetKind.EXTENSION }
                }
            },
            "javascript": {
                "/Users/Andy/Library/Application Support/Code/User/snippets/javascript.json": {
                    "_meta_": { "kind": SnippetKind.USER }
                },
                "/Applications/Visual Studio Code.app/Contents/Resources/app/extensions/javascript/snippets/javascript.code-snippets": {
                    "_meta_": { "kind": SnippetKind.BUILTIN }
                }
            }
        }

        /** Our test data has simple meta with kind only - fix */
        function _fixMetas(snippetTree) {
            // eslint-disable-next-line no-unused-vars
            for (const [languageId, fullPathsDict] of Object.entries(snippetTree)) {
                for (const [fullPath, snippetsDict] of Object.entries(fullPathsDict)) {
                    let kind = snippetsDict._meta_.kind
                    createMetaEntry(snippetsDict, languageId, kind, fullPath)
                }
            }
        }
        _fixMetas(snippetTree)

        let expectedSnippetsStructure = {  // not sure how to compare properly yet with a filled in snippet structure
            "python": {
                "/Users/Andy/Library/Application Support/Code/User/snippets/python.json": {},
                // "/Users/Andy/.vscode/extensions/.ms-python.python-2018.9.1/snippets/python.json": {}, <- remove (note tricky leading .)
                "/Users/Andy/.vscode/extensions/ms-python.python-2020.7.96456/snippets/python.json": {}
            },
            "dart": {
                "/Users/Andy/.vscode/extensions/dart-code.dart-code-3.13.2/snippets/dart.json": {},
                "/Users/Andy/.vscode/extensions/dart-code.dart-code-3.13.2/snippets/flutter.json": {},
                // "/Users/Andy/.vscode/extensions/dart-code.dart-code-3.13.1/snippets/dart.json": {}, <- remove
            },
            "flutter": {
                "/Users/Andy/.vscode/extensions/dart-code.dart-code-3.13.2/snippets/flutter.json": {}, // <- allow duplicate
                "/Users/Andy/.vscode/extensions/nash.awesome-flutter-snippets-2.0.4/snippets/snippets.json": {}
            },
            "javascript": {
                "/Users/Andy/Library/Application Support/Code/User/snippets/javascript.json": {},
                "/Applications/Visual Studio Code.app/Contents/Resources/app/extensions/javascript/snippets/javascript.code-snippets": {}
            }
        }
        removeOutdatedExtensions(snippetTree)
        assert.deepEqual(Object.keys(snippetTree), ["python", "dart", "flutter", "javascript"]); // sanity test
        removeSnippetBodies(snippetTree)  // just so can compare to above simplified, expected structure
        assert.deepEqual(snippetTree, expectedSnippetsStructure);
    });

});

