import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { VintageText, VintageBox } from '@/components/ui';
import { Theme } from '@/constants/theme';
import { formatDuration } from '@/lib/dateUtils';

type TimerState = 'idle' | 'running' | 'paused' | 'finished';

interface CountdownTimerProps {
  sessionName: string;
  durationSeconds: number;
  onComplete: () => void;
  onReset: () => void;
}

export function CountdownTimer({ sessionName, durationSeconds, onComplete, onReset }: CountdownTimerProps) {
  const [state, setState] = useState<TimerState>('idle');
  const [remaining, setRemaining] = useState(durationSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blinkOpacity = useSharedValue(1);

  // Blinking colon animation when running
  const blinkStyle = useAnimatedStyle(() => ({ opacity: blinkOpacity.value }));

  const start = useCallback(() => {
    setState('running');
    blinkOpacity.value = withRepeat(
      withSequence(withTiming(0.2, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1
    );
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setState('finished');
          cancelAnimation(blinkOpacity);
          blinkOpacity.value = 1;
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [blinkOpacity, onComplete]);

  const pause = useCallback(() => {
    clearInterval(intervalRef.current!);
    setState('paused');
    cancelAnimation(blinkOpacity);
    blinkOpacity.value = 0.5;
  }, [blinkOpacity]);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current!);
    cancelAnimation(blinkOpacity);
    blinkOpacity.value = 1;
    setState('idle');
    setRemaining(durationSeconds);
    onReset();
  }, [durationSeconds, blinkOpacity, onReset]);

  // Reset when duration changes
  useEffect(() => {
    reset();
  }, [durationSeconds]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const percentage = durationSeconds > 0 ? ((durationSeconds - remaining) / durationSeconds) * 100 : 0;
  const BAR_LENGTH = 24;
  const filled = Math.round((percentage / 100) * BAR_LENGTH);
  const progressBar = '▓'.repeat(filled) + '░'.repeat(BAR_LENGTH - filled);

  return (
    <VintageBox borderStyle="double" style={styles.container}>
      {/* Session name */}
      <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} align="center" style={styles.sessionName}>
        {sessionName.toUpperCase() || 'SESSION'}
      </VintageText>

      {/* Big timer display */}
      <Animated.View style={[styles.timerDisplay, blinkStyle]}>
        <VintageText variant="pixel" size="xl" color={
          state === 'finished' ? Theme.colors.green :
          remaining < 60 ? Theme.colors.red : Theme.colors.ink
        } align="center" style={styles.timerText}>
          {formatDuration(remaining)}
        </VintageText>
      </Animated.View>

      {/* Progress bar */}
      <VintageText variant="mono" size="xs" color={Theme.colors.gold} align="center" style={styles.progressBar}>
        {progressBar}
      </VintageText>
      <VintageText variant="mono" size="xs" color={Theme.colors.muted} align="center">
        {Math.round(percentage)}% ELAPSED
      </VintageText>

      {/* State message */}
      {state === 'finished' && (
        <VintageText variant="pixel" size="xs" color={Theme.colors.green} align="center" style={styles.doneMsg}>
          ★ SESSION COMPLETE ★
        </VintageText>
      )}
      {state === 'paused' && (
        <VintageText variant="mono" size="xs" color={Theme.colors.gold} align="center" style={styles.pausedMsg}>
          -- PAUSED --
        </VintageText>
      )}

      {/* Mechanical control buttons */}
      <View style={styles.controls}>
        {(state === 'idle' || state === 'paused') && (
          <ControlButton label="▶ START" onPress={start} color={Theme.colors.green} />
        )}
        {state === 'running' && (
          <ControlButton label="⏸ PAUSE" onPress={pause} color={Theme.colors.gold} />
        )}
        <ControlButton label="↺ RESET" onPress={reset} color={Theme.colors.muted} />
      </View>
    </VintageBox>
  );
}

function ControlButton({
  label,
  onPress,
  color,
}: { label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity style={[styles.ctrlBtn, { borderColor: color }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.ctrlShadow, { backgroundColor: color }]} />
      <VintageText variant="pixel" size="xs" color={color} align="center">
        {label}
      </VintageText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  sessionName: {
    letterSpacing: 3,
    marginBottom: Theme.spacing.lg,
  },
  timerDisplay: {
    marginBottom: Theme.spacing.md,
  },
  timerText: {
    letterSpacing: 8,
  },
  progressBar: {
    letterSpacing: 2,
    marginTop: Theme.spacing.md,
    marginBottom: 4,
  },
  doneMsg: {
    letterSpacing: 2,
    marginTop: Theme.spacing.md,
  },
  pausedMsg: {
    letterSpacing: 4,
    marginTop: Theme.spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.xl,
  },
  ctrlBtn: {
    borderWidth: Theme.borderWidth.normal,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    position: 'relative',
  },
  ctrlShadow: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    left: 3,
    top: 3,
    opacity: 0.3,
    zIndex: -1,
  },
});
