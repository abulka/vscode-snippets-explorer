// import * as vscode from 'vscode';
const vscode = require("vscode");
const { enumerateSnippets } = require("./snippet_enumerator");
const { isEmpty } = require("./util");
const path = require("path");
const { SnippetKind, snippetKindToNiceName } = require("./snippet_kind");
const { appLog: appLog } = require("./app_logger")
const { pathPrefixStrip } = require('../lib/pathPrefixStrip.js');
const { globalNodeName } = require('../lib/snippet_scanner.js');

/* 

Typescript types (if this were a typescript file)
-----------------------------------------------

type Snippet = {
    prefix: string;
    body: string | string[];
    description?: string;
};

type SnippetsDict = {
    [snippetName: string]: Snippet; // Level 3. Dictionary of snippets
};

type SnippetTreeNode = {
    [fullPath: string]: SnippetsDict; // Level 2. Maps snippetKind .json fullPath to snippets
};

type SnippetTree = {
    [languageId: string]: SnippetTreeNode; // Level 1. Maps languageId to its snippet nodes
};

type LanguageIdTree = {
    snippetTree: SnippetTree;
    itemTree: TreeItem[];
};

class TreeDataProvider {
    languageIdTrees: { [languageId: string]: LanguageIdTree } = {};
    expandedStates: { [languageId: string]: Map<string, boolean> } = {}; // where Map string is the label of the tree item, and boolean is whether it is expanded or not
    ...
}

*/

class TreeDataProvider { // implements vscode.TreeDataProvider<TreeItem>

    constructor() {
        appLog('booting up TreeDataProvider')
        this.languageIdTrees = {}; // Store snippetTree (model) and itemTree (view) per languageId
        this.expandedStates = {}; // Store expanded states per languageId
        this._onDidChangeTreeData = new vscode.EventEmitter(); // : vscode.EventEmitter<Dependency | undefined>
        this.onDidChangeTreeData = this._onDidChangeTreeData.event; // : vscode.Event<Dependency | undefined>
        this.treeview; // custom attribute, pass this in later... so can call .reveal()
        this.areVisible // custom flag, our listener function maintains this 
        this.currentLanguageId // custom tracking of last languageId, to figure out if to change selection in treeview

        // These are extracted from this.languageIdTrees[languageId] for convenience
        this.itemTree = []; // TreeItem[] - the view
        this.snippetTree = {}; // SnippetTree - the model

        vscode.window.onDidChangeActiveTextEditor( // listen for tab changes
            this._editorChangeListener.bind(this)
        );
        vscode.workspace.onDidOpenTextDocument(  // listen for new and renaming
            this._myWorkspaceLanguageIdChangeListener.bind(this)
        );

        // need to call .init() from outside
    }

    async init() {
        // 🅳🅾🅲🆄🅼🅴🅽🆃 🅴🆅🅴🅽🆃 This only gets called once, when the extension is activated, never again
        await this.switchLanguage(this._getCurrentDocumentLanguageId());
    }

    setTreeView(treeview) {
        // this is a single treeview, created by our extension on startup and passed in here for us to use
        this.treeview = treeview
        this._setupExpandCollapseEventListeners();
    }

    _setupExpandCollapseEventListeners() {
        this.treeview.onDidExpandElement((event) => {
            const languageId = this._getCurrentDocumentLanguageId();
            this._updateExpandedState(languageId, event.element, true);
        });

        this.treeview.onDidCollapseElement((event) => {
            const languageId = this._getCurrentDocumentLanguageId();
            this._updateExpandedState(languageId, event.element, false);
        });
    }

    async _myWorkspaceLanguageIdChangeListener(_event) {
        // 🅳🅾🅲🆄🅼🅴🅽🆃 🅴🆅🅴🅽🆃 this only happens the first time a file is opened, or when the language mode is changed/renamed, never again

        // // need to ignore some language modes or else e.g. git view fails to activate
        // if (_event && this._languageOk(_event.languageId)) {
        //     appLog(`EVENT onDidOpenTextDocument - renamed file or changed language mode to '${_event.languageId}' - going to switch to that language (only if it doesn't exist yet)`)

        //     // WE ALREADY ARE GOING TO SWITCH TO THIS LANGUAGE, IN THE _editorChangeListener EVENT
        //     // THIS DOUBLE SWITCHING IS NOT NEEDED
        //     // This was the cause of the double switching bug, and why I added the hackfixIncompleteTree() method
        //     // which is now no longer needed 🎉
        //     // await this.switchLanguage(event.languageId); // <-- this is the line that caused the double switching bug    
        // }
        // // else
        // //   appLog(`Ignoring changed language mode '${event.languageId}'`)
    }

