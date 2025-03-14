import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./db";
import { compare } from "bcrypt";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

export const authOptions = {
  adapter: PrismaAdapter(db),
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "jsmith@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Ensure credentials exist
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find the user by email
        const existingUser = await db.user.findUnique({
          where: { email: credentials.email },
        });

        // If user does not exist, return null
        if (!existingUser) {
          return null;
        }

        // Compare the password hash with the entered password
        const isPasswordValid = await compare(
          credentials.password,
          existingUser.password
        );

        // If password is invalid, return null
        if (!isPasswordValid) {
          return null;
        }

        // Return the user object if login is successful
        return {
          id: existingUser.id.toString(), // Ensure the ID is a string
          username: existingUser.username,
          email: existingUser.email,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      // Persist the username and user data to the token
      if (user) {
        token.username = user.username;
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      // Attach the username from the token to the session object
      if (session.user) {
        session.user.username = token.username as string;
      }
      return session;
    },
  },
};
