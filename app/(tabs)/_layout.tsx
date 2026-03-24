import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';
import { VintageText } from '@/components/ui';

interface TabIconProps {
  symbol: string;
  label: string;
  focused: boolean;
}

function TabIcon({ symbol, label, focused }: TabIconProps) {
  const color = focused ? Theme.colors.ink : Theme.colors.muted;
  return (
    <View style={[styles.tab, focused && styles.tabActive]}>
      <VintageText variant="mono" size="lg" color={color} align="center">
        {symbol}
      </VintageText>
      <VintageText variant="mono" size="xs" color={color} align="center" style={styles.tabLabel}>
        {label}
      </VintageText>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="⌂" label="HOME" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="☑" label="TASKS" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="◷" label="TIMER" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="◈" label="MOOD" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Theme.colors.paperDark,
    borderTopWidth: Theme.borderWidth.thick,
    borderTopColor: Theme.colors.border,
    height: 72,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Theme.colors.ink,
  },
  tabLabel: {
    letterSpacing: 1,
    marginTop: 2,
  },
});
