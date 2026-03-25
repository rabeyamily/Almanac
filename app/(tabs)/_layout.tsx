import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';
import { VintageText } from '@/components/ui';

interface TabIconProps { symbol: string; focused: boolean; }

function TabIcon({ symbol, focused }: TabIconProps) {
  const color = focused ? Theme.colors.ink : Theme.colors.muted;
  return (
    <View style={styles.tab}>
      <VintageText variant="mono" size="lg" color={color} align="center">
        {symbol}
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
        tabBarShowLabel: true,
        tabBarItemStyle: styles.item,
        tabBarLabelStyle: styles.nativeLabelSlot,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon symbol="⌂" focused={focused} />,
          tabBarLabel: ({ focused }) => (
            <VintageText variant="mono" size="xs" color={focused ? Theme.colors.ink : Theme.colors.muted} align="center" style={[styles.tabLabel, focused && styles.tabLabelActive]}>
              HOME
            </VintageText>
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon symbol="☑" focused={focused} />,
          tabBarLabel: ({ focused }) => (
            <VintageText variant="mono" size="xs" color={focused ? Theme.colors.ink : Theme.colors.muted} align="center" style={[styles.tabLabel, focused && styles.tabLabelActive]}>
              TASKS
            </VintageText>
          ),
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon symbol="◷" focused={focused} />,
          tabBarLabel: ({ focused }) => (
            <VintageText variant="mono" size="xs" color={focused ? Theme.colors.ink : Theme.colors.muted} align="center" style={[styles.tabLabel, focused && styles.tabLabelActive]}>
              TIMER
            </VintageText>
          ),
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon symbol="◈" focused={focused} />,
          tabBarLabel: ({ focused }) => (
            <VintageText variant="mono" size="xs" color={focused ? Theme.colors.ink : Theme.colors.muted} align="center" style={[styles.tabLabel, focused && styles.tabLabelActive]}>
              MOOD
            </VintageText>
          ),
        }}
      />
      <Tabs.Screen
        name="tracker"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon symbol="▦" focused={focused} />,
          tabBarLabel: ({ focused }) => (
            <VintageText variant="mono" size="xs" color={focused ? Theme.colors.ink : Theme.colors.muted} align="center" style={[styles.tabLabel, focused && styles.tabLabelActive]}>
              TRACKER
            </VintageText>
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
    height: 82,
    paddingBottom: 8,
    paddingTop: 4,
  },
  item: {
    paddingTop: 2,
  },
  nativeLabelSlot: {
    // Prevent native label slot from reserving tiny height that clips custom text.
    fontSize: 1,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabLabel: {
    letterSpacing: 1,
    marginTop: 0,
    minWidth: 48,
  },
  tabLabelActive: {
    textDecorationLine: 'underline',
  },
});
