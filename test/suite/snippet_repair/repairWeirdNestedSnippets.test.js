const assert = require('assert');
const { repairWeirdNestedSnippets } = require("../../../lib/snippet_repair/repairWeirdNestedSnippets");

suite('Repair Weird nested snippets', () => {

    test('repairWeirdNestedSnippets fixes one level', () => {
        let snippets = {
            ".source.dart": {
                "main": {
                    "prefix": "main",
                    "description": "Insert a main function, used as an entry point.",
                    "body": [
                        "main(List<String> args) {",
                        "  $0",
                        "}"
                    ]
                },
                "try": {
                    "prefix": "try",
                    "description": "Insert a try/catch block.",
                    "body": [
                        "try {",
                        "  $0",
                        "} catch (${1:e}) {",
                        "}"
                    ]
                },
            }
        }
        let newSnippets = repairWeirdNestedSnippets(snippets)
        assert.deepEqual(Object.keys(newSnippets), ["main", "try"]);
    });

    test('repairWeirdNestedSnippets fixes two sibling levels', () => {
        let snippets = {
            ".source.dart": {
                "main": {
                    "prefix": "main",
                    "description": "Insert a main function, used as an entry point.",
                    "body": [
                        "main(List<String> args) {",
                        "  $0",
                        "}"
                    ]
                },
                "try": {
                    "prefix": "try",
                    "description": "Insert a try/catch block.",
                    "body": [
                        "try {",
                        "  $0",
                        "} catch (${1:e}) {",
                        "}"
                    ]
                },
            },
            ".source.blah": {
                "fred": {
                    "prefix": "main",
                    "description": "Insert a main function, used as an entry point.",
                    "body": [
                        "main(List<String> args) {",
                        "  $0",
                        "}"
                    ]
                },
                "mary": {
                    "prefix": "try",
                    "description": "Insert a try/catch block.",
                    "body": [
                        "try {",
                        "  $0",
                        "} catch (${1:e}) {",
                        "}"
                    ]
                },
            }
        }
        let newSnippets = repairWeirdNestedSnippets(snippets)
        assert.deepEqual(Object.keys(newSnippets), ["main", "try", "fred", "mary"]);
    });

});

