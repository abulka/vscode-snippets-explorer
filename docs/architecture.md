# Architecture

The architecture of the sequence of calls is as follows:

![Architecture](/docs/images/architecture.png)

# Call Sequence

```
class TreeDataProvider
  _buildTree(languageId)
    enumerateSnippets(this.snippetTree, languageId)

enumerateSnippets(snippetTree, languageId)
                       <-- now has internal loop vue, vue-html
  promises.push(listSnippets
  promises.push(listSnippets
  ...
  scanPackageJsonForSnippets(dir, languageId, snippetTree) <-- NEW
    scanFiles  <-- bypasses listSnippets and calls scanFiles directly

listSnippets 

  scanFiles <-- actually adds to snippets tree 🌳

    gatherScanPromises  ->> calls scanFile if isSnippetFileRelevantToLanguageId

      scanFile

      isSnippetFileRelevantToLanguageId
        if (languageId == 'vue')  // Special case for vue files
          validLanguageIds.push('vue-html', 'vue-postcss')


parameters
enumerateSnippets(snippetTree, languageId)

listSnippets(dir, extension, kind, languageId, snippetTree, debug)

scanFiles(dir, snippetFiles, kind, languageId, snippetTree)

gatherScanPromises(snippetFiles, languageId, dir, kind) 

scanFile(snippetFile, kind, languageId)

isSnippetFileRelevantToLanguageId(f, languageId, dir, kind)



a scan promise is a call to

scanFile(snippetFile, kind, languageId)
which scans a JSON file and return snippet dictionary

```

# Debugging

To debug, set the `debug` flag to `true` in the `listSnippets` call in `TreeDataProvider.ts`.

Calls to `appLog` will be logged to the console and to the log file `/Users/andy/Library/Logs/vscode-snippets-explorer/vscode-snippets-explorer-debug.log` which can be viewed in the Mac Console app.

![Debugging](/docs/images/debugging.png)

