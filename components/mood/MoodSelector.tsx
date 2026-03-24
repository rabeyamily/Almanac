import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { VintageText } from '@/components/ui';
import { Theme } from '@/constants/theme';
import { MoodLevel } from '@/lib/types';

interface MoodOption {
  level: MoodLevel;
  symbol: string;
  label: string;
  color: string;
}

// Vintage-style symbols instead of modern emojis
const MOODS: MoodOption[] = [
  { level: 1, symbol: '▼▼', label: 'AWFUL',   color: Theme.colors.red },
  { level: 2, symbol: '▼',  label: 'LOW',     color: Theme.colors.redLight },
  { level: 3, symbol: '—',  label: 'NEUTRAL', color: Theme.colors.muted },
  { level: 4, symbol: '▲',  label: 'GOOD',    color: Theme.colors.green },
  { level: 5, symbol: '▲▲', label: 'GREAT',   color: Theme.colors.greenDark },
];

interface MoodSelectorProps {
  selected: MoodLevel | null;
  onSelect: (level: MoodLevel) => void;
}

export function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  const selectedIndex = selected ? MOODS.findIndex(m => m.level === selected) : -1;

  return (
    <View style={styles.container}>
      <VintageText variant="pixel" size="xs" color={Theme.colors.inkFaint} style={styles.heading}>
        TODAY'S MOOD
      </VintageText>
      <View style={styles.dial}>
        <View style={styles.track}>
          {MOODS.map((m, idx) => {
            const isActive = selected === m.level;
            return (
              <TouchableOpacity
                key={m.level}
                style={styles.notchHit}
                onPress={() => onSelect(m.level)}
                activeOpacity={0.75}
              >
                <View style={[styles.notch, { borderColor: m.color }, isActive && { backgroundColor: m.color }]} />
                <VintageText variant="mono" size="xs" color={isActive ? m.color : Theme.colors.inkFaint} align="center">
                  {m.symbol}
                </VintageText>
                <VintageText variant="mono" size="xs" color={isActive ? Theme.colors.ink : Theme.colors.muted} align="center">
                  {m.label}
                </VintageText>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedIndex >= 0 ? (
          <View style={[styles.indicatorWrap, { left: `${selectedIndex * 25}%` }]}>
            <VintageText variant="mono" size="sm" color={MOODS[selectedIndex].color} align="center">
              ▼
            </VintageText>
          </View>
        ) : null}

        <View style={styles.scaleLabels}>
          <VintageText variant="mono" size="xs" color={Theme.colors.redDark}>AWFUL</VintageText>
          <VintageText variant="mono" size="xs" color={Theme.colors.greenDark}>GREAT</VintageText>
        </View>
      </View>
      <View style={styles.tapRow}>
        {MOODS.map(m => (
          <TouchableOpacity key={`tap-${m.level}`} onPress={() => onSelect(m.level)} style={styles.tapChip} activeOpacity={0.75}>
            <VintageText variant="mono" size="xs" color={selected === m.level ? m.color : Theme.colors.inkFaint} align="center">
              {m.level}
            </VintageText>
          </TouchableOpacity>
        ))}
      </View>
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
  dial: {
    borderWidth: Theme.borderWidth.normal,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.paperDark,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.sm,
  },
  track: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.xs,
    borderTopWidth: Theme.borderWidth.thin,
    borderBottomWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.border,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.sm,
  },
  notchHit: {
    width: '20%',
    alignItems: 'center',
    gap: 3,
  },
  notch: {
    width: 16,
    height: 16,
    borderWidth: Theme.borderWidth.normal,
    backgroundColor: Theme.colors.paper,
  },
  indicatorWrap: {
    position: 'absolute',
    top: 2,
    width: '20%',
  },
  scaleLabels: {
    marginTop: Theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tapRow: {
    marginTop: Theme.spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tapChip: {
    width: '19%',
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.borderLight,
    paddingVertical: 4,
    backgroundColor: Theme.colors.paper,
  },
});
