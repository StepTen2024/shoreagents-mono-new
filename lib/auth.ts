import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { supabase } from "@/lib/supabase"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true, // Trust localhost and other hosts
  cookies: {
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials")
        }

        // 1. Authenticate with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: credentials.email as string,
          password: credentials.password as string,
        })

        if (authError || !authData.user) {
          throw new Error("Invalid credentials")
        }

        const authUserId = authData.user.id
        const email = authData.user.email!

        // 2. Check which table this user belongs to
        // Try Management User first
        const managementUser = await prisma.management_users.findUnique({
          where: { authUserId }
        })

        if (managementUser) {
          return {
            id: authUserId,
            email: managementUser.email,
            name: managementUser.name,
            role: managementUser.role,
          }
        }

        // Try Staff User
        const staffUser = await prisma.staff_users.findUnique({
          where: { authUserId }
        })

        if (staffUser) {
          return {
            id: authUserId,
            email: staffUser.email,
            name: staffUser.name,
            role: staffUser.role,
          }
        }

        // Try Client User
        const clientUser = await prisma.client_users.findUnique({
          where: { authUserId }
        })

        if (clientUser) {
          return {
            id: authUserId,
            email: clientUser.email,
            name: clientUser.name,
            role: "CLIENT",
          }
        }

        throw new Error("User not found in any user table")
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
})

