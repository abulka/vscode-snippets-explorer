const SnippetKind = {
    PROJECT: 1,
    USER: 2,
    EXTENSION: 3,
    BUILTIN: 4,
    GLOBAL_USER: 5,
    EXTENSION_PACKAGEJSON: 6
};
exports.SnippetKind = SnippetKind;

function snippetKindToNiceName(kind) {
    switch (kind) {
        case SnippetKind.PROJECT:
            return "PROJECT (defined in this project)";
        case SnippetKind.USER:
            return "USER (user defined)";
        case SnippetKind.EXTENSION:
            return "EXTENSION (provided by an extension)";
        case SnippetKind.EXTENSION_PACKAGEJSON:
            return "EXTENSION_PACKAGEJSON (contributed via extension's package.json)";
        case SnippetKind.BUILTIN:
            return "BUILTIN (built-in)";
        case SnippetKind.GLOBAL_USER:
            return "GLOBAL_USER (defined by user in a global snippets file)";
    }
}
exports.snippetKindToNiceName = snippetKindToNiceName;
