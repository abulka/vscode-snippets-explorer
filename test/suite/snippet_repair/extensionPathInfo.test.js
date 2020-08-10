const assert = require('assert');
const { ExtensionPathInfo, createMetaEntry } = require('../../../lib/extensionPathInfo')

suite('ExtensionPathInfo', () => {

  test('scan python extension', () => {
    let info = new ExtensionPathInfo('/Users/andy/.vscode/extensions/ms-python.python-2019.6.96456/snippets/python.json')
    assert.equal(info.extensionId, 'ms-python.python');
    assert.equal(info.extensionVersion, '2019.6.96456');
    assert.equal(info.basename, 'python.json');
  });

  test('scan dart extension', () => {
    let info = new ExtensionPathInfo('/Users/Andy/.vscode/extensions/dart-code.dart-code-3.13.2/snippets/dart.json')
    assert.equal(info.extensionId, 'dart-code.dart-code');
    assert.equal(info.extensionVersion, '3.13.2');
    assert.equal(info.basename, 'dart.json');
  });

  test('scan javascript extension, no version', () => {
    let info = new ExtensionPathInfo('/Applications/Visual Studio Code.app/Contents/Resources/app/extensions/javascript/snippets/javascript.code-snippets')
    assert.equal(info.extensionId, 'javascript');
    assert.equal(info.extensionVersion, '');
    assert.equal(info.basename, 'javascript.code-snippets');
  });

  test('scan python extension with . in it', () => {
    let info = new ExtensionPathInfo('/Users/Andy/.vscode/extensions/.ms-python.python-2018.9.1/snippets/python.json')
    assert.equal(info.extensionId, 'ms-python.python');
    assert.equal(info.extensionVersion, '2018.9.1');
    assert.equal(info.basename, 'python.json');
  });

  // Still need to fill in meta info as much as possible for non 3rd party extenstion snippet paths,.
  // Do the best we can to fill in the meta info with something sensible. Not used in removing duplicate
  // extensions (which is the primary reason for the ExtensionPathInfo) but its also used in label treeview display

  test('scan python user snippet path', () => {
    let info = new ExtensionPathInfo('/Users/Andy/Library/Application Support/Code/User/snippets/python.json')
    assert.equal(info.extensionId, 'python.json');
    assert.equal(info.extensionVersion, '');
    assert.equal(info.basename, 'python.json');
  });

})

suite('createMetaEntry', () => {

  test('create meta entry for python user snippets', () => {

    // start with pure snippets - no meta info
    let fullPathsDict = {
      "/Users/andy/.vscode/extensions/ms-python.python-2020.7.96456/snippets/python.json": {
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

    let fullPath = "/Users/andy/.vscode/extensions/ms-python.python-2020.7.96456/snippets/python.json"
    let languageId = "python"
    let kind = 2
    let snippetsDict = fullPathsDict[fullPath]

    createMetaEntry(snippetsDict, languageId, kind, fullPath) // TODO can't we derive languageId, kind, ?

    let expectedMetaDict = {
      "kind": 2,
      "kindNiceName": "USER",
      "languageId": "python",
      "extensionPathInfo": {
        "fullPath": "/Users/andy/.vscode/extensions/ms-python.python-2020.7.96456/snippets/python.json",
        "extensionId": "ms-python.python",
        "extensionVersion": "2020.7.96456",
        "basename": "python.json"
      }
    }
    assert.deepEqual(snippetsDict._meta_, expectedMetaDict)
  });


})
