const assert = require('assert');
const { isSnippetFileRelevantToLanguageId } = require("../../lib/snippet_scanner");
const { SnippetKind } = require('../../lib/snippet_kind')

/*
Ensure scanning for 'dart' also picks up flutter related snippets.

info:   Found (dart) - /Users/andy/Library/Application Support/Code/User/snippets/dart.json
info:   Found (dart) - /Users/andy/.vscode/extensions/alexisvt.flutter-snippets-2.0.0/snippets/dart.json
info:   Found (dart) - /Users/andy/.vscode/extensions/dart-code.dart-code-3.24.2/snippets/dart.json
info:   Found (dart) - /Users/andy/.vscode/extensions/dart-code.dart-code-3.24.2/snippets/flutter.json
info:   Found (dart) - /Users/andy/.vscode/extensions/waseemdev.flutter-xml-layout-0.0.31/snippets/dart.json
info:   Found (flutter) - /Users/andy/.vscode/extensions/alexisvt.flutter-snippets-2.0.0/snippets/dart.json
info:   Found (flutter) - /Users/andy/.vscode/extensions/dart-code.dart-code-3.24.2/snippets/flutter.json
info:   Found (flutter) - /Users/andy/.vscode/extensions/waseemdev.flutter-xml-layout-0.0.31/snippets/dart.json
info:   Found (flutter) - /Users/andy/.vscode/extensions/waseemdev.flutter-xml-layout-0.0.31/snippets/xml.json
info:   Found (flutter) - /Users/andy/.vscode/extensions/nash.awesome-flutter-snippets-3.0.1/snippets/snippets.json
*/

