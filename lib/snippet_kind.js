const SnippetKind = {
    PROJECT: 1,
    USER: 2,
    EXTENSION: 3,
    BUILTIN: 4,
    GLOBAL_USER: 5,
};
exports.SnippetKind = SnippetKind;

function snippetKindToNiceName(kind) {
    switch (kind) {
        case SnippetKind.PROJECT:
            return "defined in this project";
        case SnippetKind.USER:
            return "user defined";
        case SnippetKind.EXTENSION:
            return "provided by an extension";
        case SnippetKind.BUILTIN:
            return "built-in";
        case SnippetKind.GLOBAL_USER:
            return "defined by user in a global snippets file";
    }
}
exports.snippetKindToNiceName = snippetKindToNiceName;