    async _editorChangeListener(event) {
        // 🅳🅾🅲🆄🅼🅴🅽🆃 🅴🆅🅴🅽🆃 this happens every time you switch tabs, even if the language mode is the same
        if (event && event.document) { // sometimes event is undefined
            let languageId = event.document.languageId
            if (this._languageOk(languageId)) {
                await this.switchLanguage(languageId);
            }
        }
    }

    _languageOk(languageId) {
        const IGNORE = ['scminput', 'plaintext', 'log']
        return !new Set(IGNORE).has(languageId)
    }

    async switchLanguage(languageId) {
        appLog(`Switching to language: ${languageId}`);
        if (!this.languageIdTrees[languageId]) {
            await this._buildTree(languageId);
        } else {
            this.snippetTree = this.languageIdTrees[languageId].snippetTree;
            this.itemTree = this.languageIdTrees[languageId].itemTree;
            this._restoreExpandedStates(languageId);
        }

        this._onDidChangeTreeData.fire();
        this._selectSubtree(languageId);
        appLog(`Switched to language: ${languageId}`);
    }

   async refresh() {
        // Only called by 'refresh' button on treeview - command 'nodeDependencies.refreshEntry'
        await this._buildTree(this._getCurrentDocumentLanguageId());
        this._onDidChangeTreeData.fire();
    }

