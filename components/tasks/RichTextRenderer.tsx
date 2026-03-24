import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';
import { RichTextSegment } from '@/lib/types';

interface RichTextRendererProps {
  segments: RichTextSegment[];
  dimmed?: boolean;
}

/**
 * Renders an array of RichTextSegment as styled <Text> spans.
 * Falls back to plain text if segments is empty/null.
 */
export function RichTextRenderer({ segments, dimmed = false }: RichTextRendererProps) {
  if (!segments || segments.length === 0) return null;

  return (
    <Text style={styles.base}>
      {segments.map((seg, i) => (
        <Text
          key={i}
          style={[
            styles.segment,
            seg.bold && styles.bold,
            seg.italic && styles.italic,
            seg.underline && styles.underline,
            seg.strikethrough && styles.strikethrough,
            seg.color ? { color: seg.color } : undefined,
            dimmed && styles.dimmed,
          ]}
        >
          {seg.text}
        </Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoMd,
    color: Theme.colors.ink,
    lineHeight: Theme.fontSize.monoMd * 1.5,
  },
  segment: {
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoMd,
    color: Theme.colors.ink,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  dimmed: {
    opacity: 0.5,
  },
});
