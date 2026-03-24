import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenLayout, VintageText, Divider, VintageButton, VintageInput } from '@/components/ui';
import { CategoryCard, CATEGORY_ICONS } from '@/components/categories/CategoryCard';
import { ReminderEditor } from '@/components/reminders/ReminderEditor';
import { useCategories } from '@/hooks/useCategories';
import { useSubcategories } from '@/hooks/useSubcategories';
import { Theme } from '@/constants/theme';
import { Colors } from '@/constants/colors';
import { ReminderSettings } from '@/lib/types';

export default function CategoriesScreen() {
  const router = useRouter();
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
  const {
    subcategories,
    addSubcategory,
    deleteSubcategory,
    updateSubcategory,
    getForCategory,
  } = useSubcategories();

  // ─── New category form state ──────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState(CATEGORY_ICONS[0]);
  const [newColor, setNewColor] = useState<string>(Colors.categoryColors[0]);
  const [newReminder, setNewReminder] = useState<ReminderSettings | null>(null);
  const [formError, setFormError] = useState('');

  // Inline subcategories to add with the new category
  const [pendingSubs, setPendingSubs] = useState<{ name: string; color: string | null }[]>([]);
  const [pendingSubName, setPendingSubName] = useState('');

  const addPendingSub = () => {
    const trimmed = pendingSubName.trim();
    if (!trimmed) return;
    setPendingSubs(prev => [...prev, { name: trimmed, color: null }]);
    setPendingSubName('');
  };

  const removePendingSub = (idx: number) =>
    setPendingSubs(prev => prev.filter((_, i) => i !== idx));

  const handleAdd = async () => {
    if (!newName.trim()) { setFormError('NAME REQUIRED'); return; }
    const created = await addCategory({
      name: newName.trim(),
      icon: newIcon,
      color: newColor,
      reminder_settings: newReminder,
    });
    if (created) {
      for (const ps of pendingSubs) {
        await addSubcategory({ category_id: created.id, name: ps.name, color: ps.color });
      }
    }
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewIcon(CATEGORY_ICONS[0]);
    setNewColor(Colors.categoryColors[0]);
    setShowForm(false);
    setFormError('');
    setNewReminder(null);
    setPendingSubs([]);
    setPendingSubName('');
  };

  // ─── Inline add-subcategory state per category ────────
  const [addSubForCat, setAddSubForCat] = useState<string | null>(null);
  const [subNameInput, setSubNameInput] = useState('');
  const [subColorInput, setSubColorInput] = useState<string | null>(null);
  const [subReminderInput, setSubReminderInput] = useState<ReminderSettings | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubColor, setEditSubColor] = useState<string | null>(null);
  const [editSubReminder, setEditSubReminder] = useState<ReminderSettings | null>(null);

  const handleAddSubToExisting = async (categoryId: string) => {
    const trimmed = subNameInput.trim();
    if (!trimmed) return;
    await addSubcategory({
      category_id: categoryId,
      name: trimmed,
      color: subColorInput,
      reminder_settings: subReminderInput,
    });
    setSubNameInput('');
    setSubColorInput(null);
    setSubReminderInput(null);
    setAddSubForCat(null);
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
        categories.map(cat => {
          const subs = getForCategory(cat.id);
          return (
            <View key={cat.id} style={styles.catBlock}>
              <CategoryCard
                category={cat}
                onUpdate={updateCategory}
                onDelete={deleteCategory}
              />

              {/* Existing subcategories */}
              {subs.length > 0 ? (
                <View style={styles.subList}>
                  {subs.map(sub => (
                    <View key={sub.id} style={styles.subRowWrap}>
                      <View style={styles.subRow}>
                        <View style={styles.subRowLeft}>
                          <VintageText variant="mono" size="xs" color={Theme.colors.muted}>└─</VintageText>
                          <View
                            style={[
                              styles.subColorDot,
                              { backgroundColor: sub.color ?? cat.color },
                            ]}
                          />
                          <VintageText variant="mono" size="sm" color={Theme.colors.ink}>
                            {sub.name.toUpperCase()}
                          </VintageText>
                        </View>
                        <View style={styles.subRowActions}>
                          <TouchableOpacity
                            onPress={() => {
                              setEditingSubId(sub.id);
                              setEditSubName(sub.name);
                              setEditSubColor(sub.color);
                              setEditSubReminder(sub.reminder_settings ?? null);
                            }}
                            style={styles.subDelete}
                          >
                            <VintageText variant="mono" size="sm" color={Theme.colors.muted}>✎</VintageText>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteSubcategory(sub.id)} style={styles.subDelete}>
                            <VintageText variant="mono" size="sm" color={Theme.colors.red}>×</VintageText>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {editingSubId === sub.id ? (
                        <View style={styles.subEditPanel}>
                          <TextInput
                            style={styles.subInput}
                            value={editSubName}
                            onChangeText={setEditSubName}
                            placeholder="Subcategory name..."
                            placeholderTextColor={Theme.colors.inkFaint}
                          />
                          <View style={styles.subColorRow}>
                            <TouchableOpacity
                              style={[
                                styles.subColorOption,
                                editSubColor === null && styles.subColorOptionActive,
                              ]}
                              onPress={() => setEditSubColor(null)}
                            >
                              <VintageText variant="mono" size="xs" color={Theme.colors.muted}>INHERIT</VintageText>
                            </TouchableOpacity>
                            {Colors.categoryColors.map(c => (
                              <TouchableOpacity
                                key={c}
                                style={[
                                  styles.miniColorDot,
                                  { backgroundColor: c },
                                  editSubColor === c && styles.miniColorDotActive,
                                ]}
                                onPress={() => setEditSubColor(c)}
                              />
                            ))}
                          </View>
                          <ReminderEditor title="SET REMINDER" value={editSubReminder} onChange={setEditSubReminder} />
                          <View style={styles.subFormActions}>
                            <VintageButton
                              label="SAVE"
                              onPress={async () => {
                                const trimmed = editSubName.trim();
                                if (!trimmed) return;
                                await updateSubcategory(sub.id, {
                                  name: trimmed,
                                  color: editSubColor,
                                  reminder_settings: editSubReminder,
                                });
                                setEditingSubId(null);
                              }}
                              size="sm"
                            />
                            <VintageButton
                              label="CANCEL"
                              variant="ghost"
                              onPress={() => setEditingSubId(null)}
                              size="sm"
                            />
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Add subcategory inline */}
              {addSubForCat === cat.id ? (
                <View style={styles.addSubForm}>
                  <TextInput
                    style={styles.subInput}
                    value={subNameInput}
                    onChangeText={setSubNameInput}
                    placeholder="Subcategory name..."
                    placeholderTextColor={Theme.colors.inkFaint}
                    autoFocus
                  />
                  <View style={styles.subColorRow}>
                    <TouchableOpacity
                      style={[
                        styles.subColorOption,
                        subColorInput === null && styles.subColorOptionActive,
                      ]}
                      onPress={() => setSubColorInput(null)}
                    >
                      <VintageText variant="mono" size="xs" color={Theme.colors.muted}>INHERIT</VintageText>
                    </TouchableOpacity>
                    {Colors.categoryColors.map(c => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.miniColorDot,
                          { backgroundColor: c },
                          subColorInput === c && styles.miniColorDotActive,
                        ]}
                        onPress={() => setSubColorInput(c)}
                      />
                    ))}
                  </View>
                  <ReminderEditor title="SET REMINDER" value={subReminderInput} onChange={setSubReminderInput} />
                  <View style={styles.subFormActions}>
                    <VintageButton label="ADD" onPress={() => handleAddSubToExisting(cat.id)} size="sm" />
                    <VintageButton
                      label="CANCEL"
                      variant="ghost"
                      onPress={() => { setAddSubForCat(null); setSubNameInput(''); setSubColorInput(null); setSubReminderInput(null); }}
                      size="sm"
                    />
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addSubBtn}
                  onPress={() => setAddSubForCat(cat.id)}
                >
                  <VintageText variant="mono" size="xs" color={cat.color}>
                    + ADD SUBCATEGORY
                  </VintageText>
                </TouchableOpacity>
              )}
            </View>
          );
        })
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
          <ReminderEditor title="SET REMINDER" value={newReminder} onChange={setNewReminder} />

          {/* Pending subcategories for the new category */}
          <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.pickerLabel}>
            SUBCATEGORIES (OPTIONAL)
          </VintageText>
          {pendingSubs.map((ps, idx) => (
            <View key={idx} style={styles.pendingSubRow}>
              <VintageText variant="mono" size="xs" color={Theme.colors.muted}>└─</VintageText>
              <VintageText variant="mono" size="sm" color={Theme.colors.ink} style={styles.pendingSubName}>
                {ps.name.toUpperCase()}
              </VintageText>
              <TouchableOpacity onPress={() => removePendingSub(idx)}>
                <VintageText variant="mono" size="sm" color={Theme.colors.red}>×</VintageText>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.pendingSubInput}>
            <TextInput
              style={styles.subInput}
              value={pendingSubName}
              onChangeText={setPendingSubName}
              placeholder="Subcategory name..."
              placeholderTextColor={Theme.colors.inkFaint}
              onSubmitEditing={addPendingSub}
            />
            <VintageButton label="+" onPress={addPendingSub} size="sm" />
          </View>

          <Divider marginVertical={Theme.spacing.sm} />
          <View style={styles.formActions}>
            <VintageButton label="SAVE" onPress={handleAdd} size="sm" />
            <VintageButton label="CANCEL" variant="ghost" onPress={resetForm} size="sm" />
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
  catBlock: {
    marginBottom: Theme.spacing.md,
  },
  subList: {
    paddingLeft: Theme.spacing.lg,
    marginTop: -Theme.spacing.xs,
    marginBottom: Theme.spacing.xs,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: Theme.colors.borderLight,
    borderStyle: 'dotted',
  },
  subRowWrap: {
    borderBottomWidth: 1,
    borderColor: Theme.colors.borderLight,
    borderStyle: 'dotted',
  },
  subRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  subEditPanel: {
    marginLeft: Theme.spacing.lg,
    marginBottom: Theme.spacing.xs,
  },
  subColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  subDelete: {
    padding: Theme.spacing.xs,
  },
  addSubBtn: {
    paddingLeft: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xs,
  },
  addSubForm: {
    paddingLeft: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderLeftWidth: 2,
    borderColor: Theme.colors.borderLight,
    marginLeft: Theme.spacing.md,
  },
  subInput: {
    flex: 1,
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoSm,
    color: Theme.colors.ink,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    backgroundColor: Theme.colors.paper,
  },
  subColorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 6,
  },
  subColorOption: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  subColorOptionActive: {
    borderColor: Theme.colors.ink,
    backgroundColor: Theme.colors.paperDark,
  },
  miniColorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  miniColorDotActive: {
    borderWidth: 2,
    borderColor: Theme.colors.ink,
  },
  subFormActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.xs,
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
  pendingSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingVertical: 3,
  },
  pendingSubName: {
    flex: 1,
  },
  pendingSubInput: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
    alignItems: 'center',
    marginTop: Theme.spacing.xs,
  },
  formActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  addBtn: {
    marginTop: Theme.spacing.md,
  },
});
