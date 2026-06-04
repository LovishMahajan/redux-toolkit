// src/scripts/demo.ts
import { store } from '../app/store';
import { userLoggedIn, userLoggedOut, selectIsAuthenticated } from '../features/auth/authSlice';
import { itemAddedToCart, selectCartItemCount, selectCartSubtotalCents } from '../features/cart/cartSlice';

const unsubscribe = store.subscribe(() => {
  console.log('[state]', JSON.stringify(store.getState()));
});

store.dispatch(
  userLoggedIn({
    user: { id: 'u_1', email: 'dev@acme.io', displayName: 'Dev' },
    at: new Date().toISOString(), // Date → ISO string at the boundary; no Date enters state
  }),
);
store.dispatch(itemAddedToCart({ productId: 'p_1', name: 'Pro plan', unitPriceCents: 4900 }));
store.dispatch(itemAddedToCart({ productId: 'p_1', name: 'Pro plan', unitPriceCents: 4900, quantity: 2 }));

console.log('authenticated?', selectIsAuthenticated(store.getState())); // true
console.log('items:', selectCartItemCount(store.getState()));           // 3
console.log('subtotal cents:', selectCartSubtotalCents(store.getState())); // 14700

store.dispatch(userLoggedOut());
unsubscribe();