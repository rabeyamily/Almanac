import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { VintageText } from '@/components/ui';
import { Theme } from '@/constants/theme';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  color: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'TASKS', icon: '☑', route: '/(tabs)/tasks', color: Theme.colors.green },
  { label: 'TIMER', icon: '◷', route: '/(tabs)/timer', color: Theme.colors.gold },
  { label: 'MOOD', icon: '◈', route: '/(tabs)/mood', color: Theme.colors.red },
  { label: 'CATS', icon: '▦', route: '/categories', color: Theme.colors.inkFaint },
];

export function QuickNav() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <VintageText variant="pixel" size="xs" color={Theme.colors.inkFaint} style={styles.heading}>
        QUICK ACCESS
      </VintageText>
      <View style={styles.grid}>
        {NAV_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[styles.tile, { borderColor: item.color }]}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <VintageText
              variant="mono"
              size="xxl"
              color={item.color}
              align="center"
              style={styles.icon}
            >
              {item.icon}
            </VintageText>
            <VintageText variant="pixel" size="xs" color={item.color} align="center">
              {item.label}
            </VintageText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Theme.spacing.md,
  },
  heading: {
    letterSpacing: 2,
    marginBottom: Theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  tile: {
    flex: 1,
    minWidth: '44%',
    borderWidth: Theme.borderWidth.normal,
    borderRadius: Theme.borderRadius.none,
    padding: Theme.spacing.md,
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
  },
  icon: {
    marginBottom: Theme.spacing.xs,
  },
});
