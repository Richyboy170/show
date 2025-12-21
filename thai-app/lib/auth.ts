import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { isAdminEmail } from "./admin-utils";
import {
  getAdminByEmail,
  createAdmin,
  updateAdmin,
  getUserByEmail,
  createUser,
  updateUser,
  Admin,
  User,
} from "./firestore";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture
        };
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

        // Check if this email is in the admin list (from .env)
        if (!isAdminEmail(credentials.email)) {
          return null;
        }

        // Find or create admin user
        let admin = await getAdminByEmail(credentials.email);

        if (!admin) {
          // Create admin if doesn't exist
          const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 10);
          admin = await createAdmin({
            email: credentials.email,
            password: hashedPassword,
            name: "Admin"
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
      try {
        if (account?.provider === "google") {
          if (!user.email) {
            console.error("No email provided from Google OAuth");
            return false;
          }

          // Check if this email is in the admin list (from .env)
          if (isAdminEmail(user.email)) {
            // Admin login
            let admin = await getAdminByEmail(user.email);

            if (!admin) {
              // Create admin with Google OAuth
              const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 10);
              admin = await createAdmin({
                email: user.email,
                name: user.name || "Admin",
                googleId: account.providerAccountId,
                password: hashedPassword,
                image: user.image
              });
              console.log("Created new admin via Google OAuth:", admin.email);
            } else {
              // Update existing admin with latest Google info
              await updateAdmin(admin.id, {
                googleId: account.providerAccountId,
                image: user.image,
                name: user.name || admin.name
              });
              console.log("Updated existing admin:", admin.email);
            }

            // Set user.id to admin.id for JWT
            user.id = admin.id;
          } else {
            // Regular user login
            let regularUser = await getUserByEmail(user.email);

            if (!regularUser) {
              // Create regular user
              regularUser = await createUser({
                email: user.email,
                name: user.name || "User",
                googleId: account.providerAccountId,
                image: user.image
              });
              console.log("Created new user via Google OAuth:", regularUser.email);
            } else {
              // Update existing user with latest Google info
              await updateUser(regularUser.id, {
                googleId: account.providerAccountId,
                image: user.image,
                name: user.name || regularUser.name
              });
              console.log("Updated existing user:", regularUser.email);
            }

            // Set user.id to regularUser.id for JWT
            user.id = regularUser.id;
          }
        }
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to home page after sign in for fresh data load
      // This ensures users see their personalized content from database
      if (url.startsWith("/auth/signin") || url.startsWith("/api/auth")) {
        return baseUrl;
      }

      // If the URL is a relative path, prepend baseUrl
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // If URL is from the same domain, allow it
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default to home page (baseUrl)
      return baseUrl;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub!;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user) {
        token.sub = user.id;
        token.email = user.email!;
        token.name = user.name || "";
        token.picture = user.image || null;

        // Check if user email is in admin list (from .env)
        token.isAdmin = isAdminEmail(user.email);
      }

      // Handle updates or refresh admin status
      if (trigger === "update" || !user) {
        // Refresh user data from database and check admin status
        if (isAdminEmail(token.email)) {
          // Admin user
          const admin = await getAdminByEmail(token.email as string);
          if (admin) {
            token.name = admin.name || "";
            token.picture = admin.image || null;
            token.isAdmin = true;
          }
        } else {
          // Regular user
          const regularUser = await getUserByEmail(token.email as string);
          if (regularUser) {
            token.name = regularUser.name || "";
            token.picture = regularUser.image || null;
            token.isAdmin = false;
          }
        }
      }

      return token;
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  useSecureCookies: process.env.NODE_ENV === "production",
};
