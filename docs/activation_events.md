# Usually I declared

```json
	"activationEvents": [
		"onCommand:extension.snippet_inserter",  <-- removed
		"onCommand:extension.enumerateSnippets",
		"onView:exampleView",
		"onView:snippetsExplorerView"  <-- removed
	],
```

in package.json however in later versions of vscode, I got the warning:

```
This activation event can be removed for extensions targeting engine version ^1.75 as VS Code will generate these automatically from your package.json contribution declarations.
```

so I removed them. Things seem to still work.
