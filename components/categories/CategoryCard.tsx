import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { VintageText, VintageButton } from '@/components/ui';
import { Theme } from '@/constants/theme';
import { Category, ReminderSettings } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { ReminderEditor } from '@/components/reminders/ReminderEditor';

// Curated icon set — plain text symbols for vintage feel
export const CATEGORY_ICONS = ['☀', '◈', '▦', '★', '◉', '▶', '◆', '♦', '✦', '⊕', '⊗', '≡', '∞', '◐', '▲', '●'];

interface CategoryCardProps {
  category: Category;
  onUpdate: (id: string, data: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'reminder_settings'>>) => void;
  onDelete: (id: string) => void;
}

export function CategoryCard({ category, onUpdate, onDelete }: CategoryCardProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [icon, setIcon] = useState(category.icon);
  const [color, setColor] = useState(category.color);
  const [reminder, setReminder] = useState<ReminderSettings | null>(category.reminder_settings ?? null);

  const handleSave = () => {
    if (name.trim()) {
      onUpdate(category.id, { name: name.trim(), icon, color, reminder_settings: reminder });
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <View style={[styles.card, { borderColor: color }]}>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          autoFocus
        />
        {/* Icon picker */}
        <View style={styles.iconGrid}>
          {CATEGORY_ICONS.map(ic => (
            <TouchableOpacity
              key={ic}
              style={[styles.iconChip, icon === ic && { backgroundColor: color }]}
              onPress={() => setIcon(ic)}
            >
              <VintageText variant="mono" size="lg" color={icon === ic ? Theme.colors.paper : Theme.colors.ink} align="center">
                {ic}
              </VintageText>
            </TouchableOpacity>
          ))}
        </View>
        {/* Color picker */}
        <View style={styles.colorRow}>
          {Colors.categoryColors.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>
        <View style={styles.editActions}>
          <VintageButton label="SAVE" onPress={handleSave} size="sm" />
          <VintageButton label="CANCEL" variant="ghost" onPress={() => setEditing(false)} size="sm" />
        </View>
        <ReminderEditor title="SET REMINDER" value={reminder} onChange={setReminder} />
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: category.color }]}>
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: category.color }]}>
          <VintageText variant="mono" size="lg" color={Theme.colors.paper} align="center">
            {category.icon}
          </VintageText>
        </View>
        <VintageText variant="mono" size="md" color={Theme.colors.ink} style={styles.catName}>
          {category.name.toUpperCase()}
        </VintageText>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => setEditing(true)} style={styles.actionBtn}>
            <VintageText variant="mono" size="sm" color={Theme.colors.muted}>✎</VintageText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(category.id)} style={styles.actionBtn}>
            <VintageText variant="mono" size="sm" color={Theme.colors.red}>×</VintageText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: Theme.borderWidth.normal,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  iconBadge: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    flex: 1,
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
  },
  actionBtn: {
    padding: Theme.spacing.xs,
  },
  nameInput: {
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoMd,
    color: Theme.colors.ink,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorDotActive: {
    borderWidth: 3,
    borderColor: Theme.colors.ink,
  },
  editActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
});
