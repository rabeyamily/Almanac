import React from 'react';
import { ScrollView, View, StyleSheet, ViewProps, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';

interface ScreenLayoutProps extends ViewProps {
  scrollable?: boolean;
  padded?: boolean;
}

export function ScreenLayout({
  children,
  scrollable = true,
  padded = true,
  style,
  ...props
}: ScreenLayoutProps) {
  const content = (
    <View style={[styles.inner, padded && styles.padded, style]} {...props}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Theme.colors.background} />
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  padded: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
});
