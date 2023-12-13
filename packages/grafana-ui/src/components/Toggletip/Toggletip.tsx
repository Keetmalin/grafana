import { css, cx } from '@emotion/css';
import {
  arrow,
  autoUpdate,
  flip,
  FloatingArrow,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react';
import { Placement } from '@popperjs/core';
import React, { useRef, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';

import { useStyles2 } from '../../themes/ThemeContext';
import { buildTooltipTheme, getPlacement } from '../../utils/tooltipUtils';
import { IconButton } from '../IconButton/IconButton';
import { Portal } from '../Portal/Portal';

import { ToggletipContent } from './types';

export interface ToggletipProps {
  /** The theme used to display the toggletip */
  theme?: 'info' | 'error';
  /** The title to be displayed on the header */
  title?: JSX.Element | string;
  /** determine whether to show or not the close button **/
  closeButton?: boolean;
  /** Callback function to be called when the toggletip is closed */
  onClose?: Function;
  /** The preferred placement of the toggletip */
  placement?: Placement;
  /** The text or component that houses the content of the toggleltip */
  content: ToggletipContent;
  /** The text or component to be displayed on the toggletip's bottom */
  footer?: JSX.Element | string;
  /** The UI control users interact with to display toggletips */
  children: JSX.Element;
  /** Determine whether the toggletip should fit its content or not */
  fitContent?: boolean;
  /** Determine whether the toggletip should be shown or not */
  show?: boolean;
  /** Callback function to be called when the toggletip is opened */
  onOpen?: () => void;
}

export const Toggletip = React.memo(
  ({
    children,
    theme = 'info',
    placement = 'auto',
    content,
    title,
    closeButton = true,
    onClose,
    footer,
    fitContent = false,
    onOpen,
    show,
  }: ToggletipProps) => {
    const arrowRef = useRef(null);
    const styles = useStyles2(getStyles);
    const style = styles[theme];
    const [controlledVisible, setControlledVisible] = useState(show);

    // the order of middleware is important!
    // `arrow` should almost always be at the end
    // see https://floating-ui.com/docs/arrow#order
    const middleware = [
      offset(8),
      flip({
        fallbackAxisSideDirection: 'end',
        // see https://floating-ui.com/docs/flip#combining-with-shift
        crossAxis: false,
        boundary: document.body,
      }),
      shift(),
      arrow({
        element: arrowRef,
      }),
    ];

    const { context, refs, floatingStyles } = useFloating({
      open: show ?? controlledVisible,
      placement: getPlacement(placement),
      onOpenChange: (open) => {
        if (show === undefined) {
          setControlledVisible(open);
        }
        if (!open) {
          onClose?.();
        } else {
          onOpen?.();
        }
      },
      middleware,
      whileElementsMounted: autoUpdate,
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);

    const { getReferenceProps, getFloatingProps } = useInteractions([dismiss, click]);

    return (
      <>
        {React.cloneElement(children, {
          ref: refs.setReference,
          tabIndex: 0,
          'aria-expanded': controlledVisible,
          ...getReferenceProps(),
        })}
        {controlledVisible && (
          <Portal>
            <div
              data-testid="toggletip-content"
              className={cx(style.container, {
                [styles.fitContent]: fitContent,
              })}
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
            >
              <FloatingArrow className={style.arrow} ref={arrowRef} context={context} />
              {Boolean(title) && <div className={style.header}>{title}</div>}
              {closeButton && (
                <div className={style.headerClose}>
                  <IconButton
                    tooltip="Close"
                    name="times"
                    data-testid="toggletip-header-close"
                    onClick={() => setControlledVisible(false)}
                  />
                </div>
              )}
              <div className={style.body}>
                {(typeof content === 'string' || React.isValidElement(content)) && content}
                {typeof content === 'function' && content({})}
              </div>
              {Boolean(footer) && <div className={style.footer}>{footer}</div>}
            </div>
          </Portal>
        )}
      </>
    );
  }
);

Toggletip.displayName = 'Toggletip';

export const getStyles = (theme: GrafanaTheme2) => {
  const info = buildTooltipTheme(
    theme,
    theme.colors.background.primary,
    theme.colors.border.weak,
    theme.components.tooltip.text,
    { topBottom: 2, rightLeft: 2 }
  );
  const error = buildTooltipTheme(
    theme,
    theme.colors.error.main,
    theme.colors.error.main,
    theme.colors.error.contrastText,
    { topBottom: 2, rightLeft: 2 }
  );

  return {
    info,
    error,
    fitContent: css({
      maxWidth: 'fit-content',
    }),
  };
};
