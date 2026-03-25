import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { VintageBox, Divider, VintageText } from '@/components/ui';
import { Theme } from '@/constants/theme';
import { useWeather } from '@/hooks/useWeather';

export function WeatherCard() {
  const { weather, loading, error, refresh } = useWeather();

  return (
    <VintageBox borderStyle="single" style={styles.box}>
      <View style={styles.headerRow}>
        <VintageText variant="pixel" size="xs" color={Theme.colors.gold} style={styles.title}>
          WEATHER
        </VintageText>
        <TouchableOpacity onPress={() => void refresh()} activeOpacity={0.7} style={styles.refreshBtn}>
          <VintageText variant="mono" size="sm" color={Theme.colors.muted}>
            ⟳
          </VintageText>
        </TouchableOpacity>
      </View>

      <Divider marginVertical={Theme.spacing.xs} />

      {loading ? (
        <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint}>
          SYNCING...
        </VintageText>
      ) : error ? (
        <VintageText variant="mono" size="xs" color={Theme.colors.redLight}>
          {error}
        </VintageText>
      ) : weather ? (
        <View style={styles.contentRow}>
          <VintageText
            variant="pixel"
            size="sm"
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
          >
            {weather.kind === 'clear' ? '☼' : weather.kind === 'cloudy' ? '☁' : weather.kind === 'fog' ? '≈' : weather.kind === 'rain' ? '☂' : weather.kind === 'snow' ? '❄' : weather.kind === 'thunder' ? '⚡' : '⋯'}
          </VintageText>

          <View style={styles.mainText}>
            <VintageText variant="pixel" size="sm" color={Theme.colors.ink}>
              {Math.round(weather.temperatureC)}°C
            </VintageText>
            <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint}>
              {weather.condition} {weather.windKph != null ? `· WIND ${Math.round(weather.windKph)} KMH` : ''}
            </VintageText>
            <VintageText variant="mono" size="xs" color={Theme.colors.muted}>
              UPDATED {new Date(weather.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </VintageText>
          </View>
        </View>
      ) : (
        <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint}>
          NO DATA
        </VintageText>
      )}
    </VintageBox>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: Theme.spacing.sm,
    padding: Theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    letterSpacing: 1.5,
  },
  refreshBtn: {
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: Theme.spacing.xs,
  },
  contentRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    alignItems: 'center',
    marginTop: Theme.spacing.xs,
  },
  mainText: {
    flex: 1,
  },
});

