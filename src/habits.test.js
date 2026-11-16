import { describe, expect, it } from 'vitest';
import {
  createHabit,
  currentStreak,
  isDoneOn,
  loadHabits,
  previousDayKey,
  saveHabits,
  todayKey,
  toggleCompletion,
} from './habits.js';

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
  };
}

describe('todayKey / previousDayKey', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(todayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('handles month and year boundaries', () => {
    expect(previousDayKey('2026-03-01')).toBe('2026-02-28');
    expect(previousDayKey('2026-01-01')).toBe('2025-12-31');
  });
});

describe('createHabit', () => {
  it('trims the name and starts with no completions', () => {
    const habit = createHabit('  Read  ', new Date(2026, 10, 16));
    expect(habit.name).toBe('Read');
    expect(habit.createdAt).toBe('2026-11-16');
    expect(habit.completions).toEqual([]);
  });

  it('rejects empty names', () => {
    expect(() => createHabit('   ')).toThrow('Habit name cannot be empty');
  });
});

describe('toggleCompletion', () => {
  it('marks and unmarks a day without mutating the original', () => {
    const habit = createHabit('Run');
    const done = toggleCompletion(habit, '2026-11-16');
    expect(isDoneOn(done, '2026-11-16')).toBe(true);
    expect(isDoneOn(habit, '2026-11-16')).toBe(false);
    expect(isDoneOn(toggleCompletion(done, '2026-11-16'), '2026-11-16')).toBe(false);
  });
});

describe('currentStreak', () => {
  const habit = { ...createHabit('Run'), completions: ['2026-11-13', '2026-11-14', '2026-11-15'] };

  it('counts up to yesterday when today is not done yet', () => {
    expect(currentStreak(habit, '2026-11-16')).toBe(3);
  });

  it('includes today when done', () => {
    expect(currentStreak(toggleCompletion(habit, '2026-11-16'), '2026-11-16')).toBe(4);
  });

  it('is zero after a missed day', () => {
    expect(currentStreak(habit, '2026-11-17')).toBe(0);
  });
});

describe('storage', () => {
  it('round-trips habits', () => {
    const storage = memoryStorage();
    const habits = [createHabit('Read')];
    saveHabits(storage, habits);
    expect(loadHabits(storage)).toEqual(habits);
  });

  it('returns an empty list for missing or corrupt data', () => {
    const storage = memoryStorage();
    expect(loadHabits(storage)).toEqual([]);
    storage.setItem('habit-tracker:v1', '{not json');
    expect(loadHabits(storage)).toEqual([]);
  });
});
