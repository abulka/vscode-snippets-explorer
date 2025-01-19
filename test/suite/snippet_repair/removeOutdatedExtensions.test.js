const assert = require('assert');
const { removeOutdatedExtensions, sortMetaArray } = require("../../../lib/snippet_repair/removeOutdatedExtensions");
const { removeSnippetBodies } = require("../../../lib/snippet_repair/removeSnippetBodies");
const { SnippetKind } = require("../../../lib/snippet_kind")
const { expandFixSimpleMetas: recalculateMetas } = require("../../../lib/snippet_repair/expandFixSimpleMetas")

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
        recalculateMetas(snippetTree)

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

    test('remove outdated extension snippets - difficult 2', () => {
        let snippetTree = {
            "python": {
              "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.3.1-darwin-arm64/snippets/python.json": {
                "_meta_": {
                  "languageId": "python",
                  "kind": 3,
                  "kindNiceName": "EXTENSION (provided by an extension)",
                  "extensionPathInfo": {
                    "fullPath": "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.3.1-darwin-arm64/snippets/python.json",
                    "extensionId": "ms-toolsai.jupyter-2024.3.1-darwin-arm", // <- note this is wrong
                    "extensionVersion": "64",  // <- note this is wrong
                    "basename": "python.json"
                  }
                }
              },
              "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.11.0-darwin-arm64/snippets/python.json": {
                "_meta_": {
                  "languageId": "python",
                  "kind": 3,
                  "kindNiceName": "EXTENSION (provided by an extension)",
                  "extensionPathInfo": {
                    "fullPath": "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.11.0-darwin-arm64/snippets/python.json",
                    "extensionId": "ms-toolsai.jupyter-2024.11.0-darwin-arm",
                    "extensionVersion": "64",
                    "basename": "python.json"
                  }
                }
              },
              "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.4.0-darwin-arm64/snippets/python.json": {
                "_meta_": {
                  "languageId": "python",
                  "kind": 3,
                  "kindNiceName": "EXTENSION (provided by an extension)",
                  "extensionPathInfo": {
                    "fullPath": "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.4.0-darwin-arm64/snippets/python.json",
                    "extensionId": "ms-toolsai.jupyter-2024.4.0-darwin-arm",
                    "extensionVersion": "64",
                    "basename": "python.json"
                  }
                }
              },
              "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.5.0-darwin-arm64/snippets/python.json": {
                "_meta_": {
                  "languageId": "python",
                  "kind": 3,
                  "kindNiceName": "EXTENSION (provided by an extension)",
                  "extensionPathInfo": {
                    "fullPath": "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.5.0-darwin-arm64/snippets/python.json",
                    "extensionId": "ms-toolsai.jupyter-2024.5.0-darwin-arm",
                    "extensionVersion": "64",
                    "basename": "python.json"
                  }
                }
              },
              "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.10.0-darwin-arm64/snippets/python.json": {
                "_meta_": {
                  "languageId": "python",
                  "kind": 3,
                  "kindNiceName": "EXTENSION (provided by an extension)",
                  "extensionPathInfo": {
                    "fullPath": "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.10.0-darwin-arm64/snippets/python.json",
                    "extensionId": "ms-toolsai.jupyter-2024.10.0-darwin-arm",
                    "extensionVersion": "64",
                    "basename": "python.json"
                  }
                }
              },
              "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.6.0-darwin-arm64/snippets/python.json": {
                "_meta_": {
                  "languageId": "python",
                  "kind": 3,
                  "kindNiceName": "EXTENSION (provided by an extension)",
                  "extensionPathInfo": {
                    "fullPath": "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.6.0-darwin-arm64/snippets/python.json",
                    "extensionId": "ms-toolsai.jupyter-2024.6.0-darwin-arm",
                    "extensionVersion": "64",
                    "basename": "python.json"
                  }
                }
              },
              "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.7.0-darwin-arm64/snippets/python.json": {
                "_meta_": {
                  "languageId": "python",
                  "kind": 3,
                  "kindNiceName": "EXTENSION (provided by an extension)",
                  "extensionPathInfo": {
                    "fullPath": "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.7.0-darwin-arm64/snippets/python.json",
                    "extensionId": "ms-toolsai.jupyter-2024.7.0-darwin-arm",
                    "extensionVersion": "64",
                    "basename": "python.json"
                  }
                }
              },
              "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.8.1-darwin-arm64/snippets/python.json": {
                "_meta_": {
                  "languageId": "python",
                  "kind": 3,
                  "kindNiceName": "EXTENSION (provided by an extension)",
                  "extensionPathInfo": {
                    "fullPath": "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.8.1-darwin-arm64/snippets/python.json",
                    "extensionId": "ms-toolsai.jupyter-2024.8.1-darwin-arm",
                    "extensionVersion": "64",
                    "basename": "python.json"
                  }
                }
              },
              "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.9.1-darwin-arm64/snippets/python.json": {
                "_meta_": {
                  "languageId": "python",
                  "kind": 3,
                  "kindNiceName": "EXTENSION (provided by an extension)",
                  "extensionPathInfo": {
                    "fullPath": "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.9.1-darwin-arm64/snippets/python.json",
                    "extensionId": "ms-toolsai.jupyter-2024.9.1-darwin-arm",
                    "extensionVersion": "64",
                    "basename": "python.json"
                  }
                }
              }
            }
        }

        // AHA it looks like the _meta_.extensionPathInfo.version is not being calculated correctly
        // the meta data above is all crap, taken from an earlier bad code run.  Let's recalculate it
        recalculateMetas(snippetTree)

        removeOutdatedExtensions(snippetTree)
        assert.deepEqual(Object.keys(snippetTree), ["python"]);

        // we want the most recent one to be picked
        /*
        "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.11.0-darwin-arm64/snippets/python.json" <-- latest
        "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.10.0-darwin-arm64/snippets/python.json"
        "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.9.1-darwin-arm64/snippets/python.json"
        "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.8.1-darwin-arm64/snippets/python.json"
        "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.7.0-darwin-arm64/snippets/python.json"
        "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.6.0-darwin-arm64/snippets/python.json"
        "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.5.0-darwin-arm64/snippets/python.json"
        "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.4.0-darwin-arm64/snippets/python.json"
        "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.3.1-darwin-arm64/snippets/python.json"
        */
        assert.deepEqual(Object.keys(snippetTree.python), ["/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.11.0-darwin-arm64/snippets/python.json"]);
    });

    test('sortMetaArray', () => {
      const metaArray = [
        // {
        //   "languageId": "python",
        //   "extensionPathInfo": {
        //     "fullPath": "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.9.1-darwin-arm64/snippets/python.json",
        //     "extensionId": "ms-toolsai.jupyter",
        //     "extensionVersion": "2024.9.1",
        //     "basename": "python.json"
        //   }
        // },

        // don't need full meta entries just for testing the sort
        { "extensionPathInfo": { extensionVersion: "2024.8.1" } },
        { "extensionPathInfo": { extensionVersion: "2024.10.0" } },
        { "extensionPathInfo": { extensionVersion: "2024.6.0" } },
        { "extensionPathInfo": { extensionVersion: "2024.9.1" } },
        { "extensionPathInfo": { extensionVersion: "2024.7.0" } },
        { "extensionPathInfo": { extensionVersion: "2024.3.1" } },
        { "extensionPathInfo": { extensionVersion: "2024.5.0" } },
        { "extensionPathInfo": { extensionVersion: "2024.11.0" } },
        { "extensionPathInfo": { extensionVersion: "2024.4.0" } },
      ]

      sortMetaArray(metaArray)

      const expected = [
        { "extensionPathInfo": { extensionVersion: "2024.11.0" } },
        { "extensionPathInfo": { extensionVersion: "2024.10.0" } },
        { "extensionPathInfo": { extensionVersion: "2024.9.1" } },
        { "extensionPathInfo": { extensionVersion: "2024.8.1" } },
        { "extensionPathInfo": { extensionVersion: "2024.7.0" } },
        { "extensionPathInfo": { extensionVersion: "2024.6.0" } },
        { "extensionPathInfo": { extensionVersion: "2024.5.0" } },
        { "extensionPathInfo": { extensionVersion: "2024.4.0" } },
        { "extensionPathInfo": { extensionVersion: "2024.3.1" } },
      ]

      assert.deepEqual(metaArray, expected)
    });

});