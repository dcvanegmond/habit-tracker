import {
  createHabit,
  currentStreak,
  isDoneOn,
  loadHabits,
  saveHabits,
  todayKey,
  toggleCompletion,
} from './habits.js';

/** Renders the app into `root`, persisting to `storage` (localStorage-like). */
export function mountApp(root, storage) {
  let habits = loadHabits(storage);

  function update(next) {
    habits = next;
    saveHabits(storage, habits);
    render();
  }

  function render() {
    const today = todayKey();
    root.innerHTML = `
      <h1>Habit Tracker</h1>
      <form class="add-form" aria-label="Add habit">
        <label for="habit-name" class="visually-hidden">New habit</label>
        <input id="habit-name" name="name" placeholder="e.g. Read 10 pages" autocomplete="off" />
        <button type="submit">Add</button>
      </form>
      <p class="error" role="alert" hidden></p>
      <ul class="habit-list"></ul>
      <p class="empty" ${habits.length ? 'hidden' : ''}>No habits yet. Add your first one above.</p>
    `;

    const list = root.querySelector('.habit-list');
    for (const habit of habits) {
      const done = isDoneOn(habit, today);
      const streak = currentStreak(habit, today);
      const li = document.createElement('li');
      li.className = 'habit';
      li.innerHTML = `
        <label>
          <input type="checkbox" ${done ? 'checked' : ''} />
          <span class="name"></span>
        </label>
        <span class="streak">${streak} day${streak === 1 ? '' : 's'}</span>
      `;
      li.querySelector('.name').textContent = habit.name;
      li.querySelector('input').addEventListener('change', () => {
        update(habits.map((h) => (h.id === habit.id ? toggleCompletion(h, today) : h)));
      });
      list.appendChild(li);
    }

    const form = root.querySelector('.add-form');
    const error = root.querySelector('.error');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      try {
        const habit = createHabit(form.elements.name.value);
        update([...habits, habit]);
      } catch (err) {
        error.textContent = err.message;
        error.hidden = false;
      }
    });
  }

  render();
}

const appRoot = typeof document !== 'undefined' ? document.getElementById('app') : null;
if (appRoot) {
  mountApp(appRoot, window.localStorage);
}
