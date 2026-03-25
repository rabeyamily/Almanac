import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { addDays, addMonths, addYears, endOfMonth, endOfWeek, endOfYear, format, startOfMonth, startOfWeek, startOfYear, subDays, getDaysInMonth, isSameDay } from 'date-fns';
import { ScreenLayout, VintageText, Divider } from '@/components/ui';
import { Theme } from '@/constants/theme';
import { useDailyHabitsCompletions } from '@/hooks/useDailyHabitsCompletions';
import { toDateKey } from '@/lib/dateUtils';
import type { TrackerHabit } from '@/hooks/useDailyHabitsCompletions';

type TrackerView = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; // weekStartsOn=Monday

function clampLabel(s: string) {
  return s.toUpperCase();
}

function computeCompletionCountForDay(habits: TrackerHabit[], completionByTask: Record<string, Set<string>>, dateKey: string) {
  let count = 0;
  for (const h of habits) {
    const set = completionByTask[h.taskId];
    if (set?.has(dateKey)) count += 1;
  }
  return count;
}

function computeStreakEndingAt(
  habits: TrackerHabit[],
  completionByTask: Record<string, Set<string>>,
  taskId: string,
  streakEndDate: Date,
  queryStartDate: Date
): number {
  const completionSet = completionByTask[taskId] ?? new Set<string>();
  let streak = 0;
  let cursor = streakEndDate;
  // Limit by queryStartDate so we don't loop forever if data is sparse.
  while (cursor >= queryStartDate) {
    const key = toDateKey(cursor);
    if (!completionSet.has(key)) break;
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

function completionRateColor(rate01: number) {
  // 0% -> cream, 1..25 -> light amber, 26..75 -> gold, 76..100 -> dark amber
  if (rate01 <= 0) return Theme.colors.paperDeep;
  if (rate01 < 0.25) return Theme.colors.goldLight;
  if (rate01 < 0.75) return Theme.colors.gold;
  return Theme.colors.goldDark;
}

export default function TrackerScreen() {
  const [view, setView] = useState<TrackerView>('WEEKLY');
  const { width: screenWidth } = useWindowDimensions();

  const [weekAnchor, setWeekAnchor] = useState<Date>(new Date());
  const [monthAnchor, setMonthAnchor] = useState<Date>(startOfMonth(new Date()));
  const [yearAnchor, setYearAnchor] = useState<Date>(startOfYear(new Date()));

  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);

  const weekStart = useMemo(() => startOfWeek(weekAnchor, { weekStartsOn: 1 }), [weekAnchor]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const monthStart = useMemo(() => startOfMonth(monthAnchor), [monthAnchor]);
  const monthEnd = useMemo(() => endOfMonth(monthAnchor), [monthAnchor]);
  const monthGridStart = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 1 }), [monthStart]);
  const monthGridEnd = useMemo(() => endOfWeek(monthEnd, { weekStartsOn: 1 }), [monthEnd]);

  const yearStart = useMemo(() => startOfYear(yearAnchor), [yearAnchor]);
  const yearEnd = useMemo(() => endOfYear(yearAnchor), [yearAnchor]);

  // For weekly streaks, we want a bit of history before the visible 7 days.
  const queryStart = useMemo(() => {
    if (view === 'WEEKLY') return subDays(weekStart, 60);
    if (view === 'MONTHLY') return monthGridStart;
    return yearStart;
  }, [monthGridStart, weekStart, view, yearStart]);

  const queryEnd = useMemo(() => {
    if (view === 'WEEKLY') return weekEnd;
    if (view === 'MONTHLY') return monthGridEnd;
    return yearEnd;
  }, [monthGridEnd, weekEnd, view, yearEnd]);

  const { habits, completionByTask, loading } = useDailyHabitsCompletions(queryStart, queryEnd);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekDayKeys = useMemo(() => weekDays.map(d => toDateKey(d)), [weekDays]);

  const weeklyStats = useMemo(() => {
    const habitCount = habits.length;
    if (habitCount === 0) {
      return { metPct: 0, bestDayCount: 0, totalDone: 0, bestStreak: 0 };
    }

    let totalDone = 0;
    let bestDayCount = 0;

    for (const key of weekDayKeys) {
      const count = computeCompletionCountForDay(habits, completionByTask, key);
      bestDayCount = Math.max(bestDayCount, count);
      totalDone += count;
    }

    const metPct = Math.round((totalDone / (habitCount * 7)) * 100);

    const isTodayInWeek = weekDayKeys.includes(todayKey);
    const streakEndKey = isTodayInWeek ? todayKey : toDateKey(weekEnd);
    const streakEndDate = isTodayInWeek ? today : weekEnd;

    let bestStreak = 0;
    for (const habit of habits) {
      const streak = computeStreakEndingAt(habits, completionByTask, habit.taskId, streakEndDate, queryStart);
      bestStreak = Math.max(bestStreak, streak);
    }

    return { metPct, bestDayCount, totalDone, bestStreak };
  }, [completionByTask, habits, queryStart, today, todayKey, weekDayKeys, weekEnd]);

  const selectedWeekRangeLabel = useMemo(() => {
    const a = format(weekStart, 'dd.MM');
    const b = format(weekEnd, 'dd.MM');
    return `${a} ~ ${b}`;
  }, [weekEnd, weekStart]);

  const selectedMonthLabel = useMemo(() => {
    return format(monthStart, 'MMMM yyyy').toUpperCase();
  }, [monthStart]);

  const selectedYearLabel = useMemo(() => {
    return format(yearStart, 'yyyy').toUpperCase();
  }, [yearStart]);

  const renderViewSwitcher = () => (
    <View style={styles.viewSwitcher}>
      {(['WEEKLY', 'MONTHLY', 'YEARLY'] as TrackerView[]).map(v => {
        const active = view === v;
        return (
          <TouchableOpacity key={v} style={styles.viewTab} onPress={() => setView(v)} activeOpacity={0.8}>
            <VintageText variant="mono" size="sm" color={active ? Theme.colors.ink : Theme.colors.inkFaint}>
              {clampLabel(v)}
            </VintageText>
            {active ? <View style={styles.viewUnderline} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderWeekNavigator = () => (
    <View style={styles.navigator}>
      <TouchableOpacity style={styles.navArrowBtn} onPress={() => setWeekAnchor(d => subDays(d, 7))} activeOpacity={0.8}>
        <VintageText variant="mono" size="sm" color={Theme.colors.ink}>
          ◄
        </VintageText>
      </TouchableOpacity>
      <View style={styles.rangeHighlight}>
        <VintageText variant="mono" size="sm" color={Theme.colors.ink}>
          {selectedWeekRangeLabel}
        </VintageText>
      </View>
      <TouchableOpacity style={styles.navArrowBtn} onPress={() => setWeekAnchor(d => addDays(d, 7))} activeOpacity={0.8}>
        <VintageText variant="mono" size="sm" color={Theme.colors.ink}>
          ►
        </VintageText>
      </TouchableOpacity>
    </View>
  );

  const renderMonthNavigator = () => (
    <View style={styles.navigator}>
      <TouchableOpacity style={styles.navArrowBtn} onPress={() => setMonthAnchor(d => startOfMonth(addMonths(d, -1)))} activeOpacity={0.8}>
        <VintageText variant="mono" size="sm" color={Theme.colors.ink}>
          ◄
        </VintageText>
      </TouchableOpacity>
      <View style={styles.rangeHighlight}>
        <VintageText variant="mono" size="sm" color={Theme.colors.ink}>
          {selectedMonthLabel}
        </VintageText>
      </View>
      <TouchableOpacity style={styles.navArrowBtn} onPress={() => setMonthAnchor(d => startOfMonth(addMonths(d, 1)))} activeOpacity={0.8}>
        <VintageText variant="mono" size="sm" color={Theme.colors.ink}>
          ►
        </VintageText>
      </TouchableOpacity>
    </View>
  );

  const renderYearNavigator = () => (
    <View style={styles.navigator}>
      <TouchableOpacity style={styles.navArrowBtn} onPress={() => setYearAnchor(d => startOfYear(addYears(d, -1)))} activeOpacity={0.8}>
        <VintageText variant="mono" size="sm" color={Theme.colors.ink}>
          ◄
        </VintageText>
      </TouchableOpacity>
      <View style={styles.rangeHighlight}>
        <VintageText variant="mono" size="sm" color={Theme.colors.ink}>
          {selectedYearLabel}
        </VintageText>
      </View>
      <TouchableOpacity style={styles.navArrowBtn} onPress={() => setYearAnchor(d => startOfYear(addYears(d, 1)))} activeOpacity={0.8}>
        <VintageText variant="mono" size="sm" color={Theme.colors.ink}>
          ►
        </VintageText>
      </TouchableOpacity>
    </View>
  );

  const renderWeekly = () => {
    const todayInWeek = weekDayKeys.includes(todayKey);

    if (!habits.length) {
      return (
        <View style={styles.emptyWrap}>
          <VintageText variant="mono" size="sm" color={Theme.colors.muted} align="center">
            NO DAILY HABITS
          </VintageText>
        </View>
      );
    }

    const outerPad = Theme.spacing.md * 2; // ScreenLayout padded horizontal
    const cardPad = Theme.spacing.sm * 2; // this page's card padding
    const tableW = Math.max(300, screenWidth - outerPad - cardPad);

    const minDayCol = 24;
    const minHabitCol = 110;
    const minStreakCol = 56;

    let streakColW = Math.min(72, Math.max(minStreakCol, Math.floor(tableW * 0.18)));
    let dayColW = Math.floor((tableW - streakColW) / 7);
    dayColW = Math.max(minDayCol, dayColW);

    let habitColW = tableW - streakColW - dayColW * 7;
    if (habitColW < minHabitCol) {
      // Reduce day column size first to preserve the 7-column layout.
      const overflow = minHabitCol - habitColW;
      const dayReduction = Math.ceil(overflow / 7);
      dayColW = Math.max(minDayCol, dayColW - dayReduction);
      habitColW = tableW - streakColW - dayColW * 7;
    }

    const daySquare = Math.max(18, Math.min(22, Math.floor(dayColW * 0.55)));
    const dayCellH = daySquare + 20;
    const dayPill = Math.max(22, Math.min(28, daySquare + 4));
    const ROW_H = dayCellH;

    return (
      <View>
        <View style={[styles.tableHeader, { width: tableW }]}>
          <View style={{ width: habitColW }} />
          {weekDays.map((_, idx) => {
            const dateKey = weekDayKeys[idx]!;
            const isTodayHeader = dateKey === todayKey;
            return (
              <View
                key={dateKey}
                style={[
                  styles.dayHeaderCol,
                  { width: dayColW },
                  isTodayHeader && styles.dayHeaderColToday,
                ]}
              >
                <View style={[styles.dayPill, { width: dayPill, height: dayPill }]}>
                  <VintageText variant="mono" size="xs" color={Theme.colors.ink}>
                    {DAY_LETTERS[idx]}
                  </VintageText>
                </View>
              </View>
            );
          })}
          <View style={{ width: streakColW }}>
            <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} align="center">
              STREAK
            </VintageText>
          </View>
        </View>

        {habits.map(h => {
          const completedSet = completionByTask[h.taskId] ?? new Set<string>();
          const completedCountThisWeek = weekDayKeys.reduce((acc, key) => acc + (completedSet.has(key) ? 1 : 0), 0);
          const isPerfect = completedCountThisWeek === 7;

          const streakEndDate = todayInWeek ? today : weekEnd;
          const streak = computeStreakEndingAt(habits, completionByTask, h.taskId, streakEndDate, queryStart);

          return (
            <View
              key={h.taskId}
              style={[styles.tableRow, { width: tableW, minHeight: ROW_H }]}
            >
              <View style={[styles.habitCell, { width: habitColW }]}>
                <VintageText variant="mono" size="sm" color={h.color} style={styles.habitIcon}>
                  {h.icon}
                </VintageText>
                <VintageText variant="mono" size="xs" color={Theme.colors.ink} numberOfLines={1} style={styles.habitName}>
                  {h.name}
                </VintageText>
              </View>

              {weekDays.map((d, idx) => {
                const dateKey = weekDayKeys[idx]!;
                const isCompleted = completedSet.has(dateKey);
                const isFuture = dateKey > todayKey;
                const isPast = dateKey < todayKey;
                const isTodayCol = isSameDay(d, today);

                return (
                  <View
                    key={`${h.taskId}-${dateKey}`}
                    style={[
                      styles.dayCellCol,
                      { width: dayColW, height: dayCellH },
                      isTodayCol && styles.dayCellTodayTint,
                    ]}
                  >
                    <View
                      style={[
                        styles.daySquare,
                        {
                          width: daySquare,
                          height: daySquare,
                          backgroundColor: isCompleted ? h.color : 'transparent',
                          borderRadius: 7,
                        },
                        !isCompleted && isPast && {
                          borderWidth: 1,
                          borderColor: Theme.colors.borderLight,
                          borderStyle: 'dashed',
                        },
                        !isCompleted && isFuture && { opacity: 0.2, borderWidth: 0 },
                        isCompleted && { borderWidth: 1, borderColor: h.color },
                      ]}
                    />
                  </View>
                );
              })}

              <View style={[styles.badgeCol, { width: streakColW }]}>
                {isPerfect ? (
                  <View style={[styles.perfectBadge, { borderColor: Theme.colors.goldLight }]}>
                    <VintageText variant="mono" size="xs" color={Theme.colors.gold} align="center">
                      ◆
                    </VintageText>
                    <VintageText variant="mono" size="xs" color={Theme.colors.gold} align="center" style={styles.perfectText}>
                      PERFECT
                    </VintageText>
                  </View>
                ) : (
                  <VintageText variant="mono" size="sm" color={Theme.colors.inkFaint} align="center">
                    {streak}d
                  </VintageText>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderMonthly = () => {
    if (!habits.length) {
      return (
        <View style={styles.emptyWrap}>
          <VintageText variant="mono" size="sm" color={Theme.colors.muted} align="center">
            NO DAILY HABITS
          </VintageText>
        </View>
      );
    }

    const gridDays: Date[] = [];
    let cursor = monthGridStart;
    while (cursor <= monthGridEnd) {
      gridDays.push(cursor);
      cursor = addDays(cursor, 1);
    }

    const cellSize = 40;
    const rows: Date[][] = [];
    for (let i = 0; i < gridDays.length; i += 7) rows.push(gridDays.slice(i, i + 7));

    // Month-scoped “perfect” + streak badges for each habit.
    const monthDayKeys: string[] = [];
    let monthCursor = new Date(monthStart);
    while (monthCursor <= monthEnd) {
      monthDayKeys.push(toDateKey(monthCursor));
      monthCursor = addDays(monthCursor, 1);
    }

    return (
      <View>
        <View style={styles.monthGridWrap}>
          <View style={styles.calendarHeaderRow}>
            {DAY_LETTERS.map((d, i) => (
              <View key={`${d}-${i}`} style={styles.calendarHeaderCell}>
                <VintageText variant="mono" size="xs" color={Theme.colors.ink} align="center">
                  {d}
                </VintageText>
              </View>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {rows.map((rowDays, rowIdx) => (
              <View key={`r-${rowIdx}`} style={styles.calendarRow}>
                {rowDays.map(day => {
                  const dateKey = toDateKey(day);
                  const isToday = dateKey === todayKey;
                  const isInMonth = day.getMonth() === monthStart.getMonth();
                  const isFuture = dateKey > todayKey;
                  const completedTaskColors: string[] = [];

                  for (const h of habits) {
                    const set = completionByTask[h.taskId];
                    if (set?.has(dateKey)) completedTaskColors.push(h.color);
                  }

                  const shown = completedTaskColors.slice(0, 6);
                  const overflow = completedTaskColors.length - shown.length;

                  const ghost = isFuture && completedTaskColors.length === 0;

                  return (
                    <View
                      key={dateKey}
                      style={[
                        styles.calendarDayCell,
                        { width: cellSize, height: cellSize, opacity: isInMonth ? 1 : 0.35 },
                        isToday && styles.calendarDayTodayTint,
                        ghost && { borderWidth: 0, backgroundColor: 'transparent' },
                      ]}
                    >
                      <View style={styles.calendarDots}>
                        {shown.map((c, idx) => (
                          <View
                            // eslint-disable-next-line react/no-array-index-key
                            key={`${dateKey}-dot-${idx}`}
                            style={[
                              styles.miniDot,
                              {
                                backgroundColor: c,
                                left: idx % 3 === 0 ? 4 : idx % 3 === 1 ? 12 : 20,
                                top: idx < 3 ? 10 : 22,
                              },
                            ]}
                          />
                        ))}
                        {overflow > 0 ? (
                          <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.overflowText}>
                            +{overflow}
                          </VintageText>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* MONTHLY habit streak/perfect badges */}
        <View style={styles.monthLegend}>
          <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.monthLegendTitle}>
            HABIT STREAKS
          </VintageText>
          <View style={styles.monthLegendGrid}>
            {habits.map(h => {
              const set = completionByTask[h.taskId] ?? new Set<string>();
              const perfect = monthDayKeys.length > 0 && monthDayKeys.every(k => set.has(k));
              const streak = computeStreakEndingAt(habits, completionByTask, h.taskId, today, monthStart);

              return (
                <View
                  key={h.taskId}
                  style={[
                    styles.legendRow,
                    {
                      borderColor: h.color,
                    },
                  ]}
                >
                  <VintageText variant="mono" size="xs" color={h.color}>
                    {h.icon}
                  </VintageText>
                  <VintageText variant="mono" size="xs" color={Theme.colors.ink} style={styles.legendName} numberOfLines={1}>
                    {h.name}
                  </VintageText>
                  {perfect ? (
                    <View style={[styles.legendBadge, { borderColor: Theme.colors.goldLight }]}>
                      <VintageText variant="mono" size="xs" color={Theme.colors.gold} align="center">
                        ◆
                      </VintageText>
                      <VintageText variant="mono" size="xs" color={Theme.colors.gold} align="center" style={styles.legendBadgeText}>
                        PERFECT
                      </VintageText>
                    </View>
                  ) : (
                    <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.legendStreak}>
                      {streak}d
                    </VintageText>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderYearly = () => {
    if (!habits.length) {
      return (
        <View style={styles.emptyWrap}>
          <VintageText variant="mono" size="sm" color={Theme.colors.muted} align="center">
            NO DAILY HABITS
          </VintageText>
        </View>
      );
    }

    const habitCount = habits.length;
    const monthStarts = Array.from({ length: 12 }, (_, i) => new Date(yearStart.getFullYear(), i, 1));

    const CELL = 8;
    const GAP = 1;
    const HEAT_W = CELL + GAP;

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ paddingBottom: 10 }}>
          {monthStarts.map(ms => {
            const monthIndex = ms.getMonth();
            const daysInMonth = getDaysInMonth(ms);
            const monthLabel = format(ms, 'MMM').toUpperCase();

            return (
              <View key={`m-${monthIndex}`} style={styles.heatRow}>
                <View style={styles.heatMonthLabel}>
                  <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint}>
                    {monthLabel}
                  </VintageText>
                </View>
                <View style={{ flexDirection: 'row', gap: GAP }}>
                  {Array.from({ length: daysInMonth }, (_, dayIdx) => {
                    const day = dayIdx + 1;
                    const d = new Date(ms.getFullYear(), monthIndex, day);
                    const key = toDateKey(d);
                    const completedCount = computeCompletionCountForDay(habits, completionByTask, key);
                    const rate01 = completedCount / Math.max(1, habitCount);
                    const color = completionRateColor(rate01);
                    const isToday = key === todayKey;

                    return (
                      <View
                        // eslint-disable-next-line react/no-array-index-key
                        key={`d-${monthIndex}-${day}`}
                        style={[
                          styles.heatCell,
                          {
                            width: CELL,
                            height: CELL,
                            backgroundColor: color,
                            borderColor: isToday ? Theme.colors.gold : 'transparent',
                            borderWidth: isToday ? 1 : 0,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  return (
    <ScreenLayout>
      <VintageText variant="pixel" size="sm" color={Theme.colors.ink} style={styles.pageHeading}>
        TRACKER
      </VintageText>
      <Divider marginVertical={Theme.spacing.sm} />

      {renderViewSwitcher()}
      <Divider marginVertical={Theme.spacing.sm} />

      {view === 'WEEKLY' ? renderWeekNavigator() : null}
      {view === 'MONTHLY' ? renderMonthNavigator() : null}
      {view === 'YEARLY' ? renderYearNavigator() : null}

      <Divider marginVertical={Theme.spacing.sm} />

      {loading ? (
        <VintageText variant="mono" size="sm" color={Theme.colors.muted} align="center">
          LOADING TRACKER...
        </VintageText>
      ) : (
        <View>
          <View style={styles.card}>
            {view === 'WEEKLY' ? renderWeekly() : null}
            {view === 'MONTHLY' ? renderMonthly() : null}
            {view === 'YEARLY' ? renderYearly() : null}
          </View>

          {view === 'WEEKLY' ? (
            <View style={styles.statsBar}>
              <View style={styles.statBox}>
                <View style={styles.statValueRow}>
                  <VintageText variant="pixel" size="lg" color={Theme.colors.gold}>
                    {weeklyStats.metPct}
                  </VintageText>
                  <VintageText variant="pixel" size="lg" color={Theme.colors.gold}>
                    %
                  </VintageText>
                </View>
                <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.statLabel}>
                  MET
                </VintageText>
              </View>

              <View style={styles.statBox}>
                <VintageText variant="pixel" size="lg" color="#5A6E8C">
                  {weeklyStats.bestDayCount}d
                </VintageText>
                <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.statLabel}>
                  BEST DAY
                </VintageText>
              </View>

              <View style={styles.statBox}>
                <VintageText variant="pixel" size="lg" color={Theme.colors.green}>
                  {weeklyStats.totalDone}
                </VintageText>
                <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.statLabel}>
                  TOTAL DONE
                </VintageText>
              </View>

              <View style={styles.statBox}>
                <VintageText variant="pixel" size="lg" color={Theme.colors.goldDark}>
                  {weeklyStats.bestStreak}d
                </VintageText>
                <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.statLabel}>
                  BEST STREAK
                </VintageText>
              </View>
            </View>
          ) : null}
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  pageHeading: {
    letterSpacing: 2,
    marginBottom: 0,
  },
  viewSwitcher: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  viewTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  viewUnderline: {
    marginTop: 4,
    width: 46,
    height: 2,
    backgroundColor: Theme.colors.gold,
  },
  navigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
  },
  navArrowBtn: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
  },
  rangeHighlight: {
    backgroundColor: 'rgba(201, 168, 76, 0.25)',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: 2,
  },
  card: {
    borderWidth: Theme.borderWidth.normal,
    borderColor: Theme.colors.borderLight,
    borderStyle: 'dashed',
    borderRadius: Theme.borderRadius.none,
    backgroundColor: Theme.colors.paper,
    padding: Theme.spacing.sm,
  },
  statsBar: {
    marginTop: Theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 2,
    gap: 6,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  statLabel: {
    letterSpacing: 1,
    marginTop: 4,
  },
  emptyWrap: {
    paddingVertical: Theme.spacing.md,
  },

  // Weekly table
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    paddingBottom: Theme.spacing.xs,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 0,
    borderColor: Theme.colors.borderLight,
  },
  habitCell: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 6,
  },
  habitIcon: {
    width: 22,
    textAlign: 'center',
  },
  habitName: {
    flex: 1,
  },
  dayHeaderCol: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeaderColToday: {
    backgroundColor: 'rgba(201, 168, 76, 0.18)',
    borderRadius: 999,
  },
  dayPill: {
    width: 26,
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.paperDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellCol: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
  },
  dayCellTodayTint: {
    backgroundColor: 'rgba(201, 168, 76, 0.12)',
  },
  daySquare: {
    width: 22,
    height: 22,
    borderRadius: 7,
  },
  badgeCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfectBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  perfectText: {
    letterSpacing: 1,
    marginTop: 1,
  },

  // Monthly calendar
  monthGridWrap: {
    borderWidth: 0,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
  },
  calendarHeaderCell: {
    width: 40,
    flexGrow: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  calendarGrid: {
    flexDirection: 'column',
  },
  calendarRow: {
    flexDirection: 'row',
  },
  calendarDayCell: {
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    borderRadius: 7,
    margin: 0,
    backgroundColor: Theme.colors.paperDark,
  },

  // MONTHLY habit badges (right under the calendar)
  monthLegend: {
    marginTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
    paddingTop: Theme.spacing.sm,
  },
  monthLegendTitle: {
    letterSpacing: 1,
    marginBottom: Theme.spacing.xs,
  },
  monthLegendGrid: {
    gap: Theme.spacing.xs,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  legendName: {
    flex: 1,
  },
  legendBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 6,
  },
  legendBadgeText: {
    letterSpacing: 1,
    marginTop: 1,
  },
  legendStreak: {
    letterSpacing: 1,
    marginLeft: 'auto',
  },
  calendarDayTodayTint: {
    backgroundColor: 'rgba(201, 168, 76, 0.15)',
  },
  calendarDots: {
    position: 'relative',
    flex: 1,
  },
  miniDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: Theme.colors.paper,
  },
  overflowText: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },

  // Yearly heatmap
  heatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  heatMonthLabel: {
    width: 44,
    paddingRight: 6,
  },
  heatCell: {
    borderRadius: 2,
  },
});

