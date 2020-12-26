import * as monaco from 'monaco-editor';

type DotNetObjectReference = any;
const registeredCompletionHandlers = {};

let editor : monaco.editor.IStandaloneCodeEditor;

export function getEditor() : monaco.editor.IStandaloneCodeEditor{
    return editor;
}

export function focusEditor() {
    editor.focus();
}

export function getEditorContent() : string {
    return editor.getValue();
}

export function init(element: HTMLElement, component: DotNetObjectReference, language: string, value: string) {
    if (!registeredCompletionHandlers[language]) {
        registeredCompletionHandlers[language] = true;
        monaco.languages.registerCompletionItemProvider(language, new RemoteCompletionItemProvider());
    }

    editor = monaco.editor.create(element, {
        value: value,
        language: language,
        minimap: { enabled: false },
    });

    editor.getModel()['blazorComponent'] = component;

    editor.onDidBlurEditorText(() => {
        const value = editor.getValue();
        component.invokeMethodAsync('HandleEditorBlur', value);
    });
}

class RemoteCompletionItemProvider implements monaco.languages.CompletionItemProvider {
    public triggerCharacters = ['.'];

    async provideCompletionItems(model: monaco.editor.ITextModel, position: monaco.Position, context: monaco.languages.CompletionContext, token: monaco.CancellationToken): Promise<monaco.languages.CompletionList> {
        const component = model['blazorComponent'] as DotNetObjectReference;
        if (component) {
            const value = model.getValue();
            const suggestions = await component.invokeMethodAsync('GetCompletions', value, position);
            if (suggestions) {
                return {
                    suggestions: suggestions.map(s => (<monaco.languages.CompletionItem>{
                        kind: s.kind,
                        label: s.label,
                        insertText: s.insertText,
                        range: null,
                        documentation: s.documentation,
                    }))
                };
            }
        }

        return { suggestions: [] };
    }
}
