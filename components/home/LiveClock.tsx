import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { VintageText } from '@/components/ui';
import { Theme } from '@/constants/theme';
import { formatClock, formatVintageDate } from '@/lib/dateUtils';
import { useWeather } from '@/hooks/useWeather';

export function LiveClock() {
  const [now, setNow] = useState(new Date());
  const { weather } = useWeather();

  useEffect(() => {
    // Tick every second
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.dateRow}>
        <VintageText variant="mono" size="sm" color={Theme.colors.inkFaint} style={styles.date}>
          {formatVintageDate(now)}
        </VintageText>

        {weather ? (
          <View style={styles.weatherInline}>
            <VintageText
              variant="pixel"
              size="xs"
              color={
                weather.kind === 'clear'
                  ? Theme.colors.gold
                  : weather.kind === 'cloudy'
                    ? '#5A6E8C'
                    : weather.kind === 'fog'
                      ? Theme.colors.muted
                      : weather.kind === 'rain'
                        ? '#5A6E8C'
                        : weather.kind === 'snow'
                          ? '#5A6E8C'
                          : weather.kind === 'thunder'
                            ? Theme.colors.redLight
                            : Theme.colors.inkFaint
              }
              style={styles.weatherIcon}
            >
              {weather.kind === 'clear'
                ? '☼'
                : weather.kind === 'cloudy'
                  ? '☁'
                  : weather.kind === 'fog'
                    ? '≈'
                    : weather.kind === 'rain'
                      ? '☂'
                      : weather.kind === 'snow'
                        ? '❄'
                        : weather.kind === 'thunder'
                          ? '⚡'
                          : '⋯'}
            </VintageText>
            <VintageText variant="mono" size="sm" color={Theme.colors.muted}>
              {Math.round(weather.temperatureC)}°
            </VintageText>
          </View>
        ) : (
          <View style={styles.weatherInlinePlaceholder} />
        )}
      </View>

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
    width: '100%',
  },
  dateRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    letterSpacing: 2,
    marginBottom: 0,
  },
  weatherInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherIcon: {
    marginBottom: 0,
  },
  weatherInlinePlaceholder: {
    width: 72,
  },
  clock: {
    letterSpacing: 4,
  },
});
