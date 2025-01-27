# snippet_enumerator.js

```
Scope:
  name: Snippet Enumerator
  version: 1.0
  description: Enumerates snippet files for a given language in VS Code.
  files: snippet_enumerator.js

Files:
  file: snippet_enumerator.js
    Variables:
      debugSnippetFileNamesFound: boolean = false
    Functions:
      enumerateSnippets(snippetTree: dict, languageId: string): Promise<dict>
      listSnippets(dir: string, extension: string, kind: SnippetKind, languageId: string, snippetTree: dict, debug: boolean): Promise<void> 
      calcSnippetTreeLength(snippetTree: dict): number
      scanPackageJsonForSnippets(extensionDir: string, languageId: string, snippetTree: dict): Promise<void>
      getUserSnippetsDir(): string
      getThirdPartyExtensionDirs(): Promise<string[]>
      getBundledAppDefaultExtensionDirs(): Promise<string[]>

Class Relationships:
  (None)

Imports:
  snippet_enumerator.js 
    --> vscode (for workspace, env)
    --> fs (for fsp.promises)
    --> path (for path manipulation)
    --> os (for operating system information)
    --> ./snippet_scanner (for scanFiles, scanGlobalFiles, clearAddedFilesCache)
    --> ./snippet_kind (for SnippetKind, snippetKindToNiceName)
    --> ./snippet_repair/removeOutdatedExtensions (for removeOutdatedExtensions)
    --> ./app_logger (for appLog)
    --> ./expandIntoMultipleLanguageIds (for expandIntoMultipleLanguageIds)

Use Cases:

  Scenario: Enumerate Snippets for Language (version 2)
    enumerateSnippets(snippetTree, languageId) 
      Initialise `masterPromises = []` and collect all promises in this array.
      -> expandIntoMultipleLanguageIds(languageId) [./expandIntoMultipleLanguageIds] 
        < string[], languageIds = 
      -> clearAddedFilesCache() [./snippet_scanner] 
      [for each langId in languageIds] 
        [for each workspaceFolder in vscode.workspace.workspaceFolders]
          -> path.join(workspaceFolder.uri.fsPath, '.vscode') 
            < string, vscodeDir =
          -> listSnippets(vscodeDir, '\.code-snippets$', SnippetKind.PROJECT, langId, snippetTree) 
        -> listSnippets(getUserSnippetsDir(), '\.json$', SnippetKind.USER, langId, snippetTree) 
        -> listSnippets(getUserSnippetsDir(), '\.code-snippets$', SnippetKind.GLOBAL_USER, langId, snippetTree, debugSnippetFileNamesFound) 
        -> listSnippets(getUserSnippetsDir(), '\.code-snippets$', SnippetKind.GLOBAL_USER, '', snippetTree, debugSnippetFileNamesFound) 
        [for each dir in await getThirdPartyExtensionDirs()] 
          -> path.join(dir, 'snippets') 
            < string, snippetsDir =
          -> listSnippets(snippetsDir, '\.json$', SnippetKind.EXTENSION, langId, snippetTree, debugSnippetFileNamesFound) 
          -> scanPackageJsonForSnippets(dir, langId, snippetTree) 
        [for each dir in await getBundledAppDefaultExtensionDirs()] 
          -> path.join(dir, 'snippets') 
            < string, snippetsDir =
          -> listSnippets(snippetsDir, '\.code-snippets$', SnippetKind.BUILTIN, langId, snippetTree) 
        -> listSnippets(standaloneSnippetsDir, '\.json$', SnippetKind.USER, langId, snippetTree) 
           standaloneSnippetsDir calculated within the function
      -> await Promise.all(masterPromises) # Wait for all promises to resolve
      -> removeOutdatedExtensions(snippetTree, { warn: true }) [./snippet_repair/removeOutdatedExtensions] 
      [if debugSnippetFileNamesFound]
        Log found snippet file names. 
      < dict # snippetTree

  Scenario: List Snippets in Directory
    listSnippets(dir, extension, kind, languageId, snippetTree, debug) [unknown]
      [try]
      -> await fsp.readdir(dir) [fs.promises]
          reads directory contents
          < string[], snippetFiles =
      Filters `snippetFiles` to match `extension` pattern
      [if kind == SnippetKind.GLOBAL_USER]
      -> await scanGlobalFiles(dir, snippetFiles, kind, languageId, snippetTree) [./snippet_scanner]
          modifies snippetTree with global user snippets
          < void
      [else]
      -> await scanFiles(dir, snippetFiles, kind, languageId, snippetTree) [./snippet_scanner]
          modifies snippetTree with regular snippets
          < void
      [catch]
      Returns early if directory doesn't exist
      < void

  Scenario: Scan Package.json for Snippets
   scanPackageJsonForSnippets(extensionDir, languageId, snippetTree) [unknown]
     -> await fsp.readFile(packageJsonPath, 'utf8') [fs.promises]
        < string, packageJsonContent =
     Parses `packageJsonContent` into JSON object
     < object, packageJson =
     [if contributes and contributes.snippets]
       [loop snippetContribution in contributes.snippets]
         [if snippetContribution.language === languageId]
           -> path.join(extensionDir, snippetContribution.path) [path]
              < string, snippetFilePath =
           Creates array with single path basename
           < string[], snippetFiles =
           -> scanFiles(dir, snippetFiles, SnippetKind.EXTENSION_PACKAGEJSON, languageId, snippetTree) [./snippet_scanner]
              < void

  Scenario: Scan Package.json for Snippets (OLD COMPACT SYNTAX)
    scanPackageJsonForSnippets(extensionDir, languageId, snippetTree)
      -> packageJsonContent = await fsp.readFile(packageJsonPath, 'utf8') [fs.promises] < string
      -> packageJson = JSON.parse(packageJsonContent) 
      [if contributes and contributes.snippets]
        [for each snippetContribution in contributes.snippets]
          [if snippetContribution.language === languageId]
            -> snippetFilePath = path.join(extensionDir, snippetContribution.path) < string
            -> snippetFiles = [path.basename(snippetFilePath)] < string[]
            -> scanFiles(dir, snippetFiles, SnippetKind.EXTENSION_PACKAGEJSON, languageId, snippetTree) [./snippet_scanner] < void

  Scenario: Get User Snippets Directory
    getUserSnippetsDir() 
      Determine settingsPath based on OS.
      < settingsPath 

  Scenario: Get Third-Party Extension Directories
    getThirdPartyExtensionDirs() 
      -> await fsp.readdir(extensionsPath) [fs.promises]
      < string[], extensionsDirs = 
      -> extensionsDirs.map((dir) => path.join(extensionsPath, dir))
      < string[], result =

  Scenario: Get Bundled App Default Extension Directories
    getBundledAppDefaultExtensionDirs() [unknown]
      Determines extensionsPath based on current operating system.
      -> await fsp.readdir(extensionsPath) [fs.promises]
         < string[], extensionsDirs =
      -> path.join() [path] 
         Maps `extensionsDirs` to full paths by joining with `extensionsPath`
         < string[], result =
      < string[]
```
