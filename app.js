'use strict';

(() => {
  const byId = (id) => document.getElementById(id);
  const form = byId('task-form');
  const titleInput = byId('task-title');
  const descriptionInput = byId('task-description');
  const fields = byId('task-fields');
  const list = byId('task-list');
  const status = byId('status-message');
  const refreshButton = byId('refresh-tasks');
  let config = null;
  let tasks = [];
  let editingId = null;
  let busy = false;

  function message(text, kind = 'success') {
    status.textContent = text;
    status.dataset.kind = kind;
    status.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  }

  function setBusy(value) {
    busy = value;
    fields.disabled = value || !config;
    refreshButton.disabled = value;
    list.setAttribute('aria-busy', String(value));
    list.querySelectorAll('button').forEach((button) => { button.disabled = value; });
  }

  async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('The request timed out. Please try again.');
      throw new Error('Cannot reach the server. Check your connection and try again.');
    } finally {
      clearTimeout(timeout);
    }
  }

  async function loadConfig() {
    const response = await fetchWithTimeout('config.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load config.json. Please refresh the page.');
    const value = await response.json();
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(value.supabaseUrl || '') ||
        !/^sb_publishable_[A-Za-z0-9_-]+$/.test(value.supabasePublishableKey || '') ||
        value.tableName !== 'tasks') {
      throw new Error('Database setup is not finished. Add the project URL and public publishable key to config.json.');
    }
    return { ...value, supabaseUrl: value.supabaseUrl.replace(/\/$/, '') };
  }

  async function api(method, query = '', body) {
    const response = await fetchWithTimeout(`${config.supabaseUrl}/rest/v1/${config.tableName}${query}`, {
      method,
      headers: {
        apikey: config.supabasePublishableKey,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: 'no-store',
    });
    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      const hint = response.status === 401 || response.status === 403
        ? ' Check the public API key and database access policies.' : '';
      throw new Error(`Request failed (${response.status}). ${details.message || 'Please try again.'}${hint}`);
    }
    if (response.status === 204) return [];
    return response.json();
  }

  function render() {
    const fragment = document.createDocumentFragment();
    for (const task of tasks) {
      const item = byId('task-template').content.firstElementChild.cloneNode(true);
      item.dataset.id = String(task.id);
      item.classList.toggle('is-completed', task.completed);
      item.querySelector('.task-title').textContent = task.title;
      item.querySelector('.task-description').textContent = task.description || '';
      item.querySelector('.task-status').textContent = task.completed ? 'Completed' : 'Incomplete';
      item.querySelector('.task-number').textContent = `#${task.id}`;
      const toggle = item.querySelector('.toggle-task');
      toggle.textContent = task.completed ? 'Mark incomplete' : 'Mark complete';
      toggle.setAttribute('aria-pressed', String(task.completed));
      fragment.append(item);
    }
    list.replaceChildren(fragment);
    byId('task-count').textContent = String(tasks.length);
    const completed = tasks.filter((task) => task.completed).length;
    byId('task-summary').textContent = `${tasks.length - completed} to do · ${completed} completed`;
    byId('empty-state').hidden = tasks.length !== 0;
  }

  function resetForm() {
    editingId = null;
    form.reset();
    titleInput.setCustomValidity('');
    byId('form-heading').textContent = 'New task';
    byId('task-submit').textContent = 'Add task +';
    byId('cancel-edit').hidden = true;
  }

  async function run(action) {
    if (busy) return;
    setBusy(true);
    try { await action(); }
    catch (error) { message(error.message, 'error'); }
    finally { setBusy(false); }
  }

  async function loadTasks() {
    if (!config) config = await loadConfig();
    const result = await api('GET', '?select=*&order=id.desc');
    tasks = result;
    render();
    message('Your task list is up to date.');
  }

  titleInput.addEventListener('input', () => titleInput.setCustomValidity(''));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.setCustomValidity('Please enter a task title.');
      titleInput.reportValidity();
      return;
    }
    run(async () => {
      const isEditing = editingId !== null;
      const payload = { title, description: descriptionInput.value.trim() };
      if (!isEditing) payload.completed = false;
      const query = isEditing ? `?id=eq.${encodeURIComponent(editingId)}` : '';
      const result = await api(isEditing ? 'PATCH' : 'POST', query, payload);
      if (!Array.isArray(result) || !result.length) throw new Error('The task was not saved. It may have been removed, or write access may be missing. Refresh and try again.');
      const saved = result[0];
      tasks = isEditing ? tasks.map((task) => String(task.id) === editingId ? saved : task) : [saved, ...tasks];
      resetForm();
      render();
      message(isEditing ? 'Task updated.' : 'Task added. One step closer!');
    });
  });

  list.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    const item = button && button.closest('.task-item');
    if (!item || busy) return;
    const id = item.dataset.id;
    const task = tasks.find((entry) => String(entry.id) === id);
    if (!task) return;
    if (button.classList.contains('edit-task')) {
      run(async () => {
        const result = await api('GET', `?id=eq.${encodeURIComponent(id)}&select=*`);
        if (!result.length) throw new Error('This task no longer exists. Refresh the task list.');
        const latest = result[0];
        editingId = id;
        titleInput.value = latest.title;
        descriptionInput.value = latest.description || '';
        titleInput.setCustomValidity('');
        byId('form-heading').textContent = 'Edit task';
        byId('task-submit').textContent = 'Save changes';
        byId('cancel-edit').hidden = false;
        message('Editing task. Save your changes or cancel.');
      }).then(() => { if (editingId === id) titleInput.focus(); });
    } else if (button.classList.contains('toggle-task')) {
      run(async () => {
        const result = await api('PATCH', `?id=eq.${encodeURIComponent(id)}`, { completed: !task.completed });
        if (!result.length) throw new Error('Task not updated. Refresh the list and check database write access.');
        tasks = tasks.map((entry) => String(entry.id) === id ? result[0] : entry);
        render();
        message(result[0].completed ? 'Task completed. Nicely done!' : 'Task marked incomplete.');
      });
    } else if (button.classList.contains('delete-task')) {
      if (!window.confirm('Delete this task? This cannot be undone.')) return;
      run(async () => {
        const result = await api('DELETE', `?id=eq.${encodeURIComponent(id)}`);
        if (!result.length) throw new Error('Task not deleted. Refresh the list and check database delete access.');
        tasks = tasks.filter((entry) => String(entry.id) !== id);
        if (editingId === id) resetForm();
        render();
        message('Task deleted.');
      });
    }
  });

  byId('cancel-edit').addEventListener('click', () => { resetForm(); message('Edit cancelled.'); });
  refreshButton.addEventListener('click', () => run(loadTasks));
  run(loadTasks);
})();
