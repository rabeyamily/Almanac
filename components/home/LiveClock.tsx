import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { VintageText } from '@/components/ui';
import { Theme } from '@/constants/theme';
import { formatClock, formatVintageDate } from '@/lib/dateUtils';

export function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Tick every second
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.container}>
      <VintageText
        variant="mono"
        size="sm"
        color={Theme.colors.inkFaint}
        style={styles.date}
      >
        {formatVintageDate(now)}
      </VintageText>
      <VintageText
        variant="pixel"
        size="xl"
        color={Theme.colors.ink}
        align="center"
        style={styles.clock}
      >
        {formatClock(now)}
      </VintageText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
  },
  date: {
    letterSpacing: 2,
    marginBottom: Theme.spacing.sm,
  },
  clock: {
    letterSpacing: 4,
  },
});
