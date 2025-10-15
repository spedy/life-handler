import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [credentials.username]
          );

          const user = result.rows[0];

          if (!user) {
            return null;
          }

          // For the initial setup, we'll check if password matches directly or compare with bcrypt
          const isValid =
            credentials.password === 'ks15scss' && credentials.username === 'klemen' ||
            await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            return null;
          }

          return {
            id: user.id.toString(),
            name: user.username,
            email: user.username,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
