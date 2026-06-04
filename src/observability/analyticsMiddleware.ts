// src/observability/analyticsMiddleware.ts
import { type Middleware, isAction } from '@reduxjs/toolkit';
import { sink } from './sink';
import { scrub } from './scrub';

const ANALYTICS_MAP: Record<string, string> = {
  'auth/loginUser/fulfilled': 'user_logged_in',
  'cart/itemAddedToCart': 'add_to_cart',
  'cart/cartCleared': 'cart_cleared',
};

export const analyticsMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action);                       // reducer runs first
  if (isAction(action) && ANALYTICS_MAP[action.type]) {
    const payload = 'payload' in action ? action.payload : undefined;
    sink.analytics.push({
      name: ANALYTICS_MAP[action.type]!,
      props: scrub(payload ?? {}) as Record<string, unknown>,  // scrub at the boundary
      ts: new Date().toISOString(),
    });
  }
  return result;
};