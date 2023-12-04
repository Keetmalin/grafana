import { css } from '@emotion/css';
import React, { useRef, useEffect } from 'react';

import { useStyles2 } from '@grafana/ui';

import {
  basicSetup,
  PRQLEditorView,
  prql,
  EditorState,
  oneDark,
  prqlLanguage,
  CompletionContext,
  syntaxTree,
  readonlySetup,
} from '../../../../../../prql';

function myCompletions(context: CompletionContext, metricNames: string[]) {
  let word = context.matchBefore(/\w*/);
  if (word?.from === word?.to && !context.explicit) {
    return null;
  }

  let nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);
  // Top level selector, i.e. "from"
  if (nodeBefore?.type?.name === 'CallExpression' && nodeBefore?.parent?.type?.name === 'Pipeline') {
    //https://codemirror.net/docs/ref/#autocomplete
    return {
      from: word?.from,
      filter: false,
      options: metricNames.map((metric) => ({ label: metric, type: 'constant', boost: 99 })),
    };
  }

  return {
    from: word?.from,
    options: [
      { label: 'match', type: 'keyword' },
      { label: 'hello', type: 'variable', info: '(World)' },
      { label: 'magic', type: 'text', apply: '⠁⭒*.✩.*⭒⠁', detail: 'macro' },
    ],
  };
}

interface Props {
  metricNames: string[];
  queryString: string;
  readOnly?: boolean; // transparent bg, make it obviously readonly
}

const getStyles = (readOnly?: boolean) => {
  if (readOnly) {
    return {
      editor: css`
        .ͼo {
          background-color: rgba(40, 44, 52, 0.3);
          color: rgba(171, 178, 191, 0.5);

          .cm-gutters {
            background-color: rgba(40, 44, 52, 0.3);
          }
          .ͼq {
            color: rgba(224, 108, 117, 0.5);
          }
          .ͼu {
            color: #e5c07b;
            color: rgba(229, 192, 123, 0.5);
          }
          .ͼr {
            color: rgba(97, 175, 239, 0.5);
          }
          .ͼv {
            color: rgba(86, 182, 194, 0.5);
          }
        }
      `,
    };
  } else {
    return {
      editor: css``,
    };
  }
};

export const PRQLEditor = (props: Props) => {
  const editor = useRef(null);
  const { queryString: doc, metricNames, readOnly } = props;
  const styles = useStyles2((theme) => getStyles(readOnly));

  // How to make readonly
  useEffect(() => {
    const startState = EditorState.create({
      doc: doc,
      extensions: [
        readOnly ? readonlySetup : basicSetup,
        oneDark,
        [
          prqlLanguage.data.of({
            autocomplete: (context: CompletionContext) => myCompletions(context, metricNames),
          }),
          prql(),
        ],
        [EditorState.readOnly.of(readOnly ?? false)],
      ],
    });

    const view = new PRQLEditorView({
      state: startState,
      parent: editor.current!,
      extensions: [PRQLEditorView.editable.of(!readOnly ?? true)],
    });

    return () => {
      view.destroy();
    };
  }, [doc, metricNames, readOnly]);

  return (
    <div className={styles.editor} id="editor">
      <div ref={editor}></div>
    </div>
  );
};
