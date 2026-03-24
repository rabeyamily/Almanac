import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { VintageText, Divider } from '@/components/ui';
import { Theme } from '@/constants/theme';
import { TimedSession } from '@/lib/types';
import { formatShortDate, formatDurationHMS } from '@/lib/dateUtils';

interface SessionHistoryProps {
  sessions: TimedSession[];
  onDelete: (id: string) => void;
}

export function SessionHistory({ sessions, onDelete }: SessionHistoryProps) {
  if (sessions.length === 0) {
    return (
      <VintageText variant="mono" size="sm" color={Theme.colors.muted} align="center" style={styles.empty}>
        NO SESSIONS LOGGED YET
      </VintageText>
    );
  }

  return (
    <View style={styles.container}>
      <VintageText variant="pixel" size="xs" color={Theme.colors.inkFaint} style={styles.heading}>
        SESSION LOG
      </VintageText>
      <Divider marginVertical={Theme.spacing.sm} />
      {sessions.map((session, idx) => (
        <View key={session.id}>
          <View style={styles.row}>
            <View style={styles.indexCol}>
              <VintageText variant="mono" size="xs" color={Theme.colors.muted}>
                {String(idx + 1).padStart(2, '0')}.
              </VintageText>
            </View>
            <View style={styles.info}>
              <VintageText variant="mono" size="sm" color={Theme.colors.ink} style={styles.name}>
                {session.name}
              </VintageText>
              <View style={styles.metaRow}>
                <VintageText variant="mono" size="xs" color={Theme.colors.muted}>
                  {formatShortDate(new Date(session.started_at))}
                </VintageText>
                <VintageText variant="mono" size="xs" color={Theme.colors.gold}>
                  ◷ {formatDurationHMS(session.completed_seconds ?? session.duration_seconds)}
                </VintageText>
                <VintageText variant="mono" size="xs" color={Theme.colors.borderLight}>
                  {session.session_type === 'preset' ? 'PRESET' : 'SIMPLE'}
                </VintageText>
                {session.is_completed ? (
                  <VintageText variant="mono" size="xs" color={Theme.colors.green}>✓ COMPLETE</VintageText>
                ) : session.ended_at ? (
                  <VintageText variant="mono" size="xs" color={Theme.colors.red}>■ STOPPED</VintageText>
                ) : null}
              </View>
            </View>
            <TouchableOpacity onPress={() => onDelete(session.id)} style={styles.deleteBtn}>
              <VintageText variant="mono" size="md" color={Theme.colors.muted}>
                ×
              </VintageText>
            </TouchableOpacity>
          </View>
          {idx < sessions.length - 1 && <Divider marginVertical={4} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Theme.spacing.md,
  },
  empty: {
    marginTop: Theme.spacing.xl,
    letterSpacing: 2,
  },
  heading: {
    letterSpacing: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  indexCol: {
    width: 28,
  },
  info: {
    flex: 1,
  },
  name: {
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    flexWrap: 'wrap',
  },
  deleteBtn: {
    padding: Theme.spacing.xs,
  },
});
