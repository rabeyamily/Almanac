import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenLayout, VintageText, Divider, VintageButton } from '@/components/ui';
import { TaskItem } from '@/components/tasks/TaskItem';
import { AddTaskForm } from '@/components/tasks/AddTaskForm';
import { useTasks } from '@/hooks/useTasks';
import { useCategories } from '@/hooks/useCategories';
import { Theme } from '@/constants/theme';

export default function TasksScreen() {
  const { tasks, loading, toggleComplete, deleteTask, addTask } = useTasks();
  const { categories } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [filterCatId, setFilterCatId] = useState<string | null>(null);

  const filtered = filterCatId
    ? tasks.filter(t => t.category_id === filterCatId)
    : tasks;

  const completed = tasks.filter(t => t.is_completed).length;

  return (
    <ScreenLayout>
      {/* Header */}
      <View style={styles.header}>
        <VintageText variant="pixel" size="sm" color={Theme.colors.ink}>
          DAILY TASKS
        </VintageText>
        <VintageText variant="mono" size="xs" color={Theme.colors.muted}>
          {completed}/{tasks.length} DONE
        </VintageText>
      </View>

      <Divider marginVertical={Theme.spacing.sm} />

      {/* Category filter pills */}
      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, !filterCatId && styles.filterChipActive]}
            onPress={() => setFilterCatId(null)}
          >
            <VintageText variant="mono" size="xs" color={!filterCatId ? Theme.colors.paper : Theme.colors.ink}>
              ALL
            </VintageText>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.filterChip,
                { borderColor: cat.color },
                filterCatId === cat.id && { backgroundColor: cat.color },
              ]}
              onPress={() => setFilterCatId(filterCatId === cat.id ? null : cat.id)}
            >
              <VintageText
                variant="mono"
                size="xs"
                color={filterCatId === cat.id ? Theme.colors.paper : cat.color}
              >
                {cat.icon} {cat.name.toUpperCase()}
              </VintageText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Tasks list */}
      {loading ? (
        <VintageText variant="mono" size="sm" color={Theme.colors.muted} align="center" style={styles.empty}>
          LOADING...
        </VintageText>
      ) : filtered.length === 0 ? (
        <VintageText variant="mono" size="sm" color={Theme.colors.muted} align="center" style={styles.empty}>
          {filterCatId ? 'NO TASKS IN THIS CATEGORY' : 'NO TASKS YET — ADD ONE BELOW'}
        </VintageText>
      ) : (
        <View style={styles.list}>
          {filtered.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={(id, done) => toggleComplete(id, done)}
              onDelete={deleteTask}
            />
          ))}
        </View>
      )}

      {/* Add task */}
      {showForm ? (
        <AddTaskForm
          categories={categories}
          onSave={addTask}
          onClose={() => setShowForm(false)}
        />
      ) : (
        <VintageButton
          label="+ ADD NEW TASK"
          variant="secondary"
          onPress={() => setShowForm(true)}
          fullWidth
          style={styles.addBtn}
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterScroll: {
    marginBottom: Theme.spacing.md,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    marginRight: Theme.spacing.xs,
    backgroundColor: Theme.colors.paper,
  },
  filterChipActive: {
    backgroundColor: Theme.colors.ink,
    borderColor: Theme.colors.ink,
  },
  list: {
    marginBottom: Theme.spacing.md,
  },
  empty: {
    marginVertical: Theme.spacing.xl,
    letterSpacing: 2,
  },
  addBtn: {
    marginTop: Theme.spacing.md,
  },
});
