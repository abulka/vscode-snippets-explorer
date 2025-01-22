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

# Outdated Pseudocode

```
/*
Copilot Pseudocode (outdated)

Initialize TreeDataProvider
  Set up event listeners
  Initialize empty snippetTree

Call init
  Call _rebuildTree with current document's language ID

When a new language needs to be added
  Call addLanguage with new language ID
    If language doesn't exist in snippetTree
      Call _rebuildTree with new language ID
      Fire onDidChangeTreeData event to rebuild tree in UI

_rebuildTree
  Create list of build jobs (just new language ID)
  Pass build jobs to _runJobs

// _runJobs DEPRECATED
//   For each job (language ID)
//     Call _buildTree

_buildTree
  Call enumerateSnippets to add snippets for language ID to snippetTree
  Construct treeview of TreeItems based on snippetTree

getChildren
  Return children of given tree item or root items if no item given

TreeItem
  Represents an item in the tree
  Can have a command to insert snippet when clicked

*/
```

## Sequence Diagram (outdated)

```
TreeDataProvider()
    -> constructor()
        initializes properties
        sets up event listeners

    -> init()
        calls _rebuildTree()

    -> setTreeView(treeview)
        sets treeview property
        sets up visibility event listener

    -> _visibilityChangeListener(event)
        updates areVisible property

    -> _myWorkspaceLanguageIdChangeListener(event)
        checks if language is OK
        calls addLanguage()

    -> _editorChangeListener(event)
        checks if language is OK
        calls addLanguage()

    -> addLanguage(languageId)
        checks if language needs to be added
        calls _rebuildTree()
            -> _runJobs()
                -> _buildTree()
                    scans filesystem for snippets
                    builds treeview
        calls refresh()
            -> clears tree
            -> rebuilds tree
                -> _rebuildTree()
                    -> _runJobs()
                        -> _buildTree()
                            scans filesystem for snippets
                            builds treeview
        fires onDidChangeTreeData event

    -> _rebuildTree(languageId)
        calls _runJobs()
            -> _buildTree()
                scans filesystem for snippets
                builds treeview

    -> _runJobs(buildJobs)
        calls _buildTree() for each job
            -> _buildTree()
                scans filesystem for snippets
                builds treeview

    -> _buildTree(languageId)
        scans filesystem for snippets
        builds treeview

    -> refresh(options)
        clears tree
        rebuilds tree
            -> _rebuildTree()
                -> _runJobs()
                    -> _buildTree()
                        scans filesystem for snippets
                        builds treeview
        fires onDidChangeTreeData event

    -> getTreeItem(element)
        returns element
        < TreeItem

    -> getChildren(element)
        returns children of element
        < TreeItem[]
```