    _getCurrentDocumentLanguageId() { // : string | undefined
        // Determine active window (if any) language id rather than defaulting to javascript
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            appLog(`initial language determined to be: ${document.languageId}`);
            return document.languageId;
        }
        return undefined;
    }

    _selectSubtree(languageId) {
        // Reveal the 'languageId' subtree
        // Note that .reveal() method is on the TreeView not the TreeDataProvider
        // Note that we cannot programatically collapse all other subtrees https://github.com/microsoft/vscode/issues/76376

        if (!this.treeview) {
            console.error(`cannot unfold languageId "${languageId}", because .treeview not populated yet.`)
            return;
        }

        // Find index item of wanted languageId
        let wantedIndex = Object.keys(this.snippetTree).indexOf(languageId)
        appLog(`attempting to _selectSubtree to languageId ${languageId} wantedIndex ${wantedIndex} (was ${this.currentLanguageId})`)

        // Reveal and select (but don't switch focus to) the wanted languageId subtree, if its not already selected
        const treeItem = this.itemTree[wantedIndex];
        if (treeItem == undefined) {
            // This may happen because EVENT onDidChangeActiveTextEditor is fired whilst async building of snippetTree is ocurring and not yet complete!
            // So we ignore it. Not to worry we will get a later EVENT onDidChangeActiveTextEditor which will bring us here again ok
            // console.error(`treesnippet wanted index is ${wantedIndex} but this doesn't exist in .itemTree yet? which is only ${this.itemTree.length} long`)
        }
        if (treeItem && this.areVisible && languageId != this.currentLanguageId) {
            this.treeview.reveal(treeItem, { select: true, focus: false, expand: true })
            this.currentLanguageId = languageId
        }
    }

    getParent(element) { // : ProviderResult<T>
        // This method should be implemented in order to access the reveal() API. But it never gets called?
        return element.andyParent;
    }

    /**
     * Scans the filesystem for snippets matching 'languageId' and makes an entry in `this.snippetTree`
     * Then builds a treeview made up of TreeItem instances.
     *
     * @param {string} languageId
     */
    async _buildTree(languageId) {
        appLog(`Building tree for language: ${languageId}`);
        if (languageId == undefined) {
            console.log(
                `initial languageId - cannot be determined because there is no active document`
            );
            this.itemTree = [new TreeItem("No snippets available, please open a file.", 1, [], undefined, vscode.TreeItemCollapsibleState.None)];
            return;
        }

        this.snippetTree = {};
        this.itemTree = []

        await enumerateSnippets(this.snippetTree, languageId); // <- this is where the magic happens 🪄

        this.logSnippetTree(languageId);

        let rootArray = [];

        // dummy extra root nodes
        // rootArray.push(new TreeItem("TEST1"));
        // rootArray.push(new TreeItem("TEST2"));

        for (const [_languageId, languageSnippets] of Object.entries(
            this.snippetTree
        )) {
            // Special case, Collapse the less used, global node, and also the 
            let collapsibleState = _languageId == globalNodeName ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.Expanded;

            let languageTreeItem = new TreeItem(_languageId, 1, [], undefined, collapsibleState);
            languageTreeItem.andyTooltip = `Snippets for '${_languageId}'`
            appLog(`Building tree for '${_languageId}'`)

            for (const [fullPath, snippets] of Object.entries(languageSnippets)) {
                if (isEmpty(snippets)) continue;

                let label = getLabel(fullPath, snippets);

                // Special case, Expand the more frequently used user snippets - on second thought, this is not a good idea, too messy
                // collapsibleState = snippets._meta_.kind == SnippetKind.USER ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;
                collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

                let kindTreeItem = new TreeItem(label, 2, [], snippets._meta_.kind, collapsibleState);
                kindTreeItem.andyParent = languageTreeItem;
                kindTreeItem.andyTooltip = `${snippetKindToNiceName(snippets._meta_.kind)} snippets from ${fullPath}`

                for (const [name, snippet] of Object.entries(snippets)) {
                    let displayName;
                    let description;
                    let body;
                    let tooltip;

                    if (name == "_meta_") continue;

                    ({ description, displayName } = getDisplayName(snippet, description, name, displayName));

                    let snippetTreeItem = new TreeItem(displayName, 3);
                    snippetTreeItem.andyParent = kindTreeItem;

                    // Calculate body and tooltip
                    if (snippet.body instanceof Array) body = snippet.body.join("\n");
                    else body = snippet.body;
                    tooltip = body;
                    tooltip = tooltip.replace(/\s\s+/g, " "); // replace multiple whitespaces

                    snippetTreeItem.snippetBody = body;
                    snippetTreeItem.andyTooltip = tooltip;

                    kindTreeItem.children.push(snippetTreeItem);
                }

                languageTreeItem.children.push(kindTreeItem);
            }

            rootArray.push(languageTreeItem);
        }
        this.itemTree = rootArray;
        this.languageIdTrees[languageId] = { snippetTree: this.snippetTree, itemTree: this.itemTree };

        appLog(`Tree built for language: ${languageId}`);

        function getLabel(fullPath, snippets) {
            // Display the kind of snippet (e.g. "user", "project", "extension")

            // let label = `${snippetKindToNiceName(snippets._meta_.kind).toLowerCase()} snippets:`;
            // let label = ""; // just the icon is enough otherwise it looks too busy
            // let label = `(${snippetKindToNiceName(snippets._meta_.kind).toLowerCase()})`;
            // let label = `${pathPrefixStrip(fullPath)} - ${snippetKindToNiceName(snippets._meta_.kind)}`;
            let label = `${pathPrefixStrip(fullPath)} (${Object.keys(snippets).length - 1})`; // -1 to exclude _meta_
            return label;
        }

        function getDisplayName(snippet, description, name, displayName) {
            if (snippet.description instanceof Array)
                description = snippet.description.join(" ");
            else description = snippet.description;
            if (description == undefined) {
                // appLog(`No description for ${name} from ${fullPath}`)
                description = "";
            }
            description = description.trim();

            let descriptionDifferentToName = description != "" && description != name;
            let nameDifferentToPrefix = snippet.prefix != name;

            displayName = snippet.prefix;
            if (nameDifferentToPrefix) displayName += `  ▪︎  "${name}"`;
            if (descriptionDifferentToName) {
                if (!nameDifferentToPrefix)
                    // never added ▪︎ symbol, so add it now
                    displayName += `  ▪︎`;
                displayName += `  (${description})`;
            }
            return { description, displayName };
        }
    }

    logSnippetTree(languageId) {
        appLog(`snippetTree for ${languageId}:`);

        // 1. Whole tree
        // appLog(JSON.stringify(this.snippetTree, null, 2));
        // 2. Log just snippet keys - smaller output
        if (this.snippetTree[languageId]) {
            Object.keys(this.snippetTree[languageId]).forEach(filePath => {
                const snippets = this.snippetTree[languageId][filePath];
                const snippetKeys = Object.keys(snippets).filter(key => key !== '_meta_');
                appLog(`👉 Snippets in ${filePath}: 📝 ${snippetKeys.join(', ')}`);
            });
        }

        // 3. Log the count of snippets
        let snippetCount = 0;
        for (const [_languageId, languageSnippets] of Object.entries(this.snippetTree)) {
            for (const [_fullPath, snippets] of Object.entries(languageSnippets)) {
                snippetCount += Object.keys(snippets).length - 1; // -1 for _meta_
            }
        }
        appLog(`Total snippets: ${snippetCount}`);

        appLog('------------');
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (element === undefined) {
            return this._filterItems(this.itemTree, this._filterQuery || '');
        }
        return this._filterItems(element.children, this._filterQuery || '');
    }

    // Filter

    _filterItems(items, filterQuery) {
        if (!filterQuery) {
            return items;
        }
        const filteredItems = [];
        for (const item of items) {
            if (this.matchesFilter(item, filterQuery)) {
                filteredItems.push(item);
            } else if (item.children) {
                const filteredChildren = this._filterItems(item.children, filterQuery);
                if (filteredChildren.length > 0) {
                    const newItem = new TreeItem(item.label, item.level, filteredChildren, item.kind, vscode.TreeItemCollapsibleState.Collapsed);
                    newItem.andyTooltip = item.andyTooltip;
                    newItem.snippetBody = item.snippetBody;
                    filteredItems.push(newItem);
                }
            }
        }
        return filteredItems;
    }

    matchesFilter(item, filterQuery) {
        return item.label.toLowerCase().includes(filterQuery.toLowerCase());
    }

    updateFilterQuery(filterQuery) {
        this._filterQuery = filterQuery;
        this._onDidChangeTreeData.fire();
    }

    fireOnDidChangeTreeData() {
        this.onDidChangeTreeData.fire();
    }

    // Remember Expand / Collapse state of current treeview

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

    _restoreExpandedStates(languageId) {
        const expandedStates = this.expandedStates[languageId];
        if (!expandedStates) {
            appLog(`No expanded states found for languageId: ${languageId}`);
            return;
        }

        // this._printExpandedTreeItems(expandedStates); // DEBUGGING

        // Only process first two levels (1=language and 2=kind) for expanded states - 3=snippets have no children anyway
        for (const item of this.itemTree) {
            this._setItemState(item, expandedStates);
            if (item.children) {
                for (const child of item.children) {
                    this._setItemState(child, expandedStates);
                }
            }
        }
    }

    _setItemState(item, expandedStates) {
        const isExpanded = expandedStates.get(item.label);
        if (isExpanded !== undefined) {
            item.collapsibleState = isExpanded 
                ? vscode.TreeItemCollapsibleState.Expanded 
                : vscode.TreeItemCollapsibleState.Collapsed;
        }
    }

    _printExpandedTreeItems(expandedStates) {
        appLog('Expanded tree items:');
        for (const [label, expanded] of expandedStates.entries()) {
            if (expanded) {
                appLog(`EXPANDED: ${label}`);
            }
        }
    }

}

