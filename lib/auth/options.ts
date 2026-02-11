import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

import { getUserByEmail } from '@/lib/data/user';
import { logAuthAttempt } from '@/lib/auth/audit';
import { loginSchema } from '@/lib/validation';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60,
    updateAge: 10 * 60
  },
  pages: {
    signIn: '/login'
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: '이메일', type: 'text' },
        password: { label: '비밀번호', type: 'password' },
        role: { label: '권한', type: 'text' }
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          await logAuthAttempt({
            email: (credentials as any)?.email,
            role: (credentials as any)?.role,
            success: false,
            reason: 'INVALID_PAYLOAD'
          });
          return null;
        }

        const { email, password, role } = parsed.data;

        try {
          const user = await getUserByEmail(email);
          if (!user) {
            await logAuthAttempt({ email, role, success: false, reason: 'USER_NOT_FOUND' });
            return null;
          }

          if (user.role !== role) {
            await logAuthAttempt({ email, role, success: false, reason: 'ROLE_MISMATCH', userId: user.id });
            return null;
          }

          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) {
            await logAuthAttempt({ email, role, success: false, reason: 'PASSWORD_MISMATCH', userId: user.id });
            return null;
          }

          await logAuthAttempt({ email, role, success: true, reason: 'LOGIN_SUCCESS', userId: user.id });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          } as any;
        } catch (error) {
          await logAuthAttempt({ email, role, success: false, reason: 'INTERNAL_ERROR' });
          console.error('[auth] authorize internal error', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    }
  }
};
