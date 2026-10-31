'use client';
import { useEffect } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';

// Custom completions for overlay CSS
const OVERLAY_CLASSES = [
  '.overlay-chat-bubble',
  '.overlay-chat-avatar',
  '.overlay-chat-text',
  '.overlay-chat-nickname',
  '.overlay-pinned',
  '.overlay-pinned-avatar',
  '.overlay-gift',
  '.overlay-gift-avatar',
  '.overlay-like',
  '.overlay-member',
  '.neon-panel',
  '.user-tag',
  '.accent-bar',
  '.dot-pulse',
  '#avatarContainer',
  '#mainContainer',
];

const CSS_VARS = [
  '--accent',
  '--accent2',
  '--main-color',
  '--main-glow',
  '--bg-black',
  '--text-color',
  '--chat-bg',
  '--chat-text',
];

export default function CssEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const handleBeforeMount = (monaco: Monaco) => {
    // CSS custom data for variables
    const cssDefaults = (monaco.languages.css as any).cssDefaults;
    if (cssDefaults) {
      cssDefaults.setOptions({
        data: {
          useDefaultDataProvider: true,
          dataProviders: {
            overlay: {
              version: 1.1,
              properties: [],
              atDirectives: [],
              pseudoClasses: [],
              pseudoElements: [],
              dataTypes: [],
            },
          },
        },
      });
    }
  };

  const handleMount = (editor: any, monaco: Monaco) => {
    // Register completion provider for CSS
    monaco.languages.registerCompletionItemProvider('css', {
      triggerCharacters: ['.', '-', ':'],
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const lineContent = model.getLineContent(position.lineNumber);
        const textUntil = lineContent.substring(0, position.column - 1);

        const suggestions: any[] = [];

        // Suggest classes when typing .
        if (textUntil.includes('.') || textUntil.trim().endsWith('.')) {
          OVERLAY_CLASSES.forEach((cls) => {
            const label = cls;
            const insertText = cls;
            suggestions.push({
              label,
              kind: monaco.languages.CompletionItemKind.Class,
              detail: 'Overlay class',
              documentation: `Gunakan ${cls} untuk styling overlay`,
              insertText,
              range,
            });
          });
        }

        // Suggest CSS vars when typing var(
        if (textUntil.includes('var(') || textUntil.includes('--')) {
          CSS_VARS.forEach((v) => {
            suggestions.push({
              label: v,
              kind: monaco.languages.CompletionItemKind.Variable,
              detail: 'CSS variable',
              documentation: `Variable ${v} dari tema`,
              insertText: v,
              range,
            });
          });
        }

        // Suggest common CSS properties with !important hint
        if (suggestions.length === 0) {
          // Fallback: suggest our classes and vars
          OVERLAY_CLASSES.forEach((cls) => {
            suggestions.push({
              label: cls,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: cls,
              range,
            });
          });
        }

        return { suggestions };
      },
    });

    // Add keybinding for formatting
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      editor.getAction('editor.action.formatDocument')?.run();
    });
  };

  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      <Editor
        height="220px"
        language="css"
        value={value}
        onChange={(v) => onChange(v || '')}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          fontSize: 11,
          fontFamily: 'JetBrains Mono, monospace',
          lineHeight: 16,
          padding: { top: 10, bottom: 10 },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          theme: 'vs-dark',
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          snippetSuggestions: 'inline',
          lineNumbers: 'on',
          glyphMargin: false,
          folding: false,
          lineDecorationsWidth: 8,
          lineNumbersMinChars: 2,
          scrollbar: { vertical: 'auto', horizontal: 'auto', verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
          automaticLayout: true,
        }}
        theme="vs-dark"
      />
    </div>
  );
}
