// Better Auth route handler for login, logout, and session flows.
import { auth } from "../../../../../auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);