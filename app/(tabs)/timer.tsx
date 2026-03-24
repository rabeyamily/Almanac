import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Audio } from 'expo-av';
import { ScreenLayout, VintageText, Divider, VintageInput, VintageButton, VintageBox } from '@/components/ui';
import { SessionHistory } from '@/components/timer/SessionHistory';
import { HmsInput, hmsToSeconds, secondsToHms } from '@/components/timer/HmsInput';
import { PresetBuilderModal } from '@/components/timer/PresetBuilderModal';
import { useSessions } from '@/hooks/useSessions';
import { Theme } from '@/constants/theme';
import { TimerPreset } from '@/lib/types';
import { formatDurationHMS } from '@/lib/dateUtils';

const PRESET_DURATIONS = [
  { label: '05:00:00', seconds: 5 * 60 },
  { label: '00:15:00', seconds: 15 * 60 },
  { label: '00:25:00', seconds: 25 * 60 },
  { label: '00:45:00', seconds: 45 * 60 },
  { label: '01:00:00', seconds: 60 * 60 },
];

const TRANSITION_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';
const COMPLETE_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/medium_bell_ringing_near.ogg';

type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';
type TimerMode = 'simple' | 'preset';

interface PresetRuntime {
  preset: TimerPreset;
  intervalIndex: number;
  cycle: number;
  remainingInInterval: number;
  totalElapsed: number;
}

async function playSound(url: string) {
  try {
    const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true, volume: 0.8 });
    sound.setOnPlaybackStatusUpdate(status => {
      if (!status.isLoaded || !status.didJustFinish) return;
      sound.unloadAsync().catch(() => undefined);
    });
  } catch {
    // Ignore audio failures; timer should still work.
  }
}

function presetTotalSeconds(preset: TimerPreset): number {
  return preset.intervals.reduce((acc, i) => acc + i.duration_seconds, 0);
}

