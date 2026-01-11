import { indentWithTab } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap } from "@codemirror/view";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import { useEffect, useMemo, useRef } from "react";

import { getLanguageExtension } from "@/features/editor/extensions/language-extension";
import { minimap } from "@/features/editor/extensions/minimap";
import { customTheme } from "@/features/editor/extensions/theme";
import { customSetup } from "@/features/editor/extensions/custom-setup";

interface CodeEditorProps {
  fileName: string;
  onChange: (value: string) => void;
  initialValue?: string;
}

function CodeEditor({
  fileName,
  onChange,
  initialValue = "",
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const languageExtension = useMemo(
    () => getLanguageExtension(fileName),
    [fileName],
  );

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    const view = new EditorView({
      doc: initialValue,
      parent: editorRef.current,
      extensions: [
        customSetup,
        oneDark,
        customTheme,
        languageExtension,
        keymap.of([indentWithTab]),
        minimap(),
        indentationMarkers(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageExtension]);

  return <div ref={editorRef} className="size-full pl-4 bg-background" />;
}

export { CodeEditor };
