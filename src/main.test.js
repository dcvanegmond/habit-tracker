// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountApp } from './main.js';

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
  };
}

describe('mountApp', () => {
  let root;
  let storage;

  beforeEach(() => {
    document.body.innerHTML = '<main id="root"></main>';
    root = document.getElementById('root');
    storage = memoryStorage();
    mountApp(root, storage);
  });

  function addHabit(name) {
    root.querySelector('#habit-name').value = name;
    root.querySelector('.add-form').dispatchEvent(new Event('submit', { cancelable: true }));
  }

  it('shows an empty state', () => {
    expect(root.querySelector('.empty').hidden).toBe(false);
  });

  it('adds a habit and persists it', () => {
    addHabit('Drink water');
    expect(root.querySelector('.habit .name').textContent).toBe('Drink water');
    expect(storage.getItem('habit-tracker:v1')).toContain('Drink water');
  });

  it('shows an error for an empty name', () => {
    addHabit('   ');
    const error = root.querySelector('.error');
    expect(error.hidden).toBe(false);
    expect(error.textContent).toMatch(/empty/);
  });

  it('marks a habit done today and updates the streak', () => {
    addHabit('Stretch');
    const checkbox = root.querySelector('.habit input[type="checkbox"]');
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    expect(root.querySelector('.habit .streak').textContent).toBe('1 day');
  });

  describe('deleting', () => {
    const key = 'habit-tracker:v1';
    afterEach(() => vi.restoreAllMocks());

    it('gives the delete button an accessible name with the habit name', () => {
      addHabit('Read 10 pages');
      const btn = root.querySelector('.habit button.delete');
      expect(btn.getAttribute('aria-label')).toBe('Delete Read 10 pages');
      expect(btn.type).toBe('button');
    });

    it('removes the habit when confirmed, keeps others, and persists', () => {
      addHabit('One');
      addHabit('Two');
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      root.querySelector('.habit button.delete').click();
      const names = [...root.querySelectorAll('.habit .name')].map((n) => n.textContent);
      expect(names).toEqual(['Two']);
      expect(storage.getItem(key)).not.toContain('One');
      expect(storage.getItem(key)).toContain('Two');
      mountApp(root, storage);
      expect([...root.querySelectorAll('.habit .name')].map((n) => n.textContent)).toEqual(['Two']);
    });

    it('keeps the completions and streak of the remaining habits', () => {
      addHabit('One');
      addHabit('Two');
      const twoCheckbox = root.querySelectorAll('.habit input[type="checkbox"]')[1];
      twoCheckbox.checked = true;
      twoCheckbox.dispatchEvent(new Event('change'));
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      root.querySelector('.habit button.delete').click();
      const remaining = root.querySelectorAll('.habit');
      expect(remaining).toHaveLength(1);
      expect(remaining[0].querySelector('.name').textContent).toBe('Two');
      expect(remaining[0].querySelector('input[type="checkbox"]').checked).toBe(true);
      expect(remaining[0].querySelector('.streak').textContent).toBe('1 day');
    });

    it('does nothing when cancelled', () => {
      addHabit('One');
      const before = storage.getItem(key);
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      root.querySelector('.habit button.delete').click();
      expect(root.querySelectorAll('.habit')).toHaveLength(1);
      expect(storage.getItem(key)).toBe(before);
    });

    it('shows the empty message after deleting the last habit', () => {
      addHabit('Only');
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      root.querySelector('.habit button.delete').click();
      expect(root.querySelectorAll('.habit')).toHaveLength(0);
      expect(root.querySelector('.empty').hidden).toBe(false);
    });
  });
});
