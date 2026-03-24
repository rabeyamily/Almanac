import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenLayout, VintageText, Divider, VintageButton, VintageInput } from '@/components/ui';
import { CategoryCard, CATEGORY_ICONS } from '@/components/categories/CategoryCard';
import { useCategories } from '@/hooks/useCategories';
import { Theme } from '@/constants/theme';
import { Colors } from '@/constants/colors';

export default function CategoriesScreen() {
  const router = useRouter();
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState(CATEGORY_ICONS[0]);
  const [newColor, setNewColor] = useState<string>(Colors.categoryColors[0]);
  const [formError, setFormError] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) { setFormError('NAME REQUIRED'); return; }
    await addCategory({ name: newName.trim(), icon: newIcon, color: newColor });
    setNewName('');
    setNewIcon(CATEGORY_ICONS[0]);
    setNewColor(Colors.categoryColors[0]);
    setShowForm(false);
    setFormError('');
  };

  return (
    <ScreenLayout>
      {/* Header */}
      <View style={styles.header}>
        <VintageText variant="pixel" size="sm" color={Theme.colors.ink}>
          CATEGORIES
        </VintageText>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <VintageText variant="mono" size="lg" color={Theme.colors.muted}>×</VintageText>
        </TouchableOpacity>
      </View>

      <Divider marginVertical={Theme.spacing.sm} />

      {/* Category list */}
      {loading ? (
        <VintageText variant="mono" size="sm" color={Theme.colors.muted} align="center" style={styles.empty}>
          LOADING...
        </VintageText>
      ) : categories.length === 0 ? (
        <VintageText variant="mono" size="sm" color={Theme.colors.muted} align="center" style={styles.empty}>
          NO CATEGORIES YET
        </VintageText>
      ) : (
        categories.map(cat => (
          <CategoryCard
            key={cat.id}
            category={cat}
            onUpdate={updateCategory}
            onDelete={deleteCategory}
          />
        ))
      )}

      {/* Add category form */}
      {showForm ? (
        <View style={styles.form}>
          <VintageText variant="pixel" size="xs" color={Theme.colors.inkFaint} style={styles.formTitle}>
            NEW CATEGORY
          </VintageText>
          <Divider marginVertical={Theme.spacing.sm} />
          <VintageInput
            label="Name"
            value={newName}
            onChangeText={t => { setNewName(t); setFormError(''); }}
            placeholder="e.g. Health & Fitness..."
            error={formError}
            autoFocus
          />
          {/* Icon picker */}
          <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.pickerLabel}>
            ICON
          </VintageText>
          <View style={styles.iconGrid}>
            {CATEGORY_ICONS.map(ic => (
              <TouchableOpacity
                key={ic}
                style={[styles.iconChip, newIcon === ic && { backgroundColor: newColor }]}
                onPress={() => setNewIcon(ic)}
              >
                <VintageText
                  variant="mono"
                  size="lg"
                  color={newIcon === ic ? Theme.colors.paper : Theme.colors.ink}
                  align="center"
                >
                  {ic}
                </VintageText>
              </TouchableOpacity>
            ))}
          </View>
          {/* Color picker */}
          <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.pickerLabel}>
            COLOR
          </VintageText>
          <View style={styles.colorRow}>
            {Colors.categoryColors.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, newColor === c && styles.colorDotActive]}
                onPress={() => setNewColor(c)}
              />
            ))}
          </View>
          <View style={styles.formActions}>
            <VintageButton label="SAVE" onPress={handleAdd} size="sm" />
            <VintageButton label="CANCEL" variant="ghost" onPress={() => { setShowForm(false); setFormError(''); }} size="sm" />
          </View>
        </View>
      ) : (
        <VintageButton
          label="+ ADD CATEGORY"
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
  closeBtn: {
    padding: Theme.spacing.xs,
  },
  empty: {
    marginVertical: Theme.spacing.xl,
    letterSpacing: 2,
  },
  form: {
    borderWidth: Theme.borderWidth.normal,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
  },
  formTitle: {
    letterSpacing: 2,
  },
  pickerLabel: {
    letterSpacing: 1,
    marginTop: Theme.spacing.sm,
    marginBottom: 4,
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
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorDotActive: {
    borderWidth: 3,
    borderColor: Theme.colors.ink,
  },
  formActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  addBtn: {
    marginTop: Theme.spacing.md,
  },
});
