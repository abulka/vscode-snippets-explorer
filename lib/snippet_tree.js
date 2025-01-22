// import * as vscode from 'vscode';
const vscode = require("vscode");
const { enumerateSnippets } = require("./snippet_enumerator");
const { isEmpty } = require("./util");
const path = require("path");
const { SnippetKind, snippetKindToNiceName } = require("./snippet_kind");
const { appLog: appLog } = require("./app_logger")
const { pathPrefixStrip } = require('../lib/pathPrefixStrip.js');
const { globalNodeName } = require('../lib/snippet_scanner.js');


class TreeDataProvider {
    // implements vscode.TreeDataProvider<TreeItem>
    // onDidChangeTreeData?: vscode.Event<TreeItem | null | undefined> | undefined;
    // data: TreeItem[];

    constructor() {
        appLog('booting up TreeDataProvider')
        this.languageIdTrees = {}; // Store trees per languageId
        this._onDidChangeTreeData = new vscode.EventEmitter(); // : vscode.EventEmitter<Dependency | undefined>
        this.onDidChangeTreeData = this._onDidChangeTreeData.event; // : vscode.Event<Dependency | undefined>
        this.treeview; // custom attribute, pass this in later... so can call .reveal()
        this.areVisible // custom flag, our listener function maintains this 
        this.lastLanguageIdSelected // custom tracking of last languageId, to figure out if to change selection in treeview

        // let subscription = vscode.window.onDidChangeActiveTextEditor(
        // subscription.dispose(); // stop listening
        vscode.window.onDidChangeActiveTextEditor(
            this._editorChangeListener.bind(this)
        );
        // listen for new and renaming
        vscode.workspace.onDidOpenTextDocument(
            this._myWorkspaceLanguageIdChangeListener.bind(this)
        );

        // need to call .init() from outside
    }

    async init() {
        // 🅳🅾🅲🆄🅼🅴🅽🆃 🅴🆅🅴🅽🆃 This only gets called once, when the extension is activated, never again
        await this.switchLanguage(this._getCurrentDocumentLanguageId());
        // vscode.window.showInformationMessage('DOC EVENT init');
    }

    setTreeView(treeview) {
        // this is a global treeview, created by the extension on startup and passed in here for us
        this.treeview = treeview

        // listen when our custom snippets treeview comes in and out of visbility, 
        // so that we can highlight current language subtree - but only if the snippets treeview is visible
        // otherwise focus jumps to the main explorer view from other views e.g. from search to explorer!

        this.treeview.onDidChangeVisibility( // is this enough to hook this up? don't we need more complex code like in the treeview constructor?
            this._visibilityChangeListener.bind(this)
        );
    }

    _visibilityChangeListener(event) {
        // appLog(`changed visibility ${event.visible}`)
        this.areVisible = event.visible

        // catch up with what should be selected in the snippets treeview now that we are visible again
        // but this generates error: rejected promise not handled within 1 second: Error: TreeError [snippetsExplorerView] Data tree node not found: [object Object] ?
        // so disable this nice intelligence for now
        // if (this.areVisible)
        //   this._selectSubtree(this._getCurrentDocumentLanguageId())
    }

    async _myWorkspaceLanguageIdChangeListener(event) {
        // Handles an event that is emitted when a text document is opened or when
        // the language id of a text document has been changed.

        // 🅳🅾🅲🆄🅼🅴🅽🆃 🅴🆅🅴🅽🆃 this only happens the first time a file is opened, or when the language mode is changed, never again
        // vscode.window.showInformationMessage('DOC EVENT first open or lang change');

        // need to ignore some language modes or else e.g. git view fails to activate
        if (event && this._languageOk(event.languageId)) {
            appLog(`EVENT onDidOpenTextDocument - renamed file or changed language mode to '${event.languageId}' - going to switch to that language (only if it doesn't exist yet)`)

            // WE ALREADY ARE GOING TO SWITCH TO THIS LANGUAGE, IN THE _editorChangeListener EVENT
            // THIS DOUBLE SWITCHING IS NOT NEEDED
            // This was the cause of the double switching bug, and why I added the hackfixIncompleteTree() method
            // which is now no longer needed 🎉
            // await this.switchLanguage(event.languageId); // <-- this is the line that caused the double switching bug    
        }
        // else
        //   appLog(`Ignoring changed language mode '${event.languageId}'`)
    }

