import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { VintageText, VintageBox, Divider } from '@/components/ui';
import { Theme } from '@/constants/theme';
import { MoodEntry } from '@/lib/types';
import { formatShortDate, fromDateKey } from '@/lib/dateUtils';
import {
  journalSegmentsToPlainText,
  parseJournalSegments,
  serializeJournalSegments,
  type JournalLinePreset,
  type JournalRichSegment,
} from '@/lib/journalRichText';

interface JournalEntryProps {
  entry: MoodEntry | null;
  onSave: (text: string) => void;
  isSaving: boolean;
}

const RICH_COLORS = [
  '#1C1C1C',
  '#4A7C59',
  '#C0392B',
  '#C9A84C',
  '#5A6E8C',
  '#6B4C3B',
  '#8B5A8B',
  '#3A6B6B',
  '#7A6E4A',
];

const STYLE_PRESETS: Array<{ id: JournalLinePreset; label: string }> = [
  { id: 'title', label: 'TITLE' },
  { id: 'heading', label: 'HEADING' },
  { id: 'subheading', label: 'SUBHEADING' },
  { id: 'body', label: 'BODY' },
];

function formatTimeOnly(ts: string | null | undefined) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatFullDateOnly(dateKey: string | null | undefined) {
  if (!dateKey) return '—';
  try {
    return formatShortDate(fromDateKey(dateKey));
  } catch {
    return '—';
  }
}

