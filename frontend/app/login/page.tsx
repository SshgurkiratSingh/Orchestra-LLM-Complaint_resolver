"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Building, Smartphone, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Citizen Login State
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  // Admin Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleCitizenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("mobile-otp", {
        phone,
        otp,
        redirect: false,
      });

      console.log("signIn response:", res);

      if (res?.error) {
        setError(res.error);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Login catch error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfficialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("admin-login", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-lg border-indigo-100 dark:border-indigo-900 dark:bg-slate-900">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <ShieldIcon />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            LOKSETU Access
          </CardTitle>
          <CardDescription className="dark:text-slate-400 text-sm">
            Secure entry to the civic grievance network
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <Tabs defaultValue="citizen" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-slate-100 dark:bg-slate-800">
              <TabsTrigger
                value="citizen"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm text-xs sm:text-sm min-h-[44px]"
              >
                <Smartphone className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Citizen (OTP)</span>
                <span className="xs:hidden">Citizen</span>
              </TabsTrigger>
              <TabsTrigger
                value="official"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm text-xs sm:text-sm min-h-[44px]"
              >
                <Building className="h-4 w-4 mr-1 sm:mr-2" />
                Official
              </TabsTrigger>
            </TabsList>

            <TabsContent value="citizen">
              <form onSubmit={handleCitizenLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="dark:text-slate-300 text-sm">Mobile Number</Label>
                  <Input
                    id="phone"
                    placeholder="+91 9999999999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400 min-h-[44px] text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="dark:text-slate-300 text-sm">One Time Password (OTP)</Label>
                  <Input
                    id="otp"
                    placeholder="Enter 123456 for demo"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400 min-h-[44px] text-base"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleCitizenLogin}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white mt-6 min-h-[48px]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Authenticating...</>
                  ) : "Login with OTP"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="official">
              <form onSubmit={handleOfficialLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="dark:text-slate-300 text-sm">Official Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@loksetu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400 min-h-[44px] text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="dark:text-slate-300 text-sm">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400 min-h-[44px] text-base"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white mt-6 min-h-[48px]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Authenticating...</>
                  ) : "Sign in to Dashboard"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
