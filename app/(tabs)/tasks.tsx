import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenLayout, VintageText, Divider, VintageButton } from '@/components/ui';
import { CategorySection } from '@/components/tasks/CategorySection';
import { TaskCard } from '@/components/tasks/TaskCard';
import { AddTaskForm } from '@/components/tasks/AddTaskForm';
import { EditTaskModal } from '@/components/tasks/EditTaskModal';
import { useTasks } from '@/hooks/useTasks';
import { useCategories } from '@/hooks/useCategories';
import { useSubcategories } from '@/hooks/useSubcategories';
import { Theme } from '@/constants/theme';
import { TaskWithStatus } from '@/lib/types';

export default function TasksScreen() {
  const router = useRouter();
  const { tasks, loading, error, toggleComplete, deleteTask, addTask, reorderTasks, updateTask } = useTasks();
  const { categories } = useCategories();
  const { subcategories } = useSubcategories();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithStatus | null>(null);

  const completed = tasks.filter(t => t.is_completed).length;

  // Group tasks by category
  const grouped = useMemo(() => {
    const byCat: Record<string, TaskWithStatus[]> = {};
    const uncategorized: TaskWithStatus[] = [];

    tasks.forEach(t => {
      if (t.category_id) {
        if (!byCat[t.category_id]) byCat[t.category_id] = [];
        byCat[t.category_id].push(t);
      } else {
        uncategorized.push(t);
      }
    });

    return { byCat, uncategorized };
  }, [tasks]);

  // Categories that have at least one task
  const activeCats = useMemo(() => {
    const catIds = new Set(Object.keys(grouped.byCat));
    return categories.filter(c => catIds.has(c.id));
  }, [categories, grouped.byCat]);

  // Categories with no tasks (show them collapsed at the end)
  const emptyCats = useMemo(() => {
    const catIds = new Set(Object.keys(grouped.byCat));
    return categories.filter(c => !catIds.has(c.id));
  }, [categories, grouped.byCat]);

  return (
    <ScreenLayout>
      {/* ALL header with progress and + button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <VintageText variant="pixel" size="sm" color={Theme.colors.ink}>
            DAILY TASKS
          </VintageText>
          <VintageText variant="mono" size="xs" color={Theme.colors.muted}>
            {completed}/{tasks.length} DONE
          </VintageText>
        </View>
        <TouchableOpacity
          style={styles.addCatBtn}
          onPress={() => router.push('/categories')}
          activeOpacity={0.7}
        >
          <VintageText variant="mono" size="lg" color={Theme.colors.gold}>
            +
          </VintageText>
        </TouchableOpacity>
      </View>

      <Divider marginVertical={Theme.spacing.sm} />
      {error ? (
        <VintageText variant="mono" size="xs" color={Theme.colors.red} style={styles.errorText}>
          {error.toUpperCase()}
        </VintageText>
      ) : null}

      {loading && tasks.length === 0 ? (
        <VintageText variant="mono" size="sm" color={Theme.colors.muted} align="center" style={styles.empty}>
          LOADING...
        </VintageText>
      ) : tasks.length === 0 ? (
        <VintageText variant="mono" size="sm" color={Theme.colors.muted} align="center" style={styles.empty}>
          NO TASKS YET — ADD ONE BELOW
        </VintageText>
      ) : (
        <View style={styles.sections}>
          {/* Uncategorized tasks first */}
          {grouped.uncategorized.length > 0 ? (
            <View style={styles.uncatSection}>
              <View style={styles.uncatHeader}>
                <VintageText variant="mono" size="xs" color={Theme.colors.muted} style={styles.uncatLabel}>
                  ─ UNCATEGORIZED
                </VintageText>
              </View>
              {grouped.uncategorized.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleComplete}
                  onDelete={deleteTask}
                  onEdit={setEditingTask}
                />
              ))}
            </View>
          ) : null}

          {/* Category sections with tasks */}
          {activeCats.map(cat => (
            <CategorySection
              key={cat.id}
              category={cat}
              subcategories={subcategories.filter(s => s.category_id === cat.id)}
              tasks={grouped.byCat[cat.id] ?? []}
              onToggle={toggleComplete}
              onDelete={deleteTask}
              onEdit={setEditingTask}
              onReorder={reorderTasks}
            />
          ))}

          {emptyCats.map(cat => (
            <CategorySection
              key={cat.id}
              category={cat}
              subcategories={subcategories.filter(s => s.category_id === cat.id)}
              tasks={[]}
              onToggle={toggleComplete}
              onDelete={deleteTask}
              onEdit={setEditingTask}
              onReorder={reorderTasks}
            />
          ))}
        </View>
      )}

      {/* Add task form / button */}
      {showForm ? (
        <AddTaskForm
          categories={categories}
          subcategories={subcategories}
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

      <EditTaskModal
        visible={!!editingTask}
        task={editingTask}
        categories={categories}
        subcategories={subcategories}
        onClose={() => setEditingTask(null)}
        onSave={updateTask}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  addCatBtn: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: Theme.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.paper,
  },
  sections: {
    marginBottom: Theme.spacing.md,
  },
  uncatSection: {
    marginBottom: Theme.spacing.md,
  },
  uncatHeader: {
    paddingVertical: Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderColor: Theme.colors.borderLight,
    borderStyle: 'dotted',
  },
  uncatLabel: {
    letterSpacing: 2,
  },
  empty: {
    marginVertical: Theme.spacing.xl,
    letterSpacing: 2,
  },
  errorText: {
    marginBottom: Theme.spacing.sm,
    letterSpacing: 0.5,
  },
  addBtn: {
    marginTop: Theme.spacing.md,
  },
});