export default function TimerScreen() {
  const {
    sessions,
    presets,
    loading,
    error,
    createSessionStart,
    finishSession,
    deleteSession,
    createPreset,
    updatePreset,
    deletePreset,
    reorderPresets,
  } = useSessions();

  const [mode, setMode] = useState<TimerMode>('simple');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [sessionName, setSessionName] = useState('DEEP FOCUS');

  // Custom timer HH:MM:SS
  const [hh, setHh] = useState('00');
  const [mm, setMm] = useState('25');
  const [ss, setSs] = useState('00');
  const [simpleRemaining, setSimpleRemaining] = useState(25 * 60);
  const [simpleElapsed, setSimpleElapsed] = useState(0);

  // Presets
  const [presetData, setPresetData] = useState<TimerPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [presetRuntime, setPresetRuntime] = useState<PresetRuntime | null>(null);
  const [showPresetBuilder, setShowPresetBuilder] = useState(false);
  const [editingPreset, setEditingPreset] = useState<TimerPreset | null>(null);

  const activeSessionIdRef = useRef<string | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => setPresetData(presets), [presets]);

  const selectedPreset = useMemo(
    () => presetData.find(p => p.id === selectedPresetId) ?? null,
    [presetData, selectedPresetId]
  );

  const totalSimpleSeconds = useMemo(() => hmsToSeconds(hh, mm, ss), [hh, mm, ss]);

  const resetSimpleFromInputs = () => {
    const total = hmsToSeconds(hh, mm, ss);
    setSimpleRemaining(total);
    setSimpleElapsed(0);
  };

  useEffect(() => {
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, []);

  useEffect(() => {
    if (status !== 'running') {
      if (tickerRef.current) clearInterval(tickerRef.current);
      return;
    }

    tickerRef.current = setInterval(() => {
      if (mode === 'simple') {
        setSimpleRemaining(prev => {
          const next = prev - 1;
          if (next <= 0) {
            setSimpleElapsed(v => v + 1);
            setStatus('finished');
            void playSound(COMPLETE_SOUND_URL);
            return 0;
          }
          return next;
        });
        setSimpleElapsed(prev => prev + 1);
        return;
      }

      // preset mode
      let transitioned = false;
      let completedAll = false;
      setPresetRuntime(prev => {
        if (!prev) return prev;
        const afterTick = prev.remainingInInterval - 1;
        const totalElapsed = prev.totalElapsed + 1;
        if (afterTick > 0) {
          return { ...prev, remainingInInterval: afterTick, totalElapsed };
        }

        const nextIntervalIdx = prev.intervalIndex + 1;
        const currentCycle = prev.cycle;

        if (nextIntervalIdx < prev.preset.intervals.length) {
          transitioned = true;
          return {
            ...prev,
            intervalIndex: nextIntervalIdx,
            remainingInInterval: prev.preset.intervals[nextIntervalIdx].duration_seconds,
            totalElapsed,
          };
        }

        const canRepeat = prev.preset.is_infinite || currentCycle < prev.preset.repeat_count;
        if (canRepeat) {
          transitioned = true;
          return {
            ...prev,
            cycle: currentCycle + 1,
            intervalIndex: 0,
            remainingInInterval: prev.preset.intervals[0].duration_seconds,
            totalElapsed,
          };
        }

        completedAll = true;
        return {
          ...prev,
          remainingInInterval: 0,
          totalElapsed,
        };
      });

      if (transitioned) void playSound(TRANSITION_SOUND_URL);
      if (completedAll) {
        setStatus('finished');
        void playSound(COMPLETE_SOUND_URL);
      }
    }, 1000);

    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [status, mode]);

  const startSimple = async () => {
    if (totalSimpleSeconds <= 0) return;
    if (status === 'paused' && mode === 'simple') {
      setStatus('running');
      return;
    }
    setMode('simple');
    const session = await createSessionStart({
      name: sessionName.trim() || 'CUSTOM TIMER',
      durationSeconds: totalSimpleSeconds,
      sessionType: 'simple',
      details: { hh, mm, ss },
    });
    if (session) {
      activeSessionIdRef.current = session.id;
      setSimpleRemaining(totalSimpleSeconds);
      setSimpleElapsed(0);
      setStatus('running');
    }
  };

  const loadPreset = (preset: TimerPreset) => {
    setSelectedPresetId(preset.id);
    setSessionName(preset.name);
    setMode('preset');
    setStatus('idle');
    setPresetRuntime({
      preset,
      intervalIndex: 0,
      cycle: 1,
      remainingInInterval: preset.intervals[0]?.duration_seconds ?? 0,
      totalElapsed: 0,
    });
  };

  const startPreset = async () => {
    if (!selectedPreset || selectedPreset.intervals.length === 0) return;
    if (status === 'paused' && mode === 'preset') {
      setStatus('running');
      return;
    }
    setMode('preset');
    const session = await createSessionStart({
      name: selectedPreset.name,
      durationSeconds: presetTotalSeconds(selectedPreset) * Math.max(1, selectedPreset.repeat_count),
      sessionType: 'preset',
      presetId: selectedPreset.id,
      details: { repeat_count: selectedPreset.repeat_count, is_infinite: selectedPreset.is_infinite },
    });
    if (session) {
      activeSessionIdRef.current = session.id;
      setPresetRuntime({
        preset: selectedPreset,
        intervalIndex: 0,
        cycle: 1,
        remainingInInterval: selectedPreset.intervals[0].duration_seconds,
        totalElapsed: 0,
      });
      setStatus('running');
    }
  };

  const pause = () => setStatus('paused');

  const stopAndLog = async () => {
    const id = activeSessionIdRef.current;
    if (id) {
      const completedSeconds = mode === 'simple' ? simpleElapsed : (presetRuntime?.totalElapsed ?? 0);
      await finishSession(id, {
        completedSeconds,
        isCompleted: false,
        isStoppedManually: true,
        details: mode === 'preset' ? { preset_id: selectedPresetId } : { hh, mm, ss },
      });
      activeSessionIdRef.current = null;
    }
    setStatus('idle');
  };

  const logFinishedSession = async () => {
    const id = activeSessionIdRef.current;
    if (id) {
      const completedSeconds = mode === 'simple' ? totalSimpleSeconds : (presetRuntime?.totalElapsed ?? 0);
      await finishSession(id, {
        completedSeconds,
        isCompleted: true,
        isStoppedManually: false,
        details: mode === 'preset' ? { preset_id: selectedPresetId } : { hh, mm, ss },
      });
      activeSessionIdRef.current = null;
    }
    setStatus('idle');
  };

  const skipInterval = () => {
    if (mode !== 'preset' || !presetRuntime) return;
    const nextIntervalIdx = presetRuntime.intervalIndex + 1;
    if (nextIntervalIdx < presetRuntime.preset.intervals.length) {
      setPresetRuntime({
        ...presetRuntime,
        intervalIndex: nextIntervalIdx,
        remainingInInterval: presetRuntime.preset.intervals[nextIntervalIdx].duration_seconds,
      });
      void playSound(TRANSITION_SOUND_URL);
      return;
    }
    const canRepeat = presetRuntime.preset.is_infinite || presetRuntime.cycle < presetRuntime.preset.repeat_count;
    if (canRepeat) {
      setPresetRuntime({
        ...presetRuntime,
        cycle: presetRuntime.cycle + 1,
        intervalIndex: 0,
        remainingInInterval: presetRuntime.preset.intervals[0].duration_seconds,
      });
      void playSound(TRANSITION_SOUND_URL);
      return;
    }
    setStatus('finished');
    void playSound(COMPLETE_SOUND_URL);
  };

  const activeInterval = presetRuntime?.preset.intervals[presetRuntime.intervalIndex] ?? null;
  const nextInterval = presetRuntime
    ? presetRuntime.preset.intervals[presetRuntime.intervalIndex + 1] ?? null
    : null;

  return (
    <ScreenLayout>
      <VintageText variant="pixel" size="sm" color={Theme.colors.ink} style={styles.heading}>
        TIMED SESSION
      </VintageText>
      <Divider marginVertical={Theme.spacing.sm} />

      <VintageInput
        label="Session Name"
        value={sessionName}
        onChangeText={setSessionName}
        placeholder="e.g. Deep Focus..."
      />

      <HmsInput
        label="CUSTOM DURATION (HH:MM:SS)"
        hours={hh}
        minutes={mm}
        seconds={ss}
        onChangeHours={setHh}
        onChangeMinutes={setMm}
        onChangeSeconds={setSs}
      />
      <View style={styles.inlineActions}>
        <VintageButton label="SET CUSTOM" size="sm" variant="ghost" onPress={resetSimpleFromInputs} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
        {PRESET_DURATIONS.map(p => (
          <TouchableOpacity
            key={p.seconds}
            style={styles.quickChip}
            onPress={() => {
              const hms = secondsToHms(p.seconds);
              setHh(hms.h); setMm(hms.m); setSs(hms.s);
              setSimpleRemaining(p.seconds);
              setSimpleElapsed(0);
            }}
          >
            <VintageText variant="mono" size="xs" color={Theme.colors.ink}>{p.label}</VintageText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Divider marginVertical={Theme.spacing.sm} />

      <VintageBox borderStyle="double" style={styles.runnerBox}>
        {mode === 'preset' && activeInterval ? (
          <>
            <VintageText variant="pixel" size="sm" color={activeInterval.color} align="center" style={styles.intervalLabel}>
              {activeInterval.label.toUpperCase()}
            </VintageText>
            <VintageText variant="pixel" size="xl" color={Theme.colors.ink} align="center" style={styles.timerText}>
              {formatDurationHMS(presetRuntime?.remainingInInterval ?? 0)}
            </VintageText>
            <View style={styles.segmentTrack}>
              {presetRuntime?.preset.intervals.map((it, idx) => (
                <View
                  key={`${it.id}-${idx}`}
                  style={[
                    styles.segmentItem,
                    { backgroundColor: it.color },
                    idx === presetRuntime.intervalIndex && styles.segmentItemActive,
                  ]}
                />
              ))}
            </View>
            <VintageText variant="mono" size="xs" color={Theme.colors.muted} align="center">
              {nextInterval
                ? `UP NEXT: ${nextInterval.label.toUpperCase()} — ${formatDurationHMS(nextInterval.duration_seconds)}`
                : 'UP NEXT: COMPLETE'}
            </VintageText>
            <VintageText variant="mono" size="xs" color={Theme.colors.gold} align="center" style={styles.cycleText}>
              {presetRuntime?.preset.is_infinite
                ? `CYCLE ${presetRuntime?.cycle} / ∞`
                : `CYCLE ${presetRuntime?.cycle} / ${presetRuntime?.preset.repeat_count}`}
            </VintageText>
          </>
        ) : (
          <>
            <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} align="center" style={styles.intervalLabel}>
              CUSTOM TIMER
            </VintageText>
            <VintageText variant="pixel" size="xl" color={Theme.colors.ink} align="center" style={styles.timerText}>
              {formatDurationHMS(simpleRemaining)}
            </VintageText>
          </>
        )}

        <View style={styles.runnerControls}>
          {status !== 'running' ? (
            <VintageButton
              label={status === 'paused' ? 'RESUME' : 'START'}
              size="sm"
              onPress={async () => {
                if (mode === 'preset') await startPreset();
                else await startSimple();
              }}
            />
          ) : (
            <VintageButton label="PAUSE" size="sm" variant="ghost" onPress={pause} />
          )}
          {mode === 'preset' ? (
            <VintageButton label="SKIP" size="sm" variant="ghost" onPress={skipInterval} />
          ) : null}
          {(status === 'running' || status === 'paused') ? (
            <VintageButton label="STOP" size="sm" variant="danger" onPress={stopAndLog} />
          ) : null}
        </View>

        {status === 'finished' ? (
          <View style={styles.finishedBox}>
            <VintageText variant="pixel" size="xs" color={Theme.colors.green} align="center">
              ★ SEQUENCE COMPLETE ★
            </VintageText>
            <VintageText variant="mono" size="xs" color={Theme.colors.muted} align="center" style={styles.finishedMeta}>
              TOTAL ELAPSED: {formatDurationHMS(mode === 'simple' ? totalSimpleSeconds : (presetRuntime?.totalElapsed ?? 0))}
            </VintageText>
            <VintageButton label="LOG SESSION" size="sm" onPress={logFinishedSession} />
          </View>
        ) : null}
      </VintageBox>

      <Divider marginVertical={Theme.spacing.md} />

      <View style={styles.presetHeader}>
        <VintageText variant="pixel" size="xs" color={Theme.colors.inkFaint}>PRESETS</VintageText>
        <VintageButton
          label="+ NEW PRESET"
          size="sm"
          variant="ghost"
          onPress={() => {
            setEditingPreset(null);
            setShowPresetBuilder(true);
          }}
        />
      </View>

      <DraggableFlatList
        data={presetData}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        onDragEnd={async ({ data }) => {
          setPresetData(data);
          await reorderPresets(data.map(p => p.id));
        }}
        renderItem={({ item, drag }: RenderItemParams<TimerPreset>) => {
          const total = presetTotalSeconds(item);
          return (
            <TouchableOpacity
              style={[styles.presetRow, selectedPresetId === item.id && styles.presetRowActive]}
              onPress={() => loadPreset(item)}
              onLongPress={drag}
              delayLongPress={120}
              activeOpacity={0.8}
            >
              <VintageText variant="mono" size="xs" color={Theme.colors.muted}>⠿</VintageText>
              <View style={styles.presetInfo}>
                <VintageText variant="mono" size="sm" color={Theme.colors.ink}>{item.name.toUpperCase()}</VintageText>
                <VintageText variant="mono" size="xs" color={Theme.colors.muted}>
                  {formatDurationHMS(total)} · {item.intervals.length} intervals · repeat {item.is_infinite ? '∞' : item.repeat_count}
                </VintageText>
              </View>
              <TouchableOpacity onPress={() => { setEditingPreset(item); setShowPresetBuilder(true); }}>
                <VintageText variant="mono" size="sm" color={Theme.colors.muted}>✎</VintageText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deletePreset(item.id)} style={{ marginLeft: 8 }}>
                <VintageText variant="mono" size="sm" color={Theme.colors.red}>×</VintageText>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />

      {error ? (
        <VintageText variant="mono" size="xs" color={Theme.colors.red} style={styles.errorText}>
          {error.toUpperCase()}
        </VintageText>
      ) : null}

      <Divider marginVertical={Theme.spacing.lg} />
      <SessionHistory sessions={sessions} onDelete={deleteSession} />

      <PresetBuilderModal
        visible={showPresetBuilder}
        onClose={() => setShowPresetBuilder(false)}
        editingPreset={editingPreset}
        onSave={async input => {
          if (editingPreset) await updatePreset(editingPreset.id, input);
          else await createPreset(input);
        }}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  heading: {
    letterSpacing: 2,
  },
  inlineActions: {
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm,
  },
  presetsRow: {
    marginBottom: Theme.spacing.sm,
  },
  quickChip: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.paper,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    marginRight: Theme.spacing.xs,
  },
  runnerBox: {
    marginTop: Theme.spacing.sm,
    alignItems: 'stretch',
  },
  intervalLabel: {
    letterSpacing: 2,
    marginBottom: Theme.spacing.sm,
  },
  timerText: {
    letterSpacing: 6,
    marginBottom: Theme.spacing.sm,
  },
  segmentTrack: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: Theme.spacing.sm,
  },
  segmentItem: {
    flex: 1,
    height: 10,
    opacity: 0.45,
  },
  segmentItemActive: {
    opacity: 1,
    borderWidth: 1,
    borderColor: Theme.colors.ink,
  },
  cycleText: {
    marginTop: 4,
  },
  runnerControls: {
    marginTop: Theme.spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    justifyContent: 'center',
  },
  finishedBox: {
    marginTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
    borderStyle: 'dotted',
    paddingTop: Theme.spacing.sm,
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  finishedMeta: {
    letterSpacing: 1,
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    marginBottom: Theme.spacing.xs,
  },
  presetRowActive: {
    borderColor: Theme.colors.gold,
    borderWidth: 2,
  },
  presetInfo: {
    flex: 1,
    marginLeft: Theme.spacing.sm,
  },
  errorText: {
    marginTop: Theme.spacing.sm,
  },
});
