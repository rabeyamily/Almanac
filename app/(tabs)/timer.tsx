import React, { useState, useRef } from 'react';
import { View, StyleSheet, TextInput, ScrollView } from 'react-native';
import { ScreenLayout, VintageText, Divider, VintageInput } from '@/components/ui';
import { CountdownTimer } from '@/components/timer/CountdownTimer';
import { SessionHistory } from '@/components/timer/SessionHistory';
import { useSessions } from '@/hooks/useSessions';
import { Theme } from '@/constants/theme';

const PRESET_DURATIONS = [
  { label: '5 MIN', seconds: 300 },
  { label: '15 MIN', seconds: 900 },
  { label: '25 MIN', seconds: 1500 },
  { label: '45 MIN', seconds: 2700 },
  { label: '60 MIN', seconds: 3600 },
];

import { TouchableOpacity } from 'react-native';

export default function TimerScreen() {
  const { sessions, createSession, completeSession, deleteSession } = useSessions();
  const [sessionName, setSessionName] = useState('DEEP FOCUS');
  const [duration, setDuration] = useState(1500); // 25 min default
  const [customMinutes, setCustomMinutes] = useState('');
  const activeSessionIdRef = useRef<string | null>(null);

  const handleTimerComplete = async () => {
    if (activeSessionIdRef.current) {
      await completeSession(activeSessionIdRef.current);
      activeSessionIdRef.current = null;
    }
  };

  const handleStart = async () => {
    const session = await createSession(sessionName, duration);
    if (session) {
      activeSessionIdRef.current = session.id;
    }
  };

  const applyCustomDuration = () => {
    const mins = parseInt(customMinutes, 10);
    if (!isNaN(mins) && mins > 0) {
      setDuration(mins * 60);
    }
  };

  return (
    <ScreenLayout>
      <VintageText variant="pixel" size="sm" color={Theme.colors.ink} style={styles.heading}>
        TIMED SESSION
      </VintageText>
      <Divider marginVertical={Theme.spacing.sm} />

      {/* Session name input */}
      <VintageInput
        label="Session Name"
        value={sessionName}
        onChangeText={setSessionName}
        placeholder="e.g. Deep Focus..."
      />

      {/* Duration presets */}
      <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.label}>
        DURATION
      </VintageText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
        {PRESET_DURATIONS.map(p => (
          <TouchableOpacity
            key={p.seconds}
            style={[styles.presetChip, duration === p.seconds && styles.presetChipActive]}
            onPress={() => { setDuration(p.seconds); setCustomMinutes(''); }}
          >
            <VintageText
              variant="mono"
              size="xs"
              color={duration === p.seconds ? Theme.colors.paper : Theme.colors.ink}
            >
              {p.label}
            </VintageText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Custom duration */}
      <View style={styles.customRow}>
        <VintageInput
          label="Custom (min)"
          value={customMinutes}
          onChangeText={setCustomMinutes}
          placeholder="e.g. 37"
          keyboardType="numeric"
          style={styles.customInput}
          onSubmitEditing={applyCustomDuration}
        />
        <TouchableOpacity style={styles.applyBtn} onPress={applyCustomDuration}>
          <VintageText variant="mono" size="sm" color={Theme.colors.green}>SET →</VintageText>
        </TouchableOpacity>
      </View>

      <Divider marginVertical={Theme.spacing.sm} />

      {/* The main timer widget */}
      <CountdownTimer
        sessionName={sessionName}
        durationSeconds={duration}
        onComplete={handleTimerComplete}
        onReset={() => { activeSessionIdRef.current = null; }}
      />

      <Divider marginVertical={Theme.spacing.lg} />

      {/* Session history */}
      <SessionHistory sessions={sessions} onDelete={deleteSession} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  heading: {
    letterSpacing: 2,
  },
  label: {
    letterSpacing: 1,
    marginBottom: 4,
  },
  presetsRow: {
    marginBottom: Theme.spacing.md,
  },
  presetChip: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    marginRight: Theme.spacing.xs,
    backgroundColor: Theme.colors.paper,
  },
  presetChipActive: {
    backgroundColor: Theme.colors.ink,
    borderColor: Theme.colors.ink,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Theme.spacing.sm,
  },
  customInput: {
    flex: 1,
  },
  applyBtn: {
    borderWidth: 1,
    borderColor: Theme.colors.green,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
});
