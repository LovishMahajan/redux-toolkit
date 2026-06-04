// src/features/auth/__tests__/authThunks.test.ts
import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { authReducer, loginUser } from '..';

const setup = () => configureStore({ reducer: { auth: authReducer } });

describe('loginUser lifecycle', () => {
  it('anonymous → authenticating → authenticated (fulfilled)', async () => {
    const store = setup();
    const p = store.dispatch(loginUser({ email: 'a@acme.io', password: 'correct' }));
    expect(store.getState().auth.status).toBe('authenticating'); // pending applies synchronously
    await p;
    const s = store.getState().auth;
    expect(s.status).toBe('authenticated');
    if (s.status === 'authenticated') expect(s.user.email).toBe('a@acme.io');
  });

  it('bad credentials → typed error state (rejected with rejectValue)', async () => {
    const store = setup();
    await store.dispatch(loginUser({ email: 'a@acme.io', password: 'wrong' }));
    const s = store.getState().auth;
    expect(s.status).toBe('error');
    if (s.status === 'error') expect(s.error.code).toBe('invalid_credentials');
  });

  it('aborted login is cancellation, not failure', async () => {
    const store = setup();
    const p = store.dispatch(loginUser({ email: 'a@acme.io', password: 'correct' }));
    p.abort();
    await p;
    expect(store.getState().auth.status).toBe('anonymous'); // NOT 'error'
  });

  it('dedupes a concurrent login (condition returns false)', async () => {
    const store = setup();
    const p1 = store.dispatch(loginUser({ email: 'a@acme.io', password: 'correct' }));
    const r2 = await store.dispatch(loginUser({ email: 'b@acme.io', password: 'correct' }));
    expect(r2.meta.condition).toBe(true); // second dispatch was condition-cancelled
    await p1;
  });
});