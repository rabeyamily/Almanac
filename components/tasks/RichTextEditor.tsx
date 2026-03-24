import React, { useState, useCallback, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { VintageText } from '@/components/ui';
import { Theme } from '@/constants/theme';
import { RichTextSegment } from '@/lib/types';

const RICH_COLORS = [
  { label: 'INK', value: '#1C1C1C' },
  { label: 'GRN', value: '#4A7C59' },
  { label: 'RED', value: '#C0392B' },
  { label: 'GLD', value: '#C9A84C' },
  { label: 'BLU', value: '#5A6E8C' },
  { label: 'BRN', value: '#6B4C3B' },
];

interface RichTextEditorProps {
  segments: RichTextSegment[];
  onChangeSegments: (segments: RichTextSegment[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function RichTextEditor({
  segments,
  onChangeSegments,
  placeholder = 'Task name...',
  autoFocus = false,
}: RichTextEditorProps) {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [strikethrough, setStrikethrough] = useState(false);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [showColors, setShowColors] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const plainText = segments.map(s => s.text).join('');

  const handleChangeText = useCallback(
    (newText: string) => {
      if (newText.length === 0) {
        onChangeSegments([]);
        return;
      }

      const oldText = segments.map(s => s.text).join('');

      if (newText.length > oldText.length) {
        const added = newText.slice(oldText.length);
        const newSeg: RichTextSegment = {
          text: added,
          bold: bold || undefined,
          italic: italic || undefined,
          underline: underline || undefined,
          strikethrough: strikethrough || undefined,
          color: activeColor,
        };

        const last = segments[segments.length - 1];
        if (
          last &&
          !!last.bold === bold &&
          !!last.italic === italic &&
          !!last.underline === underline &&
          !!last.strikethrough === strikethrough &&
          (last.color ?? null) === activeColor
        ) {
          const updated = [...segments];
          updated[updated.length - 1] = { ...last, text: last.text + added };
          onChangeSegments(updated);
        } else {
          onChangeSegments([...segments, newSeg]);
        }
      } else {
        let charsToRemove = oldText.length - newText.length;
        const updated = [...segments];
        while (charsToRemove > 0 && updated.length > 0) {
          const last = updated[updated.length - 1];
          if (last.text.length <= charsToRemove) {
            charsToRemove -= last.text.length;
            updated.pop();
          } else {
            updated[updated.length - 1] = {
              ...last,
              text: last.text.slice(0, last.text.length - charsToRemove),
            };
            charsToRemove = 0;
          }
        }
        onChangeSegments(updated);
      }
    },
    [segments, onChangeSegments, bold, italic, underline, strikethrough, activeColor]
  );

  return (
    <View style={styles.container}>
      {/* Input area: transparent text input + visible formatted overlay */}
      <TouchableOpacity
        style={styles.inputWrapper}
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
      >
        {/* Formatted text overlay — visible to user */}
        <View style={styles.overlay} pointerEvents="none">
          {segments.length > 0 ? (
            <Text style={styles.overlayText}>
              {segments.map((seg, i) => (
                <Text
                  key={i}
                  style={[
                    styles.overlaySegment,
                    seg.bold && { fontWeight: '700' },
                    seg.italic && { fontStyle: 'italic' },
                    seg.underline && { textDecorationLine: 'underline' },
                    seg.strikethrough && { textDecorationLine: 'line-through' },
                    seg.color ? { color: seg.color } : undefined,
                  ]}
                >
                  {seg.text}
                </Text>
              ))}
            </Text>
          ) : (
            <Text style={styles.placeholderText}>{placeholder}</Text>
          )}
        </View>

        {/* Hidden text input — handles typing and cursor */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={plainText}
          onChangeText={handleChangeText}
          selectionColor={Theme.colors.gold}
          autoFocus={autoFocus}
          multiline={false}
          caretHidden={false}
        />
      </TouchableOpacity>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolBtn, bold && styles.toolBtnActive]}
          onPress={() => setBold(p => !p)}
        >
          <Text style={[styles.toolLabel, bold && styles.toolLabelActive, { fontWeight: '900' }]}>B</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, italic && styles.toolBtnActive]}
          onPress={() => setItalic(p => !p)}
        >
          <Text style={[styles.toolLabel, italic && styles.toolLabelActive, { fontStyle: 'italic' }]}>I</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, underline && styles.toolBtnActive]}
          onPress={() => setUnderline(p => !p)}
        >
          <Text style={[styles.toolLabel, underline && styles.toolLabelActive, { textDecorationLine: 'underline' }]}>U</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, strikethrough && styles.toolBtnActive]}
          onPress={() => setStrikethrough(p => !p)}
        >
          <Text style={[styles.toolLabel, strikethrough && styles.toolLabelActive, { textDecorationLine: 'line-through' }]}>S</Text>
        </TouchableOpacity>

        <View style={styles.toolSep} />

        <TouchableOpacity
          style={[styles.toolBtn, showColors && styles.toolBtnActive]}
          onPress={() => setShowColors(p => !p)}
        >
          <View style={[styles.colorSwatch, { backgroundColor: activeColor ?? Theme.colors.ink }]} />
        </TouchableOpacity>

        {(bold || italic || underline || strikethrough || activeColor) ? (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => { setBold(false); setItalic(false); setUnderline(false); setStrikethrough(false); setActiveColor(null); }}
          >
            <VintageText variant="mono" size="xs" color={Theme.colors.red}>CLR</VintageText>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Color picker dropdown */}
      {showColors ? (
        <View style={styles.colorPicker}>
          <TouchableOpacity
            style={[styles.colorOption, activeColor === null && styles.colorOptionActive]}
            onPress={() => { setActiveColor(null); setShowColors(false); }}
          >
            <VintageText variant="mono" size="xs" color={Theme.colors.ink}>DEFAULT</VintageText>
          </TouchableOpacity>
          {RICH_COLORS.map(c => (
            <TouchableOpacity
              key={c.value}
              style={[styles.colorOption, activeColor === c.value && styles.colorOptionActive]}
              onPress={() => { setActiveColor(c.value); setShowColors(false); }}
            >
              <View style={[styles.colorDot, { backgroundColor: c.value }]} />
              <VintageText variant="mono" size="xs" color={c.value}>{c.label}</VintageText>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {segments.length === 0 ? (
        <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.hint}>
          Toggle B/I/U/S then type — text gets that style
        </VintageText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.sm,
  },
  inputWrapper: {
    borderWidth: Theme.borderWidth.normal,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.paper,
    minHeight: 44,
    justifyContent: 'center',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  overlayText: {
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoMd,
    color: Theme.colors.ink,
    lineHeight: Theme.fontSize.monoMd * 1.5,
  },
  overlaySegment: {
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoMd,
    color: Theme.colors.ink,
  },
  placeholderText: {
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoMd,
    color: Theme.colors.inkFaint,
  },
  hiddenInput: {
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoMd,
    color: 'transparent',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    includeFontPadding: false,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.paperDark,
  },
  toolBtn: {
    width: 30,
    height: 28,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.paper,
  },
  toolBtnActive: {
    backgroundColor: Theme.colors.ink,
    borderColor: Theme.colors.ink,
  },
  toolLabel: {
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoSm,
    color: Theme.colors.ink,
  },
  toolLabelActive: {
    color: Theme.colors.paper,
  },
  toolSep: {
    width: 1,
    height: 20,
    backgroundColor: Theme.colors.borderLight,
    marginHorizontal: 4,
  },
  colorSwatch: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  clearBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Theme.colors.red,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.paperDark,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  colorOptionActive: {
    borderColor: Theme.colors.ink,
    backgroundColor: Theme.colors.paper,
  },
  colorDot: {
    width: 10,
    height: 10,
  },
  hint: {
    marginTop: 4,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
});
