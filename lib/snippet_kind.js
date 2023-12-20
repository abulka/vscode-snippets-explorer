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
            return "PROJECT";
        case SnippetKind.USER:
            return "USER";
        case SnippetKind.EXTENSION:
            return "EXTENSION";
        case SnippetKind.BUILTIN:
            return "BUILTIN";
        case SnippetKind.GLOBAL_USER:
            return "GLOBAL USER";
    }
}
exports.snippetKindToNiceName = snippetKindToNiceName;
