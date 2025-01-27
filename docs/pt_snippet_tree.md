# Architecture as PT Diagram (plain text)

```
Scope:
  name: Snippet Tree System
  version: 1.0
  description: A system for managing and displaying code snippets in a tree structure within VSCode.
  files: snippet_tree.js

Files:
  file: snippet_tree.js
    Variables:
      (none)
    Functions:
      (none)
    Classes:
      TreeDataProvider
      TreeItem

Classes:
  class: TreeDataProvider (snippet_tree.js)
    Attributes:
      languageIdTrees: { [languageId: string]: LanguageIdTree }
      expandedStates: { [languageId: string]: Map<string, boolean> }
      _onDidChangeTreeData: vscode.EventEmitter
      onDidChangeTreeData: vscode.Event
      treeview: vscode.TreeView
      areVisible: boolean
      currentLanguageId: string
      itemTree: TreeItem[]
      snippetTree: SnippetTree
    Methods:
      constructor()
      init(): Promise<void>
      setTreeView(treeview: vscode.TreeView): void
      _setupExpandCollapseEventListeners(): void
      _myWorkspaceLanguageIdChangeListener(_event: vscode.TextDocument): void
      _editorChangeListener(event: vscode.TextEditor): void
      _languageOk(languageId: string): boolean
      switchLanguage(languageId: string): Promise<void>
      refresh(): Promise<void>
      _getCurrentDocumentLanguageId(): string | undefined
      _selectSubtree(languageId: string): void
      getParent(element: TreeItem): TreeItem | undefined
      _buildTree(languageId: string): Promise<void>
      logSnippetTree(languageId: string): void
      getTreeItem(element: TreeItem): TreeItem
      getChildren(element?: TreeItem): TreeItem[]
      _filterItems(items: TreeItem[], filterQuery: string): TreeItem[]
      matchesFilter(item: TreeItem, filterQuery: string): boolean
      updateFilterQuery(filterQuery: string): void
      fireOnDidChangeTreeData(): void
      _updateExpandedState(languageId: string, element: TreeItem, isExpanded: boolean): void
      _restoreExpandedStates(languageId: string): void
      _setItemState(item: TreeItem, expandedStates: Map<string, boolean>): void
      _printExpandedTreeItems(expandedStates: Map<string, boolean>): void

  class: TreeItem (snippet_tree.js) --> vscode.TreeItem (inherits)
    Attributes:
      level: number
      children: TreeItem[]
      snippetBody: string | undefined
      andyTooltip: string | undefined
      andyParent: TreeItem | undefined
      iconPath: { light: string, dark: string } | undefined
    Methods:
      constructor(label: string, level: number, children: TreeItem[], snippetKind: SnippetKind, collapsibleState: vscode.TreeItemCollapsibleState)
      get command(): vscode.Command | undefined
      get tooltip(): string | undefined

Class Relationships:
  TreeDataProvider
    --> TreeItem (contains, 0..*)
  TreeItem
    --> vscode.TreeItem (inherits)

Imports:
  snippet_tree.js (class TreeDataProvider, class TreeItem)
    --> vscode (module)
    --> ./snippet_enumerator (function enumerateSnippets)
    --> ./util (function isEmpty)
    --> path (module)
    --> ./snippet_kind (SnippetKind, snippetKindToNiceName)
    --> ./app_logger (function appLog)
    --> ../lib/pathPrefixStrip (function pathPrefixStrip)
    --> ../lib/snippet_scanner (function globalNodeName)

Use Cases:
  Scenario: Initializing TreeDataProvider
    constructor() [class TreeDataProvider, snippet_tree.js]
      initializes attributes and event listeners
      < void

  Scenario: Building Snippet Tree
    _buildTree(languageId: string) [class TreeDataProvider, snippet_tree.js]
      Logs the start of tree building for the given language.
      [if languageId is undefined]
        Initializes `this.itemTree` with a placeholder message.
        < return
      [else]
        Initializes `this.snippetTree` and `this.itemTree` as empty structures.
        -> enumerateSnippets(this.snippetTree, languageId) [./snippet_enumerator]
            Populates `this.snippetTree` with snippets for the given language.
            < void
        -> logSnippetTree(languageId: string) [class TreeDataProvider, snippet_tree.js]
            Logs the structure of `this.snippetTree`.
            < void

        Constructs the tree structure:
        - Iterates over `this.snippetTree` to create `TreeItem` instances for each language.
        - For each language, iterates over its snippets to create nested `TreeItem` instances.
        - Sets tooltips, collapsible states, and parent-child relationships.

        Updates `this.itemTree` with the constructed tree structure.
        Stores the tree in `this.languageIdTrees` for the given language.

        Logs the completion of tree building.
        < void
        
  Scenario: Switching Language
    switchLanguage(languageId: string) [class TreeDataProvider, snippet_tree.js]
      Logs the start of language switching.
      [if languageId is not in this.languageIdTrees]
        -> _buildTree(languageId: string) [class TreeDataProvider, snippet_tree.js]
            Builds the snippet tree for the given language.
            < void
      [else]
        Restores `this.snippetTree` and `this.itemTree` from `this.languageIdTrees`.
        -> _restoreExpandedStates(languageId: string) [class TreeDataProvider, snippet_tree.js]
            Restores the expanded states of tree items for the given language.
            < void
       Fires the tree data change event to refresh the UI.
      -> _selectSubtree(languageId: string) [class TreeDataProvider, snippet_tree.js]
          Selects and reveals the subtree for the given language.
          < void
       Logs the completion of language switching.
      < void

  Scenario: Refreshing the Tree
    refresh() [class TreeDataProvider, snippet_tree.js]
      Logs the start of tree refresh.
      -> _buildTree(this._getCurrentDocumentLanguageId()) [class TreeDataProvider, snippet_tree.js]
          Rebuilds the snippet tree for the current language.
          < void
      Fires the tree data change event to refresh the UI.
      Logs the completion of tree refresh.
      < void

  Scenario: Filtering Tree Items
    updateFilterQuery(filterQuery: string) [class TreeDataProvider, snippet_tree.js]
      -> _filterItems(items: TreeItem[], filterQuery: string) [class TreeDataProvider, snippet_tree.js]
          filters tree items based on the query
          < TreeItem[]
      -> _onDidChangeTreeData.fire() [class TreeDataProvider, snippet_tree.js]
          fires the tree data change event
          < void
      < void
```
