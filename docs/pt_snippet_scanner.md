# snippet scanner

```
Scope:
  name: Snippet Scanner and Snippet Kind
  version: 1.0
  description: A system for scanning and categorizing code snippets based on language and scope.
  files: snippet_scanner.js, snippet_kind.js

Files:
  file: snippet_scanner.js
    Variables:
      JSON5_PARSER: boolean
      debug: boolean
      addedFilesCache: Set<string>
    Functions:
      scanFiles(dir: string, snippetFiles: string[], kind: SnippetKind, languageId: string, snippetTree: object): Promise<void>
      scanGlobalFiles(dir: string, snippetFiles: string[], kind: SnippetKind, languageId: string, snippetTree: object): Promise<void>
      gatherScanPromises(snippetFiles: string[], languageId: string, dir: string, kind: SnippetKind): Promise[]
      clearAddedFilesCache(): void
      isSnippetFileRelevantToLanguageId(filename: string, languageId: string, dir: string, kind: SnippetKind): { perfectMatch: boolean, extensionPathMatch: boolean, projectDirMatch: boolean }
      scanFile(snippetFile: string, kind: SnippetKind, languageId: string): Promise<{ snippetFile: string, kind: SnippetKind, languageId: string, snippets: object }>
      reportError(errorMessage: string): void
      filterSnippets(snippets: object, scope: string): object
    Classes:
      (none)

  file: snippet_kind.js
    Variables:
      SnippetKind: object
    Functions:
      snippetKindToNiceName(kind: SnippetKind): string
    Classes:
      (none)

Classes:
  (none)

Class Relationships:
  (none)

Imports:
  snippet_scanner.js
    --> vscode (module)
    --> fs.promises (module)
    --> path (module)
    --> jsonc-parser (module)
    --> JSON5 (module)
    --> ./snippet_repair/repairWeirdNestedSnippets (function repairWeirdNestedSnippets)
    --> ./snippet_kind (SnippetKind, snippetKindToNiceName)
    --> ./extensionPathInfo (function createMetaEntry)
    --> ./util (function isEmpty)
    --> ./app_logger (function appLog)
    --> ./expandIntoMultipleLanguageIds (function expandIntoMultipleLanguageIds)

  snippet_kind.js
    --> (none)

Use Cases:
  Scenario: Scanning Snippet Files
    scanFiles(dir: string, snippetFiles: string[], kind: SnippetKind, languageId: string, snippetTree: object) [snippet_scanner.js]
      Logs the start of scanning snippet files for the given language.
      -> gatherScanPromises(snippetFiles: string[], languageId: string, dir: string, kind: SnippetKind) [snippet_scanner.js]
          Gathers promises to scan relevant snippet files.
          < Promise[]
      -> Promise.all(promises) [snippet_scanner.js]
          Waits for all scan promises to resolve.
          < void
      Updates `snippetTree` with the scanned snippets.
      Logs the completion of scanning.

  Scenario: Scanning Global Snippet Files
    scanGlobalFiles(dir: string, snippetFiles: string[], kind: SnippetKind, languageId: string, snippetTree: object) [snippet_scanner.js]
      Logs the start of scanning global snippet files.
      -> fsp.readFile(fullPath: string, 'utf8') [fs.promises]
          Reads the content of the snippet file.
          < string
      -> jsonc.parse(fileContent: string) [jsonc-parser]
          Parses the snippet file content.
          < object
      Filters snippets based on scope and languageId.
      Updates `snippetTree` with the filtered snippets.
      Logs the completion of scanning.

  Scenario: Filtering Snippets by Scope
    filterSnippets(snippets: object, scope: string) [snippet_scanner.js]
      Filters snippets to include only those matching the given scope.
      < object

  Scenario: Determining Snippet File Relevance
    isSnippetFileRelevantToLanguageId(filename: string, languageId: string, dir: string, kind: SnippetKind) [snippet_scanner.js]
      Determines if a snippet file is relevant to the given languageId.
      < { perfectMatch: boolean, extensionPathMatch: boolean, projectDirMatch: boolean }

  Scenario: Converting Snippet Kind to Nice Name
    snippetKindToNiceName(kind: SnippetKind) [snippet_kind.js]
      Converts a SnippetKind enum value to a human-readable string.
      < string

  Scenario: Gathering Scan Promises
    gatherScanPromises(snippetFiles: string[], languageId: string, dir: string, kind: SnippetKind) [snippet_scanner.js]
      Logs the start of gathering scan promises for snippet files.
      Initializes an empty array `promises` to store scan promises.

      Iterates over each file in `snippetFiles`:
        -> isSnippetFileRelevantToLanguageId(f: string, languageId: string, dir: string, kind: SnippetKind) [snippet_scanner.js]
            Determines if the file is relevant to the given `languageId`.
            Returns an object with `perfectMatch`, `extensionPathMatch`, and `projectDirMatch` flags.
            < { perfectMatch: boolean, extensionPathMatch: boolean, projectDirMatch: boolean }

        Constructs the `fullPath` of the file using `path.join(dir, f)`.

        [if (perfectMatch OR extensionPathMatch OR projectDirMatch) AND file is not in `addedFilesCache`]
          -> scanFile(fullPath: string, kind: SnippetKind, languageId: string) [snippet_scanner.js]
              Scans the file and extracts snippets.
              Returns a `scanFileResult` object containing:
                - `snippetFile`: The full path of the file.
                - `kind`: The snippet kind (e.g., USER, EXTENSION).
                - `languageId`: The language ID (e.g., "javascript").
                - `snippets`: A dictionary of snippets extracted from the file.
              < { snippetFile: string, kind: SnippetKind, languageId: string, snippets: object }

          Adds the `scanFile` promise to the `promises` array.
          Adds the `fullPath` to `addedFilesCache` to avoid duplicate scans.
          Logs the scan promise with details about the match type (perfectMatch, extensionPathMatch, or projectDirMatch).

      Returns the `promises` array containing all scan promises.
      < Promise[]

  Scenario: Scanning a Snippet File
    scanFile(snippetFile: string, kind: SnippetKind, languageId: string) [snippet_scanner.js]
      Logs the start of scanning the snippet file.
      -> fsp.readFile(snippetFile: string) [fs.promises]
          Reads the content of the snippet file.
          < string

      -> jsonc.parse(fileContent: string) [jsonc-parser] OR JSON5.parse(fileContent: string) [JSON5]
          Parses the file content into a snippet dictionary.
          < object

      -> repairWeirdNestedSnippets(snippets: object) [./snippet_repair/repairWeirdNestedSnippets]
          Repairs any nested or malformed snippets.
          < object

      [if kind is PROJECT and file extension is `.code-snippets`]
        -> filterSnippets(snippets: object, scope: string) [snippet_scanner.js]
            Filters snippets to include only those matching the given `languageId`.
            < object

      Logs the completion of scanning the file.
      Returns a `scanFileResult` object containing the file path, kind, languageId, and snippets.
      < { snippetFile: string, kind: SnippetKind, languageId: string, snippets: object }
```
