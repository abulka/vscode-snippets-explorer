# Architecture

The architecture of the sequence of calls is as follows:

- Old architecture [here](/docs/pt_old_1.0.6.md)
- Current 1.0.8 architecture [here](/docs/pt_snippet_tree.md)

## Useful Parameters

```typescript
parameters
enumerateSnippets(snippetTree, languageId)

listSnippets(dir, extension, kind, languageId, snippetTree, debug)

scanFiles(dir, snippetFiles, kind, languageId, snippetTree)

gatherScanPromises(snippetFiles, languageId, dir, kind) 

scanFile(snippetFile, kind, languageId)

isSnippetFileRelevantToLanguageId(f, languageId, dir, kind)
```


## A scan promise 

is a call to
```
scanFile(snippetFile, kind, languageId)
```
which scans a JSON file and return snippet dictionary
