import { css } from '@emotion/css';
import React from 'react';

import {
  DataFrame,
  Field,
  getDisplayProcessor,
  getFieldDisplayName,
  GrafanaTheme2,
  LinkModel,
  TimeZone,
} from '@grafana/data';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { VizTooltipContent } from '@grafana/ui/src/components/VizTooltip/VizTooltipContent';
import { VizTooltipHeader } from '@grafana/ui/src/components/VizTooltip/VizTooltipHeader';
import { ColorIndicator, ColorPlacement, LabelValue } from '@grafana/ui/src/components/VizTooltip/types';
import { DEFAULT_TOOLTIP_WIDTH } from '@grafana/ui/src/components/uPlot/plugins/TooltipPlugin2';
import { findNextStateIndex, fmtDuration } from 'app/core/components/TimelineChart/utils';

import { getDataLinks } from '../status-history/utils';

interface StateTimelineTooltip2Props {
  data: DataFrame[];
  alignedData: DataFrame;
  dataIdxs: Array<number | null>;
  seriesIdx: number | null | undefined;
  isPinned: boolean;
  timeZone?: TimeZone;
  onAnnotationAdd?: () => void;
}

export const StateTimelineTooltip2 = ({
  data,
  alignedData,
  dataIdxs,
  seriesIdx,
  timeZone,
  onAnnotationAdd,
}: StateTimelineTooltip2Props) => {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();

  const datapointIdx = dataIdxs.find((idx) => idx !== undefined);

  if (!data || datapointIdx == null || seriesIdx == null) {
    return null;
  }

  const field = alignedData.fields[seriesIdx!];

  const links: Array<LinkModel<Field>> = getDataLinks(field, datapointIdx);

  const xField = alignedData.fields[0];
  const xFieldFmt = xField.display || getDisplayProcessor({ field: xField, timeZone, theme });

  const dataFrameFieldIndex = field.state?.origin;
  const fieldFmt = field.display || getDisplayProcessor({ field, timeZone, theme });
  const value = field.values[datapointIdx!];
  const display = fieldFmt(value);
  const fieldDisplayName = dataFrameFieldIndex
    ? getFieldDisplayName(
        data[dataFrameFieldIndex.frameIndex].fields[dataFrameFieldIndex.fieldIndex],
        data[dataFrameFieldIndex.frameIndex],
        data
      )
    : null;

  const nextStateIdx = findNextStateIndex(field, datapointIdx!);
  let nextStateTs;
  if (nextStateIdx) {
    nextStateTs = xField.values[nextStateIdx!];
  }

  const stateTs = xField.values[datapointIdx!];
  const duration = nextStateTs && fmtDuration(nextStateTs - stateTs);

  let toFragment = null;
  let durationFragment = null;

  if (nextStateTs) {
    const duration = nextStateTs && fmtDuration(nextStateTs - stateTs);
    durationFragment = (
      <>
        <br />
        <strong>Duration:</strong> {duration}
      </>
    );
    toFragment = (
      <>
        {' to'} <strong>{xFieldFmt(xField.values[nextStateIdx!]).text}</strong>
      </>
    );
  }

  const getHeaderLabel = (): LabelValue => {
    return {
      label: '',
      value: xFieldFmt(xField.values[nextStateIdx!]).text ?? xFieldFmt(xField.values[datapointIdx!]).text,
    };
  };

  // const getContentLabelValue = (): LabelValue[] => {
  //   const fromToInt: LabelValue[] = interval ? [{ label: 'Duration', value: formatMilliseconds(interval) }] : [];
  //
  //   return [
  //     {
  //       label: getFieldDisplayName(countField, data.heatmap),
  //       value: data.display!(count),
  //       color: cellColor ?? '#FFF',
  //       colorPlacement: ColorPlacement.trailing,
  //       colorIndicator: ColorIndicator.value,
  //     },
  //     ...getContentLabels(),
  //     ...fromToInt,
  //   ];

  const getContentLabelValue = (): LabelValue[] => {
    const durationEntry: LabelValue[] = duration ? [{ label: 'Duration', value: duration }] : [];

    return [
      {
        label: fieldDisplayName ?? '',
        value: display.text,
        color: display.color,
        colorIndicator: ColorIndicator.value,
        colorPlacement: ColorPlacement.trailing,
      },
      ...durationEntry,
    ];
  };

  return (
    <div className={styles.wrapper}>
      <VizTooltipHeader headerLabel={getHeaderLabel()} />
      <VizTooltipContent contentLabelValue={getContentLabelValue()} />
      {/*{isPinned && <VizTooltipFooter dataLinks={links} canAnnotate={false} />}*/}
    </div>
    // <div>
    //   <div style={{ fontSize: theme.typography.bodySmall.fontSize }}>
    //     {fieldDisplayName}
    //     <br />
    //     <SeriesTableRow label={display.text} color={display.color || FALLBACK_COLOR} isActive />
    //     From <strong>{xFieldFmt(xField.values[datapointIdx!]).text}</strong>
    //     {toFragment}
    //     {durationFragment}
    //   </div>
    //   <div
    //     style={{
    //       margin: theme.spacing(1, -1, -1, -1),
    //       borderTop: `1px solid ${theme.colors.border.weak}`,
    //     }}
    //   >
    //     {onAnnotationAdd && <MenuItem label={'Add annotation'} icon={'comment-alt'} onClick={onAnnotationAdd} />}
    //     {links.length > 0 &&
    //       links.map((link, i) => (
    //         <MenuItem
    //           key={i}
    //           icon={'external-link-alt'}
    //           target={link.target}
    //           label={link.title}
    //           url={link.href}
    //           onClick={link.onClick}
    //         />
    //       ))}
    //   </div>
    // </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    flexDirection: 'column',
    width: DEFAULT_TOOLTIP_WIDTH,
  }),
});