suite('Dart and Flutter categorisation', () => {

    test('initial', () => {
        const dir = '/Users/andy/Library/Application Support/Code/User/snippets'
        const filename = 'dart.json'
        const kind = SnippetKind.BUILTIN
        const languageId = 'dart'
        let { perfectMatch, extensionPathMatch, projectDirMatch } = isSnippetFileRelevantToLanguageId(filename, languageId, dir, kind)
        assert.ok(perfectMatch)
        assert.ok(!extensionPathMatch)
        assert.ok(!projectDirMatch)
    });

    test('dart pass only', () => {
        const dir = 'User/snippets'
        const f = 'dart.json'
        const kind = SnippetKind.USER
        let res = isSnippetFileRelevantToLanguageId(f, 'dart', dir, kind)
        assert.ok(res.perfectMatch)
        assert.ok(!res.extensionPathMatch)
        assert.ok(!res.projectDirMatch)

        res = isSnippetFileRelevantToLanguageId(f, 'flutter', dir, kind)
        assert.ok(!res.perfectMatch)
        assert(!res.extensionPathMatch)
        assert(!res.projectDirMatch)
    });

    test('v2 behaviour', () => {

        // we dont' ever pass in kind of SnippetKind.PROJECT for now, thus projectDirMatch is always false,

        const data = [
            {
                usecase: 1,
                languageId: 'dart',
                dir: '/Users/andy/Library/Application Support/Code/User/snippets',
                filename: 'dart.json',
                'kind': SnippetKind.USER,
                expectedResult: {
                    perfectMatch: true,
                    extensionPathMatch: false,
                    projectDirMatch: false,
                }
            },
            {
                usecase: 2,
                languageId: 'dart',
                dir: '/Users/andy/.vscode/extensions/alexisvt.flutter-snippets-2.0.0/snippets',
                filename: 'dart.json',
                'kind': SnippetKind.EXTENSION,
                expectedResult: {
                    perfectMatch: true,
                    extensionPathMatch:  true,  // cos 'flutter-' is in the dir path
                    projectDirMatch: false,
                }
            },
            {
                usecase: 3,
                languageId: 'dart',
                dir: '/Users/andy/.vscode/extensions/dart-code.dart-code-3.24.2/snippets',
                filename: 'dart.json',
                'kind': SnippetKind.EXTENSION,
                expectedResult: {
                    perfectMatch: true,        // both true
                    extensionPathMatch: true,  // both true
                    projectDirMatch: false,
                }
            },
            {
                usecase: 4,
                languageId: 'dart',
                dir: '/Users/andy/.vscode/extensions/dart-code.dart-code-3.24.2/snippets',
                filename: 'flutter.json',
                'kind': SnippetKind.EXTENSION,
                expectedResult: {
                    perfectMatch: true,  // because dart means flutter too
                    extensionPathMatch: true, // and 'dart-' in extension dir path, so true
                    projectDirMatch: false,
                }
            },
            {
                usecase: 5,
                languageId: 'dart',
                dir: '/Users/andy/.vscode/extensions/waseemdev.flutter-xml-layout-0.0.31/snippets',
                filename: 'dart.json',
                'kind': SnippetKind.EXTENSION,
                expectedResult: {
                    perfectMatch: true,
                    extensionPathMatch: true,  // cos 'flutter-' is in the dir path
                    projectDirMatch: false,
                }
            },

            // Ensure 'flutter' snippets are also picked up, synonymously with dart.
            {
                usecase: 10,
                languageId: 'dart',
                dir: '/Users/andy/.vscode/extensions/alexisvt.flutter-snippets-2.0.0/snippets',
                filename: 'dart.json',
                'kind': SnippetKind.EXTENSION,
                expectedResult: {
                    perfectMatch: true,
                    extensionPathMatch:  true,  // cos 'flutter-' is in the dir path
                    projectDirMatch: false,
                }
            },
            {
                usecase: 11,
                languageId: 'dart',
                dir: '/Users/andy/.vscode/extensions/dart-code.dart-code-3.24.2/snippets',
                filename: 'flutter.json',
                'kind': SnippetKind.EXTENSION,
                expectedResult: {
                    perfectMatch: true,
                    extensionPathMatch: true,
                    projectDirMatch: false,
                }
            },
            {
                usecase: 12,
                languageId: 'dart',
                dir: '/Users/andy/.vscode/extensions/waseemdev.flutter-xml-layout-0.0.31/snippets',
                filename: 'dart.json',
                'kind': SnippetKind.EXTENSION,
                expectedResult: {
                    perfectMatch: true,
                    extensionPathMatch:  true,  // cos 'flutter-' is in the dir path
                    projectDirMatch: false,
                }
            },
            {
                // Its an xml file so not relevant to 'dart' even though 'flutter' is in the path
                usecase: 13,
                languageId: 'dart',
                dir: '/Users/andy/.vscode/extensions/waseemdev.flutter-xml-layout-0.0.31/snippets',
                filename: 'xml.json',
                'kind': SnippetKind.EXTENSION,
                expectedResult: {
                    perfectMatch: false,
                    extensionPathMatch: false,
                    projectDirMatch: false,
                }
            },
            {
                usecase: 14,
                languageId: 'dart',
                dir: '/Users/andy/.vscode/extensions/nash.awesome-flutter-snippets-3.0.1/snippets',
                filename: 'snippets.json',
                'kind': SnippetKind.EXTENSION,
                expectedResult: {
                    perfectMatch: false,
                    extensionPathMatch: true,  // cos its a generic file name and extension dir path 'flutter-'
                    projectDirMatch: false,
                }
            },
        ]
        // loop through data
        for (const { usecase, languageId, dir, filename, kind, expectedResult } of data) {
            // console.log('usecase', usecase)
            // if (usecase != 14)
            //     continue
            let res = isSnippetFileRelevantToLanguageId(filename, languageId, dir, kind)
            const msg = `use case ${usecase}: '${languageId}' filename=${dir}/${filename} expectedResult=\n${JSON.stringify(expectedResult)}, got\n${JSON.stringify(res)}`
            assert.strictEqual(res.perfectMatch, expectedResult.perfectMatch, 'perfectMatch differs ' + msg)
            assert.strictEqual(res.extensionPathMatch, expectedResult.extensionPathMatch, 'extensionPathMatch differs ' + msg)
            assert.strictEqual(res.projectDirMatch, expectedResult.projectDirMatch, msg)
        }
    });

});

