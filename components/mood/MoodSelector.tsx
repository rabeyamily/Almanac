import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { VintageText } from '@/components/ui';
import { Theme } from '@/constants/theme';
import { MoodLevel } from '@/lib/types';

interface MoodOption {
  level: MoodLevel;
  label: string;
  color: string;
}

// Segments on a physical “mood meter” rail.
const MOODS: MoodOption[] = [
  { level: 1, label: 'AWFUL', color: Theme.colors.redDark }, // deep burgundy
  { level: 2, label: 'LOW', color: Theme.colors.redLight }, // warm coral
  { level: 3, label: 'NEUTRAL', color: Theme.colors.paperDeep }, // warm tan
  { level: 4, label: 'GOOD', color: Theme.colors.categoryColors[7] }, // teal/blue-green
  { level: 5, label: 'GREAT', color: Theme.colors.greenDark }, // forest green
];

interface MoodSelectorProps {
  selected: MoodLevel | null;
  onSelect: (level: MoodLevel) => void;
}

export function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  const [draftLevel, setDraftLevel] = useState<MoodLevel>(selected ?? 3);
  const draftLevelRef = useRef<MoodLevel>(selected ?? 3);

  // Track measurement for accurate dragging bounds.
  const [railWidth, setRailWidth] = useState(0);
  const railWidthRef = useRef(0);

  const HANDLE_SIZE = 30;
  const handleTranslateX = useRef(new Animated.Value(0)).current;
  const translateXRef = useRef(0);

  useEffect(() => {
    const next = (selected ?? 3) as MoodLevel;
    setDraftLevel(next);
    draftLevelRef.current = next;
  }, [selected]);

  const moodByLevel = useMemo(() => {
    const map = new Map<MoodLevel, MoodOption>();
    MOODS.forEach(m => map.set(m.level, m));
    return map;
  }, []);

  const getLevelFromTranslate = (x: number): MoodLevel => {
    const max = Math.max(1, railWidthRef.current - HANDLE_SIZE);
    const t = Math.max(0, Math.min(max, x));
    const fraction = t / max; // 0..1
    const idx = Math.round(fraction * 4); // 0..4
    return (idx + 1) as MoodLevel;
  };

  const snapTranslateForLevel = (level: MoodLevel) => {
    const max = Math.max(1, railWidthRef.current - HANDLE_SIZE);
    const idx = level - 1; // 0..4
    return (idx / 4) * max;
  };

  // Keep handle aligned when the parent updates selection.
  useEffect(() => {
    if (!railWidth) return;
    const target = snapTranslateForLevel(draftLevel);
    translateXRef.current = target;
    handleTranslateX.setValue(target);
  }, [railWidth, draftLevel]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: evt => {
        if (!railWidthRef.current) return;
        const max = Math.max(1, railWidthRef.current - HANDLE_SIZE);

        const xIn = evt.nativeEvent.locationX - HANDLE_SIZE / 2;
        const clamped = Math.max(0, Math.min(max, xIn));
        translateXRef.current = clamped;
        draftLevelRef.current = getLevelFromTranslate(clamped);
        setDraftLevel(draftLevelRef.current);

        handleTranslateX.setValue(clamped);
      },

      onPanResponderMove: evt => {
        if (!railWidthRef.current) return;
        const max = Math.max(1, railWidthRef.current - HANDLE_SIZE);

        const xIn = evt.nativeEvent.locationX - HANDLE_SIZE / 2;
        const clamped = Math.max(0, Math.min(max, xIn));
        translateXRef.current = clamped;

        const next = getLevelFromTranslate(clamped);
        if (next !== draftLevelRef.current) {
          draftLevelRef.current = next;
          setDraftLevel(next);
        }

        handleTranslateX.setValue(clamped);
      },

      onPanResponderRelease: () => {
        if (!railWidthRef.current) return;
        const lvl = draftLevelRef.current;
        const snapped = snapTranslateForLevel(lvl);
        translateXRef.current = snapped;
        Animated.timing(handleTranslateX, {
          toValue: snapped,
          duration: 120,
          useNativeDriver: false,
        }).start();
        onSelect(lvl);
      },
    }),
  ).current;

  const activeLabel = moodByLevel.get(draftLevel)?.label ?? '—';
  const activeColor = moodByLevel.get(draftLevel)?.color ?? Theme.colors.muted;

  return (
    <View style={styles.container}>
      <VintageText variant="pixel" size="xs" color={Theme.colors.inkFaint} style={styles.heading}>
        TODAY'S MOOD
      </VintageText>

      <View style={styles.card}>
        <View
          style={styles.rail}
          onLayout={e => {
            const w = e.nativeEvent.layout.width;
            railWidthRef.current = w;
            setRailWidth(w);
          }}
        >
          <View style={styles.segmentsRow}>
            {MOODS.map((m, idx) => {
              const isActive = idx <= draftLevel - 1;
              return (
                <View
                  // eslint-disable-next-line react/no-array-index-key
                  key={m.level}
                  style={[
                    styles.segment,
                    {
                      backgroundColor: m.color,
                      opacity: isActive ? 1 : 0.28,
                    },
                  ]}
                />
              );
            })}
          </View>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.handle,
              {
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                transform: [{ translateX: handleTranslateX }],
                borderColor: activeColor,
              },
            ]}
          >
            <VintageText
              variant="mono"
              size="xs"
              color={activeColor}
              align="center"
              style={styles.handleGlyph}
            >
              ◆
            </VintageText>
          </Animated.View>

          {/* Touch overlay so you can drag anywhere on the rail */}
          <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} />
        </View>
      </View>

      <VintageText variant="mono" size="xs" color={activeColor} align="center" style={styles.selectedMoodWrap}>
        {activeLabel}
      </VintageText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.md,
  },
  heading: {
    letterSpacing: 2,
    marginBottom: Theme.spacing.sm,
  },
  card: {
    borderWidth: Theme.borderWidth.normal,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.paperDark,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
  },
  rail: {
    position: 'relative',
    height: 38,
    borderWidth: 2,
    borderColor: Theme.colors.borderLight,
    borderRadius: 6,
    backgroundColor: Theme.colors.inkLight,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  segmentsRow: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
  },
  segment: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: Theme.colors.borderLight,
  },
  handle: {
    position: 'absolute',
    top: '50%',
    left: 0,
    marginTop: -15,
    borderWidth: 2,
    borderRadius: 999,
    backgroundColor: Theme.colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleGlyph: {
    lineHeight: 12,
    marginTop: -1,
  },
  selectedMoodWrap: {
    marginTop: Theme.spacing.xs,
    letterSpacing: 2,
  },
});
