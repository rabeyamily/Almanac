import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { VintageText } from '@/components/ui';
import { RichTextRenderer } from './RichTextRenderer';
import { Theme } from '@/constants/theme';
import { TaskWithStatus } from '@/lib/types';

interface TaskCardProps {
  task: TaskWithStatus;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onPressDrag?: () => void;
  onEdit?: (task: TaskWithStatus) => void;
}

export function TaskCard({ task, onToggle, onDelete, onPressDrag, onEdit }: TaskCardProps) {
  const handleToggle = () => onToggle(task.id, !task.is_completed);

  const hasRichText = task.rich_text_name && task.rich_text_name.length > 0;

  return (
    <View style={[styles.card, task.is_completed && styles.cardCompleted, task.highlighted && styles.cardHighlighted]}>
      {/* DONE stamp overlay */}
      {task.is_completed ? (
        <View style={styles.stampOverlay} pointerEvents="none">
          <View style={styles.stamp}>
            <VintageText variant="pixel" size="sm" color={Theme.colors.green} style={styles.stampText}>
              DONE
            </VintageText>
          </View>
        </View>
      ) : null}

      {task.highlighted ? <View style={styles.highlightStripe} /> : null}

      {/* Drag handle */}
      <TouchableOpacity style={styles.dragHandle} onLongPress={onPressDrag} delayLongPress={100}>
        <VintageText variant="mono" size="xs" color={Theme.colors.muted}>⠿</VintageText>
      </TouchableOpacity>

      {/* Checkbox */}
      <TouchableOpacity style={styles.checkArea} onPress={handleToggle} activeOpacity={0.7}>
        <View style={[styles.checkbox, task.is_completed && styles.checkboxDone]}>
          {task.is_completed ? (
            <VintageText variant="mono" size="sm" color={Theme.colors.paper} align="center">
              ✓
            </VintageText>
          ) : null}
        </View>
      </TouchableOpacity>

      {/* Content (single-line lean row) */}
      <TouchableOpacity style={styles.content} onPress={handleToggle} onLongPress={() => onEdit?.(task)} activeOpacity={0.8}>
        <View style={styles.line}>
          <View style={styles.nameWrap}>
            {hasRichText ? (
              <RichTextRenderer segments={task.rich_text_name!} dimmed={task.is_completed} />
            ) : (
              <VintageText
                variant="mono"
                size="sm"
                color={task.is_completed ? Theme.colors.muted : Theme.colors.ink}
                numberOfLines={1}
              >
                {task.name}
              </VintageText>
            )}
          </View>
          <View style={styles.metaCompact}>
            <VintageText variant="mono" size="xs" color={Theme.colors.borderLight}>
              {task.repeat_schedule.toUpperCase()}
            </VintageText>
            {task.scheduled_time ? (
              <VintageText variant="mono" size="xs" color={Theme.colors.muted}>
                ◷ {task.scheduled_time}
              </VintageText>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(task.id)} activeOpacity={0.7}>
          <VintageText variant="mono" size="sm" color={Theme.colors.muted}>
            ×
          </VintageText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.borderLight,
    marginBottom: Theme.spacing.xs,
    backgroundColor: Theme.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 6,
    gap: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  cardCompleted: {
    opacity: 0.55,
    backgroundColor: Theme.colors.paperDeep,
  },
  cardHighlighted: {
    borderColor: Theme.colors.gold,
    borderWidth: Theme.borderWidth.normal,
  },
  highlightStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Theme.colors.gold,
  },
  stampOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  stamp: {
    borderWidth: 3,
    borderColor: Theme.colors.green,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 4,
    transform: [{ rotate: '-12deg' }],
    opacity: 0.45,
  },
  stampText: {
    letterSpacing: 6,
  },
  dragHandle: {
    paddingHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 11,
  },
  checkArea: {
    padding: 0,
    zIndex: 11,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.paper,
  },
  checkboxDone: {
    backgroundColor: Theme.colors.green,
    borderColor: Theme.colors.greenDark,
  },
  content: {
    flex: 1,
    zIndex: 11,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nameWrap: {
    flex: 1,
  },
  metaCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actions: {
    alignItems: 'center',
    gap: 0,
    zIndex: 11,
  },
  actionBtn: {
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
});
