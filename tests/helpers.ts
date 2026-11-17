import type { Page } from '@playwright/test';

/** Unique username per test run so tests don't collide in the shared DB. */
export const uniqueUsername = (prefix = 'user') =>
  `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;

// Helpers are filled in as each feature lands (see the implementation plan).

export async function register(_page: Page, _username: string): Promise<void> {
  throw new Error('register() not implemented yet (Phase 1)');
}

export async function login(_page: Page, _username: string): Promise<void> {
  throw new Error('login() not implemented yet (Phase 1)');
}

export async function createTodo(_page: Page, _title: string): Promise<void> {
  throw new Error('createTodo() not implemented yet (Phase 2)');
}

export async function addSubtask(_page: Page, _todoTitle: string, _subtask: string): Promise<void> {
  throw new Error('addSubtask() not implemented yet (Phase 6)');
}

export async function createTag(_page: Page, _name: string, _color?: string): Promise<void> {
  throw new Error('createTag() not implemented yet (Phase 7)');
}

export async function createTemplate(_page: Page, _todoTitle: string, _name: string): Promise<void> {
  throw new Error('createTemplate() not implemented yet (Phase 8)');
}
