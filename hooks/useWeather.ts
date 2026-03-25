import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

type WeatherKind = 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'thunder' | 'unknown';

export interface WeatherData {
  temperatureC: number;
  windKph: number | null;
  condition: string;
  kind: WeatherKind;
  updatedAt: string;
}

const WEATHER_KIND_META: Record<WeatherKind, { label: string; icon: string; color: string }> = {
  clear: { label: 'CLEAR', icon: '☼', color: '#C9A84C' }, // brass gold
  cloudy: { label: 'CLOUDY', icon: '☁', color: '#5A6E8C' }, // slate blue
  fog: { label: 'FOG', icon: '≈', color: '#8B7355' }, // muted
  rain: { label: 'RAIN', icon: '☂', color: '#5A6E8C' },
  snow: { label: 'SNOW', icon: '❄', color: '#5A6E8C' },
  thunder: { label: 'STORM', icon: '⚡', color: '#C0392B' }, // faded red
  unknown: { label: 'WEATHER', icon: '⋯', color: '#6B6B6B' },
};

function weatherKindFromOpenMeteoCode(code: number | null | undefined): WeatherKind {
  if (code == null) return 'unknown';
  // Open-Meteo (WMO) weather codes:
  // 0 Clear sky
  // 1..2 Mainly clear / partly cloudy
  // 3 Overcast
  // 45..48 Fog / depositing rime fog
  // 51..57 Drizzle
  // 61..67 Rain
  // 71..77 Snow
  // 80..82 Rain showers
  // 95..99 Thunderstorm
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'clear';
  if (code === 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'fog';
  if (code >= 51 && code <= 57) return 'rain';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 95 && code <= 99) return 'thunder';
  return 'unknown';
}

async function fetchOpenMeteoCurrent(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=c&wind_speed_unit=kmh&timezone=auto&forecast_days=1`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo error: ${res.status}`);
  }
  const json = (await res.json()) as any;

  const current = json?.current ?? {};
  const temperatureC: number = Number(current.temperature_2m);
  const windKph: number | null = current.wind_speed_10m == null ? null : Number(current.wind_speed_10m);
  const code: number | null = current.weather_code == null ? null : Number(current.weather_code);

  const kind = weatherKindFromOpenMeteoCode(code);
  const meta = WEATHER_KIND_META[kind];

  return {
    temperatureC,
    windKph: Number.isFinite(windKph ?? NaN) ? windKph : null,
    condition: meta.label,
    kind,
    updatedAt: new Date().toISOString(),
  };
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        setError('Weather not available on web');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setError('Location permission denied');
        setWeather(null);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = loc.coords;
      const data = await fetchOpenMeteoCurrent(latitude, longitude);
      setWeather(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load weather');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => {
      void refresh();
    }, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [refresh]);

  return { weather, loading, error, refresh };
}