export function JournalEntry({ entry, onSave, isSaving }: JournalEntryProps) {
  const [segments, setSegments] = useState<JournalRichSegment[]>(() => parseJournalSegments(entry?.journal_text ?? null));
  const [editing, setEditing] = useState(false);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [strikethrough, setStrikethrough] = useState(false);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [showColors, setShowColors] = useState(false);
  const [colorTarget, setColorTarget] = useState<'text' | 'highlight'>('text');
  const [activePreset, setActivePreset] = useState<JournalLinePreset>('body');
  const [startedAt, setStartedAt] = useState<string | null>(entry?.created_at ?? null);
  const [lastEditedAt, setLastEditedAt] = useState<string | null>(entry?.updated_at ?? null);
  const inputRef = useRef<TextInput>(null);
  const MIN_INPUT_HEIGHT = 120;
  const [inputHeight, setInputHeight] = useState<number>(MIN_INPUT_HEIGHT);
  const plainText = useMemo(() => journalSegmentsToPlainText(segments), [segments]);
  const todayDateLabel = formatFullDateOnly(entry?.entry_date ?? null);

  useEffect(() => {
    const incomingSegments = parseJournalSegments(entry?.journal_text ?? null);
    setSegments(incomingSegments);
    setStartedAt(entry?.created_at ?? null);
    setLastEditedAt(entry?.updated_at ?? null);
    setActivePreset(incomingSegments.length > 0 ? 'body' : 'title');
    setEditing(false);
  }, [entry?.id, entry?.journal_text, entry?.created_at, entry?.updated_at]);

  const handleChangeText = (newText: string) => {
    if (!startedAt && newText.length > 0) {
      setStartedAt(new Date().toISOString());
    }
    if (newText !== plainText) {
      setLastEditedAt(new Date().toISOString());
    }

    if (newText.length === 0) {
      setSegments([]);
      setActivePreset('title');
      return;
    }

    const oldText = plainText;
    if (newText.length > oldText.length) {
      const added = newText.slice(oldText.length);
      const autoPreset = oldText.length === 0 ? 'title' : activePreset;
      const newSeg: JournalRichSegment = {
        text: added,
        bold: bold || undefined,
        italic: italic || undefined,
        underline: underline || undefined,
        strikethrough: strikethrough || undefined,
        color: activeColor,
        highlight: activeHighlight,
        stylePreset: autoPreset,
      };
      const prev = segments[segments.length - 1];
      if (
        prev &&
        !!prev.bold === bold &&
        !!prev.italic === italic &&
        !!prev.underline === underline &&
        !!prev.strikethrough === strikethrough &&
        (prev.color ?? null) === activeColor &&
        (prev.highlight ?? null) === activeHighlight &&
        (prev.stylePreset ?? 'body') === autoPreset
      ) {
        const updated = [...segments];
        updated[updated.length - 1] = { ...prev, text: prev.text + added };
        setSegments(updated);
      } else {
        setSegments([...segments, newSeg]);
      }
      if (added.includes('\n') && activePreset === 'title') {
        setActivePreset('body');
      }
      return;
    }

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
    setSegments(updated);
  };

  const handleSave = () => {
    onSave(serializeJournalSegments(segments));
    setEditing(false);
  };

  const hexToRgba = (hex: string, alpha: number) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <VintageBox borderStyle="single" style={styles.container}>
      <VintageText variant="pixel" size="xs" color={Theme.colors.inkFaint} style={styles.heading}>
        JOURNAL — TODAY  {todayDateLabel}
      </VintageText>
      <View style={styles.timestamps}>
        <VintageText variant="mono" size="xs" color={Theme.colors.muted}>
          Started: {formatTimeOnly(startedAt)}
        </VintageText>
        <VintageText variant="mono" size="xs" color={Theme.colors.muted}>
          Last edited: {formatTimeOnly(lastEditedAt)}
        </VintageText>
      </View>
      <Divider marginVertical={Theme.spacing.sm} />

      <View style={styles.toolbar}>
        <TouchableOpacity style={[styles.toolBtn, bold && styles.toolBtnActive]} onPress={() => setBold(v => !v)}>
          <Text style={[styles.toolLabel, bold && styles.toolLabelActive, { fontWeight: '900' }]}>B</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toolBtn, italic && styles.toolBtnActive]} onPress={() => setItalic(v => !v)}>
          <Text style={[styles.toolLabel, italic && styles.toolLabelActive, { fontStyle: 'italic' }]}>I</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toolBtn, underline && styles.toolBtnActive]} onPress={() => setUnderline(v => !v)}>
          <Text style={[styles.toolLabel, underline && styles.toolLabelActive, { textDecorationLine: 'underline' }]}>U</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toolBtn, strikethrough && styles.toolBtnActive]} onPress={() => setStrikethrough(v => !v)}>
          <Text style={[styles.toolLabel, strikethrough && styles.toolLabelActive, { textDecorationLine: 'line-through' }]}>S</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolBtn, showColors && colorTarget === 'text' ? styles.toolBtnActive : undefined]}
          onPress={() => {
            setColorTarget('text');
            setShowColors(true);
          }}
        >
          <View style={[styles.colorSwatch, { backgroundColor: activeColor ?? Theme.colors.ink }]} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolBtn, activeHighlight && styles.toolBtnActive]}
          onPress={() => {
            if (activeHighlight) {
              setActiveHighlight(null);
              setShowColors(false);
            } else {
              setColorTarget('highlight');
              setShowColors(true);
            }
          }}
        >
          <View style={[styles.highlightSwatch, { backgroundColor: activeHighlight ?? Theme.colors.paperDark }]} />
        </TouchableOpacity>
        <View style={styles.sep} />
        <View style={styles.stylePicker}>
          {STYLE_PRESETS.map(preset => (
            <TouchableOpacity
              key={preset.id}
              style={[styles.styleChip, activePreset === preset.id && styles.styleChipActive]}
              onPress={() => setActivePreset(preset.id)}
            >
              <VintageText
                variant="mono"
                size="xs"
                color={activePreset === preset.id ? Theme.colors.paper : Theme.colors.inkFaint}
              >
                {preset.label}
              </VintageText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {showColors ? (
        <View style={styles.colorRow}>
          {RICH_COLORS.map(color => (
            <TouchableOpacity
              key={color}
              onPress={() => {
                if (colorTarget === 'text') setActiveColor(color);
                else setActiveHighlight(color);
                setShowColors(false);
              }}
              style={[
                styles.colorDot,
                { backgroundColor: color },
                (colorTarget === 'text' ? activeColor === color : activeHighlight === color) &&
                  styles.colorDotActive,
              ]}
            />
          ))}
        </View>
      ) : null}

      <TouchableOpacity style={styles.inputWrap} activeOpacity={1} onPress={() => inputRef.current?.focus()}>
        <View style={[styles.overlay, { zIndex: 0 }]} pointerEvents="none">
          {segments.length > 0 ? (
            <Text style={styles.overlayText}>
              {segments.map((seg, i) => {
                const preset = seg.stylePreset ?? 'body';
                const presetStyle =
                  preset === 'title'
                    ? styles.titleText
                    : preset === 'heading'
                      ? styles.headingText
                      : preset === 'subheading'
                        ? styles.subheadingText
                        : styles.bodyText;
                return (
                  <Text
                    key={i}
                    style={[
                      presetStyle,
                      seg.bold && { fontWeight: '700' },
                      seg.italic && { fontStyle: 'italic' },
                      seg.underline && { textDecorationLine: 'underline' },
                      seg.strikethrough && { textDecorationLine: 'line-through' },
                      seg.color ? { color: seg.color } : undefined,
                      seg.highlight ? { backgroundColor: hexToRgba(seg.highlight, 0.28) } : undefined,
                    ]}
                  >
                    {seg.text}
                  </Text>
                );
              })}
            </Text>
          ) : (
            <Text style={styles.placeholder}>Write your thoughts for today...</Text>
          )}
        </View>
        <TextInput
          ref={inputRef}
          style={[styles.hiddenInput, { height: Math.max(MIN_INPUT_HEIGHT, inputHeight) }]}
          value={plainText}
          onChangeText={handleChangeText}
          onFocus={() => setEditing(true)}
          multiline
          placeholder=""
          selectionColor={Theme.colors.gold}
          caretHidden={false}
          scrollEnabled={false}
          textAlignVertical="top"
          onContentSizeChange={e => {
            const next = Math.max(MIN_INPUT_HEIGHT, e.nativeEvent.contentSize.height);
            setInputHeight(next);
          }}
        />
      </TouchableOpacity>

      {editing && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.saveBtn, { borderColor: Theme.colors.green }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <VintageText variant="mono" size="sm" color={Theme.colors.green}>
              {isSaving ? 'SAVING...' : '✓ SAVE ENTRY'}
            </VintageText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, { borderColor: Theme.colors.muted }]}
            onPress={() => {
              const incomingSegments = parseJournalSegments(entry?.journal_text ?? null);
              setSegments(incomingSegments);
              setActivePreset(incomingSegments.length > 0 ? 'body' : 'title');
              setStartedAt(entry?.created_at ?? null);
              setLastEditedAt(entry?.updated_at ?? null);
              setEditing(false);
            }}
          >
            <VintageText variant="mono" size="sm" color={Theme.colors.muted}>
              × CANCEL
            </VintageText>
          </TouchableOpacity>
        </View>
      )}
    </VintageBox>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Theme.spacing.md,
  },
  heading: {
    letterSpacing: 2,
    marginBottom: 2,
  },
  timestamps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.paperDark,
    flexWrap: 'wrap',
  },
  toolBtn: {
    width: 28,
    height: 26,
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
  colorSwatch: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  highlightSwatch: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  sep: {
    width: 1,
    height: 20,
    backgroundColor: Theme.colors.borderLight,
    marginHorizontal: 2,
  },
  stylePicker: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  styleChip: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.paper,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  styleChipActive: {
    backgroundColor: Theme.colors.ink,
    borderColor: Theme.colors.ink,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.paperDark,
    paddingHorizontal: 6,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  colorDotActive: {
    borderColor: Theme.colors.ink,
    borderWidth: 2,
  },
  inputWrap: {
    borderWidth: Theme.borderWidth.normal,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.paper,
    minHeight: 120,
    position: 'relative',
    marginTop: 6,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  overlayText: {
    color: Theme.colors.ink,
    lineHeight: Theme.fontSize.monoMd * 1.5,
  },
  titleText: {
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoLg,
    fontWeight: '700',
    color: Theme.colors.ink,
  },
  headingText: {
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoMd,
    fontWeight: '700',
    color: Theme.colors.ink,
  },
  subheadingText: {
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoSm,
    fontWeight: '700',
    color: Theme.colors.inkLight,
  },
  bodyText: {
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoMd,
    color: Theme.colors.ink,
  },
  placeholder: {
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoMd,
    color: Theme.colors.inkFaint,
  },
  hiddenInput: {
    color: 'transparent',
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoMd,
    minHeight: 120,
    lineHeight: Theme.fontSize.monoMd * 1.5,
    paddingHorizontal: 2,
    paddingVertical: 4,
    zIndex: 1,
    includeFontPadding: false,
  },
  actions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
  },
  saveBtn: {
    borderWidth: 1,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
  },
});
