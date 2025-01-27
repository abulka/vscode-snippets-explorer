# v1.0.6 Architecture

(old, outdated)

Sequence of calls is as follows:

![Architecture](/docs/images/architecture.png)

### as text

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

```
