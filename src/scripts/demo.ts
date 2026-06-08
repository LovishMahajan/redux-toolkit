// src/scripts/demo.ts
import { store } from '../app';
import { userLoggedIn, userLoggedOut, selectIsAuthenticated } from '../features/auth';
import { itemAddedToCart, selectCartItemCount, selectCartSubtotalCents } from '../features/cart';
import { productsUpserted, selectAffordableProducts, selectProductCount } from '../features/catalog';

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

// Phase 3 smoke test — catalog slice wired and memoized selectors working.
store.dispatch(productsUpserted([
  { id: 'sku_1', name: 'Lamp',  category: 'home', priceCents: 3500, updatedAt: '2026-06-01T00:00:00.000Z' },
  { id: 'sku_2', name: 'Chair', category: 'home', priceCents: 9900, updatedAt: '2026-06-02T00:00:00.000Z' },
  { id: 'sku_3', name: 'Mug',   category: 'home', priceCents: 1200, updatedAt: '2026-06-03T00:00:00.000Z' },
]));
console.log('products:', selectProductCount(store.getState()));                // 3
console.log('affordable:', selectAffordableProducts(store.getState()).length); // 2 (Lamp + Mug)

store.dispatch(userLoggedOut());
unsubscribe();