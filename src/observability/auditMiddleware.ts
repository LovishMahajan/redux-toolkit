// src/observability/auditMiddleware.ts
import { type Middleware, isAction } from "@reduxjs/toolkit";
import type { RootState } from "../app/store";
import { selectCurrentUser } from "../features/auth/authSlice";
import { sink } from "./sink";

const AUDITED = new Set([
	"auth/loginUser/fulfilled",
	"auth/userLoggedOut",
	"cart/cartCleared",
]);

export const auditMiddleware: Middleware<{}, RootState> =
	(store) => (next) => (action) => {
		const result = next(action);
		if (isAction(action) && AUDITED.has(action.type)) {
			sink.audit.push({
				action: action.type,
				userId: selectCurrentUser(store.getState())?.id ?? null,
				ts: new Date().toISOString(),
			});
		}
		return result;
	};
