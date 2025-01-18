# New way to add snippets

If detect an extension package.json with a `contributes.snippets` section, then the snippets will be loaded from the paths specified in that section.

This is a new feature in version 1.7 of the extension.

```json
	"contributes": {
		"snippets": [
			{
				"language": "html",
				"path": "./snippets/html-snippets.json"
			},
			{
				"language": "vue-html",
				"path": "./snippets/html-snippets.json"
			},
			{
				"language": "jade",
				"path": "./snippets/jade-snippets.json"
			},
			{
				"language": "vue-jade",
				"path": "./snippets/jade-snippets.json"
			}
		]
	},
```

// vscode search: "contributes"[\s\S\r]*"snippetXs" (remove the X)

