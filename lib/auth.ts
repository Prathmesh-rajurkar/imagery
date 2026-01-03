import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// import { dbConnect } from "./db";
import bcrypt from "bcryptjs";
import { supabase } from "@/utils/supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email_or_username: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email_or_username || credentials?.password) {
          throw new Error("Missing Email or Password");
        }

        try {
          //   await dbConnect();
          //   const user = await User.findOne({ email: credentials.email });
          const user = await supabase
            .from("users")
            .select("*")
            .eq("email", credentials.email_or_username)
            .or(`username.eq.${credentials.email_or_username}`)
            .single()
            .then((res) => res.data);

          if (!user) {
            throw new Error("No User Found");
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!isValid) {
            throw new Error("Invalid Password");
          }

          return {
            id: user._id.toString(),
            email: user.email,
          };
        } catch (error) {
          throw error;
        }
      },
    }),
    
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "login/",
    error: "login/",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
