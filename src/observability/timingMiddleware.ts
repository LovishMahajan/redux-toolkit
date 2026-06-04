// src/observability/timingMiddleware.ts
import { type Middleware, isAction } from "@reduxjs/toolkit";
import { sink } from "./sink";

export const timingMiddleware: Middleware = () => (next) => (action) => {
	if (!isAction(action)) return next(action);
	const start = performance.now();
	const result = next(action);
	sink.latency.push({ action: action.type, ms: performance.now() - start });
	return result;
};
