import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { VintageText } from '@/components/ui';
import { TaskCard } from './TaskCard';
import { Theme } from '@/constants/theme';
import { Category, Subcategory, TaskWithStatus } from '@/lib/types';

interface CategorySectionProps {
  category: Category;
  subcategories: Subcategory[];
  tasks: TaskWithStatus[];
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onToggleHighlight?: (id: string, highlighted: boolean) => void;
}

export function CategorySection({
  category,
  subcategories,
  tasks,
  onToggle,
  onDelete,
  onToggleHighlight,
}: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const directTasks = tasks.filter(t => !t.subcategory_id);
  const subsWithTasks = subcategories.map(sub => ({
    sub,
    tasks: tasks.filter(t => t.subcategory_id === sub.id),
  })).filter(g => g.tasks.length > 0);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.is_completed).length;

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={[styles.catHeader, { borderColor: category.color }]}
        onPress={() => setCollapsed(p => !p)}
        activeOpacity={0.7}
      >
        <View style={styles.catHeaderLeft}>
          <VintageText variant="mono" size="md" color={category.color}>
            ✦
          </VintageText>
          <VintageText variant="pixel" size="xs" color={Theme.colors.ink} style={styles.catName}>
            {category.name.toUpperCase()}
          </VintageText>
          <VintageText variant="mono" size="xs" color={Theme.colors.muted}>
            {doneTasks}/{totalTasks}
          </VintageText>
        </View>
        <VintageText variant="mono" size="md" color={Theme.colors.muted}>
          {collapsed ? '▶' : '▼'}
        </VintageText>
      </TouchableOpacity>

      {!collapsed ? (
        <View style={styles.catBody}>
          {directTasks.map(task => (
            <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onToggleHighlight={onToggleHighlight} />
          ))}

          {subsWithTasks.map(({ sub, tasks: subTasks }) => (
            <SubcategoryGroup
              key={sub.id}
              subcategory={sub}
              parentColor={category.color}
              tasks={subTasks}
              onToggle={onToggle}
              onDelete={onDelete}
              onToggleHighlight={onToggleHighlight}
            />
          ))}

          {totalTasks === 0 ? (
            <VintageText variant="mono" size="xs" color={Theme.colors.muted} style={styles.emptyHint}>
              NO TASKS IN THIS CATEGORY
            </VintageText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

interface SubcategoryGroupProps {
  subcategory: Subcategory;
  parentColor: string;
  tasks: TaskWithStatus[];
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onToggleHighlight?: (id: string, highlighted: boolean) => void;
}

function SubcategoryGroup({ subcategory, parentColor, tasks, onToggle, onDelete, onToggleHighlight }: SubcategoryGroupProps) {
  const [collapsed, setCollapsed] = useState(false);
  const color = subcategory.color ?? parentColor;

  return (
    <View style={styles.subSection}>
      <TouchableOpacity
        style={styles.subHeader}
        onPress={() => setCollapsed(p => !p)}
        activeOpacity={0.7}
      >
        <View style={styles.subHeaderLeft}>
          <VintageText variant="mono" size="xs" color={Theme.colors.muted}>└─</VintageText>
          <VintageText variant="mono" size="sm" color={color}>◈</VintageText>
          <VintageText variant="mono" size="sm" color={Theme.colors.ink}>
            {subcategory.name.toUpperCase()}
          </VintageText>
        </View>
        <VintageText variant="mono" size="sm" color={Theme.colors.muted}>
          {collapsed ? '▶' : '▼'}
        </VintageText>
      </TouchableOpacity>

      {!collapsed ? (
        <View style={styles.subBody}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onToggleHighlight={onToggleHighlight} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Theme.spacing.md,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderBottomWidth: 1,
    borderColor: Theme.colors.border,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.xs,
    backgroundColor: Theme.colors.paperDark,
  },
  catHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  catName: {
    letterSpacing: 2,
  },
  catBody: {
    paddingLeft: Theme.spacing.sm,
    paddingTop: Theme.spacing.sm,
  },
  emptyHint: {
    marginVertical: Theme.spacing.sm,
    letterSpacing: 1,
  },
  subSection: {
    marginTop: Theme.spacing.xs,
    marginLeft: Theme.spacing.sm,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: Theme.spacing.xs,
    borderBottomWidth: 1,
    borderColor: Theme.colors.borderLight,
    borderStyle: 'dotted',
  },
  subHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  subBody: {
    paddingLeft: Theme.spacing.md,
    paddingTop: Theme.spacing.xs,
  },
});