    async _editorChangeListener(event) {
        if (event && event.document) { // sometimes event is undefined
            let languageId = event.document.languageId

            // 🅳🅾🅲🆄🅼🅴🅽🆃 🅴🆅🅴🅽🆃 this happens every time you switch tabs, even if the language mode is the same
            // vscode.window.showInformationMessage(`DOC EVENT - tab change - languageId: ${languageId}`);

            if (this._languageOk(languageId)) {
                appLog(`EVENT onDidChangeActiveTextEditor - going to switch to language '${languageId}' (only if it doesn't exist yet)`);
                await this.switchLanguage(languageId);
            }
        }
    }

    _languageOk(languageId) {
        // Ignore events for these languageId's
        const IGNORE = ['scminput', 'plaintext', 'log']
        return !new Set(IGNORE).has(languageId)
    }

    async switchLanguage(languageId) {
        appLog(`Switching to language: ${languageId}`);
        if (!this.languageIdTrees[languageId]) {
            appLog(`clearing snippet tree and adding ${languageId}...`);
            await this._buildTree(languageId);
        } else {
            this.snippetTree = this.languageIdTrees[languageId].snippetTree;
            this.data = this.languageIdTrees[languageId].data;
        }

        this._onDidChangeTreeData.fire();
        this._selectSubtree(languageId);
        appLog(`Switched to language: ${languageId}`);
    }

    // async hackfixIncompleteTree() {
    //     /*
    //     this._onDidChangeTreeData.fire(); // cause tree to rebuild - THIS IS NOT A SOLUTION 

    //     await this.refresh({ justCurrentDocumentLanguageId: false }); // this is the only way to get the tree to rebuild properly ✅ 
    //     BUT only if timeout is long enough. 1 sec. not enough. 2 seems to be ok.
    //     ALTHOUGH setting justCurrentDocumentLanguageId: false allows for 1 sec. timeout ok
    //     or even 100ms. But if set to true, then 2 sec. is needed.
    //     passing this option is same as not passing anything to refresh()
    //     thus will be same behaviour as refresh button in treeview
    //     */
    //     await new Promise(myresolve => setTimeout(myresolve, 100)).then(() => this.refresh());
    // }

    /**
     * Rebuilds tree, rescans snippet files.
     * 
     * Called by command 'nodeDependencies.refreshEntry' when user hits 'refresh' button on treeview
     * 
     * @param {dict} options {justCurrentDocumentLanguageId: true} to rebuild only current language
     */
    // async refresh(options) {
    async refresh() {
        // clear tree
        this.data = []

        // Options is deprecated
        // 
        // rebuild
        // if (options && options.justCurrentDocumentLanguageId)
        //     await this._rebuildTree(this._getCurrentDocumentLanguageId())
        // else {
        //     vscode.window.showInformationMessage(`REFRESH EVENT - snippet keys ${Object.keys(this.snippetTree)}`)
        //     let buildJobs = Object.keys(this.snippetTree) // refresh all current snippets <-- buggy and includes 'global' which is not a proper lang id
        //     await this._runJobs(buildJobs);
        // }

        // WOW we get 
        // REFRESH EVENT - snippet keys vue,global,vue-html,typescript,html,javascript
        // which effectively pulls in LOTS of snippets. More than 
        // this._runJobs([this._getCurrentDocumentLanguageId()])
        // produces alone. Hmmm. E.g. 'vue' should cause the others to be picked up, so why re-specify each of the others?
        // Are the extras duplicates or are they proper snippets? Yes they are duplicates, filed under different languageIds
        // they get through the duplicate filter because they generated via multiple calls to enumerateSnippets, and the cache is cleared before
        // each call to enumerateSnippets. So the cache is only useful for a single call to enumerateSnippets.

        // await this._runJobs([this._getCurrentDocumentLanguageId()]); // <-- ideally want JUST this
        await this._buildTree(this._getCurrentDocumentLanguageId());

        this._onDidChangeTreeData.fire();
    }

