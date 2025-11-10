import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "Admin Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Check if this is the admin email
        const adminEmail = process.env.ADMIN_EMAIL;
        if (credentials.email !== adminEmail) {
          return null;
        }

        // Find or create admin user
        let admin = await prisma.admin.findUnique({
          where: { email: credentials.email }
        });

        if (!admin) {
          // Create admin if doesn't exist
          const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 10);
          admin = await prisma.admin.create({
            data: {
              email: credentials.email,
              password: hashedPassword,
              name: "Admin"
            }
          });
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, admin.password);
        if (!isValid) {
          return null;
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          image: admin.image
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        // Check if this is the admin email
        const adminEmail = process.env.ADMIN_EMAIL;
        if (user.email !== adminEmail) {
          return false; // Reject non-admin users
        }

        // Find or create admin with Google
        let admin = await prisma.admin.findUnique({
          where: { email: user.email! }
        });

        if (!admin) {
          // Create admin with Google OAuth
          const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 10);
          admin = await prisma.admin.create({
            data: {
              email: user.email!,
              name: user.name,
              googleId: account.providerAccountId,
              password: hashedPassword,
              image: user.image
            }
          });
        } else if (!admin.googleId) {
          // Link Google account to existing admin
          await prisma.admin.update({
            where: { id: admin.id },
            data: {
              googleId: account.providerAccountId,
              image: user.image,
              name: user.name
            }
          });
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET
};
