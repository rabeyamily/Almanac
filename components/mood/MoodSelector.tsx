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
  return (
    <View style={styles.container}>
      <VintageText variant="pixel" size="xs" color={Theme.colors.inkFaint} style={styles.heading}>
        TODAY'S MOOD
      </VintageText>
      <View style={styles.row}>
        {MOODS.map(m => {
          const isActive = selected === m.level;
          return (
            <TouchableOpacity
              key={m.level}
              style={[
                styles.tile,
                { borderColor: m.color },
                isActive && { backgroundColor: m.color },
              ]}
              onPress={() => onSelect(m.level)}
              activeOpacity={0.7}
            >
              <VintageText
                variant="mono"
                size="lg"
                color={isActive ? Theme.colors.paper : m.color}
                align="center"
                style={styles.symbol}
              >
                {m.symbol}
              </VintageText>
              <VintageText
                variant="mono"
                size="xs"
                color={isActive ? Theme.colors.paper : m.color}
                align="center"
              >
                {m.label}
              </VintageText>
            </TouchableOpacity>
          );
        })}
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
    marginBottom: Theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
  },
  tile: {
    flex: 1,
    borderWidth: Theme.borderWidth.normal,
    paddingVertical: Theme.spacing.sm,
    alignItems: 'center',
  },
  symbol: {
    marginBottom: 4,
    letterSpacing: 2,
  },
});