    _getCurrentDocumentLanguageId() {
        // Determine active window (if any) language id rather than defaulting to javascript
        // returns string or undefined
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
        appLog(`attempting to _selectSubtree to languageId ${languageId} wantedIndex ${wantedIndex} (was ${this.lastLanguageIdSelected})`)

        // Reveal and select (but don't switch focus to) the wanted languageId subtree, if its not already selected
        const treeItem = this.data[wantedIndex];
        if (treeItem == undefined) {
            // This may happen because EVENT onDidChangeActiveTextEditor is fired whilst async building of snippetTree is ocurring and not yet complete!
            // So we ignore it. Not to worry we will get a later EVENT onDidChangeActiveTextEditor which will bring us here again ok
            // console.error(`treesnippet wanted index is ${wantedIndex} but this doesn't exist in .data yet? which is only ${this.data.length} long`)
        }
        if (treeItem && this.areVisible && languageId != this.lastLanguageIdSelected) {
            this.treeview.reveal(treeItem, { select: true, focus: false, expand: true })
            this.lastLanguageIdSelected = languageId
        }
    }

    getParent(element) {
        // : ProviderResult<T>
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
            this.data = [new TreeItem("No snippets available, please open a file.", [], undefined, vscode.TreeItemCollapsibleState.None)];
            return;
        }

        this.snippetTree = {};
        await enumerateSnippets(this.snippetTree, languageId);
        // log the tree
        appLog(`snippetTree for ${languageId}:`)

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

        appLog('------------')

        let rootArray = [];

        // dummy extra root nodes
        // rootArray.push(new TreeItem("TEST1"));
        // rootArray.push(new TreeItem("TEST2"));

        for (const [_languageId, languageSnippets] of Object.entries(
            this.snippetTree
        )) {
            // Special case, Collapse the less used, global node, and also the 
            let collapsibleState = _languageId == globalNodeName ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.Expanded;

            let languageTreeItem = new TreeItem(_languageId, [], undefined, collapsibleState);
            languageTreeItem.andyTooltip = `Snippets for '${_languageId}'`
            appLog(`Building tree for '${_languageId}'`)

            for (const [fullPath, snippets] of Object.entries(languageSnippets)) {
                if (isEmpty(snippets)) continue;

                let label = getLabel(fullPath, snippets);

                // Special case, Expand the more frequently used user snippets - on second thought, this is not a good idea, too messy
                // collapsibleState = snippets._meta_.kind == SnippetKind.USER ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;
                collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

                let kindTreeItem = new TreeItem(label, [], snippets._meta_.kind, collapsibleState);
                kindTreeItem.andyParent = languageTreeItem;
                kindTreeItem.andyTooltip = `${snippetKindToNiceName(snippets._meta_.kind)} snippets from ${fullPath}`

                for (const [name, snippet] of Object.entries(snippets)) {
                    let displayName;
                    let description;
                    let body;
                    let tooltip;

                    if (name == "_meta_") continue;

                    // appLog(`  snippet ${JSON.stringify(snippet)} name: ${name} prefix: ${snippet.prefix} description: ${snippet.description}`)

                    ({ description, displayName } = getDisplayName(snippet, description, name, displayName));

                    let snippetTreeItem = new TreeItem(displayName);
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
        this.data = rootArray;
        this.languageIdTrees[languageId] = { snippetTree: this.snippetTree, data: this.data };

        appLog(`Tree built for language: ${languageId}`);

        function getLabel(fullPath, snippets) {
            // Display the kind of snippet (e.g. "user", "project", "extension")
            // let label = `${snippetKindToNiceName(snippets._meta_.kind).toLowerCase()} snippets:`;
            // let label = ""; // just the icon is enough otherwise it looks too busy
            // let label = `(${snippetKindToNiceName(snippets._meta_.kind).toLowerCase()})`;
            return `${pathPrefixStrip(fullPath)} - ${snippetKindToNiceName(snippets._meta_.kind)}`;
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

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (element === undefined) {
            return this._filterItems(this.data, this._filterQuery || '');
        }
        return this._filterItems(element.children, this._filterQuery || '');
    }

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
                    const newItem = new TreeItem(item.label, filteredChildren, item.kind, vscode.TreeItemCollapsibleState.Collapsed);
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
}

class TreeItem extends vscode.TreeItem {
    // children: TreeItem[] | undefined;

    constructor(label, children, snippetKind, collapsibleState) {
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
