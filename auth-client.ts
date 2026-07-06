'use client';

import { createAuthClient } from 'better-auth/client';
import type { Auth } from './auth';

export const { useSession, signIn, signUp, signOut } = createAuthClient<Auth>();