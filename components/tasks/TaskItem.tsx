import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { VintageText } from '@/components/ui';
import { Theme } from '@/constants/theme';
import { TaskWithStatus } from '@/lib/types';

interface TaskItemProps {
  task: TaskWithStatus;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const strikeWidth = useSharedValue(task.is_completed ? 1 : 0);

  const handleToggle = () => {
    const next = !task.is_completed;
    strikeWidth.value = withTiming(next ? 1 : 0, { duration: 300 });
    onToggle(task.id, next);
  };

  const strikeStyle = useAnimatedStyle(() => ({
    width: `${strikeWidth.value * 100}%`,
  }));

  return (
    <View style={[styles.row, task.is_completed && styles.rowCompleted]}>
      {/* Vintage stamp-style checkbox */}
      <TouchableOpacity style={styles.checkWrapper} onPress={handleToggle} activeOpacity={0.7}>
        <View style={[styles.checkbox, task.is_completed && styles.checkboxDone]}>
          {task.is_completed && (
            <VintageText variant="mono" size="md" color={Theme.colors.paper} align="center">
              ✕
            </VintageText>
          )}
        </View>
      </TouchableOpacity>

      {/* Task content */}
      <TouchableOpacity style={styles.content} onPress={handleToggle} activeOpacity={0.8}>
        <View style={styles.nameRow}>
          <VintageText
            variant="mono"
            size="md"
            color={task.is_completed ? Theme.colors.muted : Theme.colors.ink}
            style={styles.name}
          >
            {task.name}
          </VintageText>
          {/* Animated strike-through line */}
          <Animated.View style={[styles.strikeThrough, strikeStyle]} />
        </View>

        <View style={styles.meta}>
          {task.category && (
            <View style={[styles.categoryTag, { borderColor: task.category.color }]}>
              <VintageText variant="mono" size="xs" color={task.category.color}>
                {task.category.icon} {task.category.name.toUpperCase()}
              </VintageText>
            </View>
          )}
          {task.scheduled_time && (
            <VintageText variant="mono" size="xs" color={Theme.colors.muted}>
              ◷ {task.scheduled_time}
            </VintageText>
          )}
          <VintageText variant="mono" size="xs" color={Theme.colors.borderLight}>
            {task.repeat_schedule.toUpperCase()}
          </VintageText>
        </View>
      </TouchableOpacity>

      {/* Delete button */}
      <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(task.id)} activeOpacity={0.7}>
        <VintageText variant="mono" size="md" color={Theme.colors.muted}>
          ×
        </VintageText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.borderLight,
    borderRadius: Theme.borderRadius.none,
    marginBottom: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  rowCompleted: {
    opacity: 0.7,
    backgroundColor: Theme.colors.paperDeep,
  },
  checkWrapper: {
    padding: 2,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: Theme.borderWidth.normal,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.paper,
  },
  checkboxDone: {
    backgroundColor: Theme.colors.ink,
    borderColor: Theme.colors.ink,
  },
  content: {
    flex: 1,
  },
  nameRow: {
    position: 'relative',
    marginBottom: 4,
  },
  name: {
    flexShrink: 1,
  },
  strikeThrough: {
    position: 'absolute',
    height: 2,
    backgroundColor: Theme.colors.muted,
    top: '50%',
    left: 0,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.xs,
    alignItems: 'center',
  },
  categoryTag: {
    borderWidth: 1,
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: 2,
  },
  deleteBtn: {
    padding: Theme.spacing.xs,
  },
});
