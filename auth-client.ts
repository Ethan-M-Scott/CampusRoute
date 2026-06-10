'use client';

import { createClient } from 'better-auth/client';
import type { Auth } from './auth';

export const { useSession, signIn, signUp, signOut } = createClient<Auth>();