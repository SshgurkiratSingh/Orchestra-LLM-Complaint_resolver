import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    // 1. Citizen Mobile/OTP login (Mocked via Credentials)
    CredentialsProvider({
      id: "mobile-otp",
      name: "Mobile & OTP",
      credentials: {
        phone: { label: "Phone Number", type: "text", placeholder: "+91 9999999999" },
        otp: { label: "OTP", type: "text", placeholder: "123456" }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) {
          throw new Error("Phone and OTP are required");
        }

        // MOCK: Require OTP to be '123456' for now
        if (credentials.otp !== "123456") {
          throw new Error("Invalid OTP");
        }

        // Find or create User based on Phone number
        let user = await prisma.user.findUnique({
          where: { phone: credentials.phone }
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              phone: credentials.phone,
              role: "CITIZEN"
            }
          });
        }

        return { id: user.id, phone: user.phone, role: user.role };
      }
    }),

    // 2. Administrator Login (Email/Password)
    CredentialsProvider({
      id: "admin-login",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@loksetu.in" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || user.password !== credentials.password) { // Using simple check, hash in production
          throw new Error("Invalid admin credentials");
        }

        if (user.role !== "ADMIN" && user.role !== "DEPARTMENT_HEAD") {
          throw new Error("Unauthorized access");
        }

        return { id: user.id, email: user.email, role: user.role };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.phone = (user as any).phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = session.user || {};
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).phone = token.phone;
      }
      return session;
    }
  }
};
