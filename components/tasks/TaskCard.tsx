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
  onToggleHighlight?: (id: string, highlighted: boolean) => void;
}

export function TaskCard({ task, onToggle, onDelete, onToggleHighlight }: TaskCardProps) {
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

      {/* Highlight indicator */}
      {task.highlighted ? (
        <View style={styles.highlightStripe} />
      ) : null}

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

      {/* Content */}
      <TouchableOpacity style={styles.content} onPress={handleToggle} activeOpacity={0.8}>
        <View style={styles.nameRow}>
          {hasRichText ? (
            <RichTextRenderer segments={task.rich_text_name!} dimmed={task.is_completed} />
          ) : (
            <VintageText
              variant="mono"
              size="md"
              color={task.is_completed ? Theme.colors.muted : Theme.colors.ink}
            >
              {task.name}
            </VintageText>
          )}
        </View>

        {/* Tags row */}
        <View style={styles.tags}>
          {task.highlighted ? (
            <View style={styles.pinTag}>
              <VintageText variant="mono" size="xs" color={Theme.colors.gold}>★ PINNED</VintageText>
            </View>
          ) : null}
          {task.category ? (
            <View style={[styles.tag, { borderColor: task.category.color }]}>
              <VintageText variant="mono" size="xs" color={task.category.color}>
                ✦ {task.category.name.toUpperCase()}
              </VintageText>
            </View>
          ) : null}
          {task.subcategory ? (
            <View style={[styles.tag, { borderColor: task.subcategory.color ?? task.category?.color ?? Theme.colors.border }]}>
              <VintageText variant="mono" size="xs" color={task.subcategory.color ?? task.category?.color ?? Theme.colors.muted}>
                ◈ {task.subcategory.name.toUpperCase()}
              </VintageText>
            </View>
          ) : null}
          {task.scheduled_time ? (
            <VintageText variant="mono" size="xs" color={Theme.colors.muted}>
              ◷ {task.scheduled_time}
            </VintageText>
          ) : null}
          <VintageText variant="mono" size="xs" color={Theme.colors.borderLight}>
            {task.repeat_schedule.toUpperCase()}
          </VintageText>
        </View>
      </TouchableOpacity>

      {/* Action buttons */}
      <View style={styles.actions}>
        {onToggleHighlight ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onToggleHighlight(task.id, !task.highlighted)}
            activeOpacity={0.7}
          >
            <VintageText variant="mono" size="md" color={task.highlighted ? Theme.colors.gold : Theme.colors.borderLight}>
              ★
            </VintageText>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(task.id)} activeOpacity={0.7}>
          <VintageText variant="mono" size="md" color={Theme.colors.muted}>
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
    marginBottom: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.sm,
    gap: Theme.spacing.sm,
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
  checkArea: {
    padding: 2,
    zIndex: 11,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: Theme.borderWidth.normal,
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
  nameRow: {
    marginBottom: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.xs,
    alignItems: 'center',
  },
  tag: {
    borderWidth: 1,
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: 1,
  },
  pinTag: {
    borderWidth: 1,
    borderColor: Theme.colors.gold,
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: 1,
    backgroundColor: Theme.colors.goldLight + '30',
  },
  actions: {
    alignItems: 'center',
    gap: 2,
    zIndex: 11,
  },
  actionBtn: {
    padding: Theme.spacing.xs,
  },
});
