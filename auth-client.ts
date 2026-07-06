'use client';

import { createAuthClient } from 'better-auth/client';

export const { useSession, signIn, signUp, signOut } = createAuthClient();