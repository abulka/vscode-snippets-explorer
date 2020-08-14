// import * as vscode from 'vscode';
const vscode = require("vscode");
const { enumerateSnippets } = require("./snippet_enumerator");
const { isEmpty } = require("./util");
const path = require("path");
const { SnippetKind, snippetKindToNiceName } = require("./snippet_kind");
const { appLog: appLog } = require("./app_logger")

class TreeDataProvider {
    // implements vscode.TreeDataProvider<TreeItem>
    // onDidChangeTreeData?: vscode.Event<TreeItem | null | undefined> | undefined;
    // data: TreeItem[];

    constructor() {
        appLog('booting up TreeDataProvider')
        this.data; // TreeItem[];
        this.snippetTree = {}; // master tree
        this._onDidChangeTreeData = new vscode.EventEmitter(); // : vscode.EventEmitter<Dependency | undefined>
        this.onDidChangeTreeData = this._onDidChangeTreeData.event; // : vscode.Event<Dependency | undefined>
        this.treeview; // custom attribute, pass this in later... so can call .reveal()
        this.areVisible // custom flag, our listener function maintains this 

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
        await this._buildJobs(this._getCurrentDocumentLanguageId());
    }

    setTreeView(treeview) {
        this.treeview = treeview

        // listen when our custom snippets treeview comes in and out of visbility, 
        // so that we can highlight current language subtree - but only if the snippets treeview is visbile
        // otherwise focus jumps to the main explorer view from other views e.g. from search to explorer!

        this.treeview.onDidChangeVisibility( // is this enough to hook this up? don't we need more complex code like in the treeview constructor?
            this._visibilityChangeListener.bind(this)
        );
    }

    _visibilityChangeListener(event) {
        appLog(`changed visibility ${event.visible}`)
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

        // need to ignore some language modes or else e.g. git view fails to activate
        if (event && this._languageOk(event.languageId)) {
            appLog(`Renamed file or changed language mode to '${event.languageId}'`)
            await this.addLanguage(event.languageId);
        }
        // else
        //   appLog(`Ignoring changed language mode '${event.languageId}'`)
    }

    async _editorChangeListener(event) {
        if (event && event.document) { // sometimes event is undefined
            let languageId = event.document.languageId
            if (this._languageOk(languageId)) {
                appLog(`Switched to language ${languageId}, via editor change event`);
                await this.addLanguage(languageId);
            }
        }
    }

    _languageOk(languageId) {
        // Ignore events for these languageId's
        const IGNORE = ['scminput', 'plaintext', 'log']
        return !new Set(IGNORE).has(languageId)
    }

    async addLanguage(languageId) {
        if (!Object.keys(this.snippetTree).includes(languageId)) {
            appLog(`adding language ${languageId} to snippet tree...`);
            await this._buildJobs(languageId);
            this._onDidChangeTreeData.fire(); // cause tree to rebuild
        }

        this._selectSubtree(languageId);
    }

    async _buildJobs(languageId) {
        let buildJobs = [];

        buildJobs.push(languageId); // if languageId undefined, will put a help message into tree

        if (languageId != undefined)
            switch (languageId) {
                case "dart":
                    buildJobs.push("flutter");
                    break;
            }
        await this._runJobs(buildJobs);
    }

    async _runJobs(buildJobs) {
        for (const _languageId of buildJobs) {
            await this._buildTree(_languageId);
        }
    }

