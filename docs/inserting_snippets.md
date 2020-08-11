# how to insert snippets programmatically

https://stackoverflow.com/questions/45082780/how-do-i-add-a-snippet-programmatically

@joshea I also had no luck inserting an existing snippet programmatically from my vscode extension code using e.g. `editor.insertSnippet({ langId: "javascript", name: "module_exports" }` - though I might have the syntax wrong. It seems a string is required like the doco says. Sure, the `"editor.action.insertSnippet"` keybinding command takes those fancy `"langId"` and `"name"` args but not `editor.insertSnippet`. However, as @Mike-Lischke suggested, I managed to programmatically do it using `vscode.commands.executeCommand` instead e.g. `vscode.commands.executeCommand("editor.action.insertSnippet", { langId: "javascript", name: "For Loop" })`.

```json
{
  "key": "cmd+k 1",
  "command": "editor.action.insertSnippet",
  "when": "editorTextFocus",
  "args": {
    "langId": "csharp",
    "name": "myFavSnippet"
  }
}
```

See also [finding_snippets_doco.md](finding_snippets_doco.md)
