import React, { useMemo, useState, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { VintageButton, VintageText, Divider } from '@/components/ui';
import { Theme } from '@/constants/theme';
import { Colors } from '@/constants/colors';
import { HmsInput, hmsToSeconds, secondsToHms } from './HmsInput';
import { TimerPreset } from '@/lib/types';
import { formatDurationHMS } from '@/lib/dateUtils';

interface DraftInterval {
  id: string;
  label: string;
  duration_seconds: number;
  color: string;
}

interface PresetBuilderModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (input: {
    name: string;
    repeatCount: number;
    isInfinite: boolean;
    intervals: Array<{ label: string; duration_seconds: number; color: string }>;
  }) => Promise<void>;
  editingPreset?: TimerPreset | null;
}

export function PresetBuilderModal({ visible, onClose, onSave, editingPreset }: PresetBuilderModalProps) {
  const [name, setName] = useState('');
  const [repeatCount, setRepeatCount] = useState('1');
  const [isInfinite, setIsInfinite] = useState(false);
  const [intervals, setIntervals] = useState<DraftInterval[]>([]);
  const [label, setLabel] = useState('WORK');
  const [hh, setHh] = useState('00');
  const [mm, setMm] = useState('02');
  const [ss, setSs] = useState('00');
  const [color, setColor] = useState<string>(Colors.categoryColors[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingPreset) {
      setName('');
      setRepeatCount('1');
      setIsInfinite(false);
      setIntervals([]);
      return;
    }
    setName(editingPreset.name);
    setRepeatCount(String(editingPreset.repeat_count));
    setIsInfinite(editingPreset.is_infinite);
    setIntervals(
      editingPreset.intervals.map(it => ({
        id: it.id,
        label: it.label,
        duration_seconds: it.duration_seconds,
        color: it.color,
      }))
    );
  }, [editingPreset?.id, visible]);

  const totalSeconds = useMemo(
    () => intervals.reduce((acc, it) => acc + it.duration_seconds, 0),
    [intervals]
  );

  const addInterval = () => {
    const duration = hmsToSeconds(hh, mm, ss);
    if (!label.trim() || duration <= 0) return;
    setIntervals(prev => [
      ...prev,
      { id: `tmp-${Date.now()}-${Math.random()}`, label: label.trim(), duration_seconds: duration, color },
    ]);
    setLabel('WORK');
    setHh('00'); setMm('00'); setSs('30');
  };

  const renderInterval = ({ item, drag, getIndex }: RenderItemParams<DraftInterval>) => (
    <TouchableOpacity onLongPress={drag} delayLongPress={120} activeOpacity={0.9} style={[styles.intervalRow, { borderColor: item.color }]}>
      <VintageText variant="mono" size="xs" color={Theme.colors.muted}>⠿</VintageText>
      <VintageText variant="mono" size="xs" color={Theme.colors.muted}>{String((getIndex?.() ?? 0) + 1).padStart(2, '0')}</VintageText>
      <View style={[styles.intervalColor, { backgroundColor: item.color }]} />
      <VintageText variant="mono" size="sm" color={Theme.colors.ink} style={styles.intervalLabel}>
        {item.label.toUpperCase()}
      </VintageText>
      <VintageText variant="mono" size="xs" color={Theme.colors.muted}>
        {formatDurationHMS(item.duration_seconds)}
      </VintageText>
      <TouchableOpacity onPress={() => setIntervals(prev => prev.filter(x => x.id !== item.id))}>
        <VintageText variant="mono" size="sm" color={Theme.colors.red}>×</VintageText>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <VintageText variant="pixel" size="xs" color={Theme.colors.ink}>
              {editingPreset ? 'EDIT PRESET' : '+ NEW PRESET'}
            </VintageText>
            <TouchableOpacity onPress={onClose}>
              <VintageText variant="mono" size="lg" color={Theme.colors.muted}>×</VintageText>
            </TouchableOpacity>
          </View>
          <Divider marginVertical={Theme.spacing.sm} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.label}>PRESET NAME</VintageText>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Morning Workout"
              placeholderTextColor={Theme.colors.inkFaint}
            />

            <View style={styles.repeatRow}>
              <View style={{ flex: 1 }}>
                <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.label}>REPEAT</VintageText>
                <TextInput
                  value={repeatCount}
                  onChangeText={t => setRepeatCount(t.replace(/[^\d]/g, '').slice(0, 3) || '1')}
                  style={styles.input}
                  keyboardType="number-pad"
                  editable={!isInfinite}
                />
              </View>
              <TouchableOpacity style={[styles.infinityBtn, isInfinite && styles.infinityBtnActive]} onPress={() => setIsInfinite(v => !v)}>
                <VintageText variant="mono" size="sm" color={isInfinite ? Theme.colors.paper : Theme.colors.ink}>∞</VintageText>
              </TouchableOpacity>
            </View>

            <Divider marginVertical={Theme.spacing.sm} />

            <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.label}>NEW INTERVAL</VintageText>
            <TextInput
              value={label}
              onChangeText={setLabel}
              style={styles.input}
              placeholder="WORK / REST / STRETCH..."
              placeholderTextColor={Theme.colors.inkFaint}
            />
            <HmsInput
              hours={hh}
              minutes={mm}
              seconds={ss}
              onChangeHours={setHh}
              onChangeMinutes={setMm}
              onChangeSeconds={setSs}
              label="DURATION"
            />
            <View style={styles.colorRow}>
              {Colors.categoryColors.slice(0, 6).map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>
            <VintageButton label="+ ADD INTERVAL" variant="ghost" size="sm" onPress={addInterval} />

            <Divider marginVertical={Theme.spacing.sm} />
            <VintageText variant="pixel" size="xs" color={Theme.colors.inkFaint} style={styles.sectionTitle}>
              SEQUENCE ({intervals.length})
            </VintageText>

            <DraggableFlatList
              data={intervals}
              keyExtractor={item => item.id}
              renderItem={renderInterval}
              onDragEnd={({ data }) => setIntervals(data)}
              scrollEnabled={false}
            />

            <View style={styles.totalRow}>
              <VintageText variant="mono" size="xs" color={Theme.colors.muted}>TOTAL</VintageText>
              <VintageText variant="mono" size="xs" color={Theme.colors.gold}>
                {formatDurationHMS(totalSeconds)}
              </VintageText>
            </View>
          </ScrollView>

          <Divider marginVertical={Theme.spacing.sm} />
          <View style={styles.actions}>
            <VintageButton label="CANCEL" variant="ghost" size="sm" onPress={onClose} />
            <VintageButton
              label={saving ? 'SAVING...' : editingPreset ? 'UPDATE PRESET' : 'SAVE PRESET'}
              size="sm"
              disabled={saving || !name.trim() || intervals.length === 0}
              onPress={async () => {
                setSaving(true);
                await onSave({
                  name: name.trim(),
                  repeatCount: Math.max(1, Number(repeatCount || '1')),
                  isInfinite,
                  intervals: intervals.map(it => ({
                    label: it.label,
                    duration_seconds: it.duration_seconds,
                    color: it.color,
                  })),
                });
                setSaving(false);
                onClose();
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: Theme.colors.background,
    borderTopWidth: 2,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    marginBottom: 4,
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.paper,
    color: Theme.colors.ink,
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoSm,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
  },
  repeatRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Theme.spacing.sm,
  },
  infinityBtn: {
    width: 44,
    height: 38,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },
  infinityBtnActive: {
    backgroundColor: Theme.colors.ink,
    borderColor: Theme.colors.ink,
  },
  colorRow: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  colorDotActive: {
    borderWidth: 2,
    borderColor: Theme.colors.ink,
  },
  sectionTitle: {
    letterSpacing: 1,
    marginBottom: Theme.spacing.xs,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    borderWidth: 1,
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: Theme.spacing.xs,
    marginBottom: Theme.spacing.xs,
  },
  intervalColor: {
    width: 8,
    height: 20,
  },
  intervalLabel: {
    flex: 1,
  },
  totalRow: {
    marginTop: Theme.spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderStyle: 'dotted',
    borderColor: Theme.colors.borderLight,
    paddingTop: Theme.spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Theme.spacing.sm,
  },
});
