/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as actions_uploadReceipt from "../actions/uploadReceipt.js";
import type * as categories from "../categories.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as receipts from "../receipts.js";
import type * as telegramBot from "../telegramBot.js";
import type * as transactions from "../transactions.js";
import type * as updateCategories from "../updateCategories.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "actions/uploadReceipt": typeof actions_uploadReceipt;
  categories: typeof categories;
  crons: typeof crons;
  http: typeof http;
  receipts: typeof receipts;
  telegramBot: typeof telegramBot;
  transactions: typeof transactions;
  updateCategories: typeof updateCategories;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