    /**
     * Rebuilds tree, rescans snippet files.
     * 
     * Called by command 'nodeDependencies.refreshEntry' when user hits 'refresh' button on treeview
     * 
     * @param {dict} options {justCurrentDocumentLanguageId: true} to rebuild only current language
     */
    async refresh(options) {
        // clear tree
        this.data = []

        // rebuild
        if (options && options.justCurrentDocumentLanguageId)
            await this._buildJobs(this._getCurrentDocumentLanguageId())
        else {
            let buildJobs = Object.keys(this.snippetTree) // refresh all current snippets
            this._runJobs(buildJobs);
        }
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

        if (!this.treeview) {
            console.error(`cannot unfold languageId "${languageId}", because .treeview not populated yet.`)
            return;
        }
        // console.log(`treeview focus changing to languageId ${languageId}`);

        // Find index item of wanted scope
        let wantedIndex = Object.keys(this.snippetTree).indexOf(languageId);

        // Cannot programatically collapse all other subtrees
        // https://github.com/microsoft/vscode/issues/76376

        // Reveal and select the wanted subtree
        const treeItem = this.data[wantedIndex];

        if (this.areVisible && !this.alreadyHaveSelectedCurrentLanguageId())
            this.treeview.reveal(treeItem, { select: true, focus: false, expand: true });
    }

    alreadyHaveSelectedCurrentLanguageId() {
        // how to figure this out? this.treeview.? May not be possible https://github.com/microsoft/vscode/issues/49511 
        return false
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
        if (languageId == undefined) {
            console.log(
                `initial languageId - cannot be determined because there is no active document`
            );
            this.data = [new TreeItem("No snippets available, please open a file.")];
            return;
        }

        await enumerateSnippets(this.snippetTree, languageId);

        let rootArray = [];
        for (const [_languageId, languageSnippets] of Object.entries(
            this.snippetTree
        )) {
            let languageTreeItem = new TreeItem(_languageId, []);
            languageTreeItem.andyTooltip = `Snippets for '${_languageId}'`

            // eslint-disable-next-line no-unused-vars
            for (const [fullPath, snippets] of Object.entries(languageSnippets)) {
                if (isEmpty(snippets)) continue;

                // let label = fullPath;
                // let label = `${JSON.stringify(snippets._meta_)} in ${fullPath}`
                let label = `${snippets._meta_.extensionPathInfo.extensionId} ${
                    snippets._meta_.extensionPathInfo.extensionVersion
                        ? snippets._meta_.extensionPathInfo.extensionVersion
                        : ""
                    }`;

                let kindTreeItem = new TreeItem(label, [], snippets._meta_.kind);
                kindTreeItem.andyParent = languageTreeItem;
                kindTreeItem.andyTooltip = `${snippetKindToNiceName(snippets._meta_.kind)} snippets from ${fullPath}`

                for (const [name, snippet] of Object.entries(snippets)) {
                    let displayName;
                    let description;
                    let body;
                    let tooltip;

                    if (name == "_meta_") continue;

                    if (snippet.description instanceof Array)
                        description = snippet.description.join(" ");
                    else description = snippet.description;
                    description = description.trim();

                    let descriptionDifferentToName =
                        description != "" && description != name;
                    let nameDifferentToPrefix = snippet.prefix != name;

                    displayName = snippet.prefix;
                    if (nameDifferentToPrefix) displayName += `  ▪︎  "${name}"`;
                    if (descriptionDifferentToName) {
                        if (!nameDifferentToPrefix)
                            // never added ▪︎ symbol, so add it now
                            displayName += `  ▪︎`;
                        displayName += `  (${description})`;
                    }

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
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (element === undefined) {
            return this.data;
        }
        return element.children;
    }

}

class TreeItem extends vscode.TreeItem {
    // children: TreeItem[] | undefined;

    constructor(label, children, kind) {
        let icon;
        switch (kind) {
            case SnippetKind.USER:
                icon = "person.svg";
                break;
            case SnippetKind.PROJECT:
                icon = "package.svg";
                break;
            case SnippetKind.EXTENSION:
                icon = "extensions.svg";
                break;
            case SnippetKind.BUILTIN:
                icon = "globe.svg";
                break;
            default:
                break;
        }

        // temporary label, for debugging.
        // if (icon)
        //   label = `${snippetKindToNiceName(kind)} ${label}`

        super(
            label,
            children === undefined
                ? vscode.TreeItemCollapsibleState.None
                : vscode.TreeItemCollapsibleState.Expanded
        );
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
