# Switching trees - Expanded states

When Switching trees the tree is expanded to the same level as the previous time you viewed the tree. This is useful when you are switching between trees and want to see the same level of detail each time.

## Example

1. Open a tree and expand a few levels
2. Switch to another tree
3. Switch back to the first tree
4. The tree is expanded to the same level as before

## Notes

Question: Curious how the initial expanded states for a fresh languageId tree are created - there is no wholesale saving of expanded treestate after an initial buildtree. doesn't seem necessary cos the code works, but i am curious

### Answer
Great question! In the current implementation, the expanded states are dynamically captured as the user interacts with the tree view by expanding and collapsing items. When a new language ID's tree is first built, all items will be in their default collapsed state.

The mechanism works like this:

- When a new language ID tree is first created via _buildTree(), all tree items are likely in a default collapsed state.
- As the user expands and collapses items, the _updateExpandedState() method captures these interactions in the expandedStates Map.
- When switching back to a language ID, _restoreExpandedStates() will apply these previously captured expanded states.

So for a fresh tree, no initial expanded states are saved. Instead, the states are organic - built up through user interaction. This approach has a few advantages:

- Minimal overhead of not pre-saving states
- Allows user to naturally define their preferred tree view layout
- Adapts to how the user actually uses the tree view

### Efficiency

The current implementation is efficient because it only saves expanded states when the user interacts with the tree view. This means that only the expanded states that the user actually cares about are saved. If the user never expands any items, then no expanded states are saved.

```js
_updateExpandedState(languageId, element, isExpanded) {
    if (!this.expandedStates[languageId]) {
        this.expandedStates[languageId] = new Map();
    }

    // Only save state for first two levels
    if (element.level <= 2) {
        this.expandedStates[languageId].set(element.label, isExpanded);
        appLog(`${isExpanded ? 'Expanded' : 'Collapsed'}: ${element.label}`);
    }
}
```

This means:

- Only items that the user has actually interacted with (expanded or collapsed) get added to the expandedStates Map
- The Map will only contain entries for items that have changed from their default state
- No unnecessary storage of unchanged items
- Memory-efficient approach that only tracks the specific state changes made by the user

When you later call _restoreExpandedStates(), it will:

- Look up the saved states for the specific language ID
- Apply only the recorded expanded/collapsed states
- Leave other items in their default state

This approach is both memory-efficient and user-centric, allowing the tree view to adapt to individual user interactions with minimal overhead.

## Implementation Note - TreeItem Levels

In the example above, we only save expanded states for the first two levels of the tree. 

Only process first two levels (1=language and 2=kind) for expanded states - 3=snippets have no children anyway

### Example TreeItem levels:

```
Language (level 1, e.g. 'javaScript')
  Kind (level 2, e.g. 'USER snippets')
    Snippet
    Snippet
    Snippet
  Kind (level 2, e.g. 'EXTENSION snippets')
    Snippet
    Snippet
    Snippet
Language (level 1, e.g. 'python')
  Kind
    Snippet
    Snippet
    Snippet
  Kind
    Snippet
    Snippet
    Snippet
```

