/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as chat from "../chat.js";
import type * as engine_board from "../engine/board.js";
import type * as engine_config from "../engine/config.js";
import type * as engine_engine from "../engine/engine.js";
import type * as engine_matches from "../engine/matches.js";
import type * as engine_rng from "../engine/rng.js";
import type * as engine_types from "../engine/types.js";
import type * as leaderboard from "../leaderboard.js";
import type * as sessions from "../sessions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  chat: typeof chat;
  "engine/board": typeof engine_board;
  "engine/config": typeof engine_config;
  "engine/engine": typeof engine_engine;
  "engine/matches": typeof engine_matches;
  "engine/rng": typeof engine_rng;
  "engine/types": typeof engine_types;
  leaderboard: typeof leaderboard;
  sessions: typeof sessions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