class TreeItem extends vscode.TreeItem {
    // children: TreeItem[] | undefined;

    constructor(label, level, children, snippetKind, collapsibleState) {
        let icon;

        // DEBUGGING
        // `kind` is undefined for snippets, and a SnippetKind for the root nodes (e.g. "dart")
        // appLog(`  TreeItem constructor label: ${label} kind: ${kind}`);

        // Get icons from https://github.com/microsoft/vscode-icons (or make your own)
        switch (snippetKind) {
            case SnippetKind.USER:
                icon = "person.svg";
                break;
            case SnippetKind.PROJECT:
                icon = "package.svg";
                break;
            case SnippetKind.EXTENSION:
                icon = "extensions.svg";
                break;
            case SnippetKind.EXTENSION_PACKAGEJSON:
                icon = "extensions.svg";
                break;
            case SnippetKind.BUILTIN:
                icon = "globe.svg";
                break;
            case SnippetKind.GLOBAL_USER:
                icon = "broadcast.svg";
                break;
            default:
                break;
        }

        // temporary label, for debugging.
        // if (icon)
        //   label = `${snippetKindToNiceName(kind)} ${label}`

        super(label, collapsibleState);
        this.level = level;
        this.children = children;
        this.snippetBody = undefined;
        this.andyTooltip = undefined; // same as body, but with whitespace removed
        this.andyParent = undefined;

        if (icon)
            this.iconPath = {
                light: path.join(__filename, "..", "..", "images", "light", icon),
                dark: path.join(__filename, "..", "..", "images", "dark", icon),
            };
    }

    get command() {
        if (this.snippetBody)
            return {
                command: "extension.snippet_inserter",
                title: "MY custom command ha",
                arguments: [this.snippetBody],
            };
    }

    get tooltip() {
        return this.andyTooltip;
    }
}

module.exports = {
    TreeDataProvider,
};
