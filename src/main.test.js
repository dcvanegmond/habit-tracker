// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
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
});
