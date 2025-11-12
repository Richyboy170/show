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
        const adminEmail = process.env.ADMIN_EMAIL;

        // Check if this is the admin email
        if (user.email === adminEmail) {
          // Admin login
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
        } else {
          // Regular user login
          let regularUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });

          if (!regularUser) {
            // Create regular user
            regularUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                googleId: account.providerAccountId,
                image: user.image
              }
            });
          }
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // If the URL is a relative path, prepend baseUrl
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // If URL is from the same domain, allow it
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default to baseUrl
      return baseUrl;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;

        // Check if user is admin
        const adminEmail = process.env.ADMIN_EMAIL;
        token.isAdmin = user.email === adminEmail;
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
