"use client";

import { useState } from "react";
import Image from "next/image";
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
import { login } from "@/lib/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in-up">
      <Card className="border-border/60 bg-card shadow-2xl shadow-black/40">
        <CardHeader className="text-center pb-2">
          <Image src="/logo.png" alt="Campfire" width={56} height={56} className="mx-auto mb-3 rounded-xl" />
          <CardTitle className="text-xl font-bold text-white">
            Sign in to Campfire
          </CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Enter your credentials to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            {error && (
              <div className="animate-fade-in rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="bg-[#2b2d31] border-border/60 focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Your password"
                required
                className="bg-[#2b2d31] border-border/60 focus:border-primary/50 transition-colors"
              />
            </div>
            <Button
              type="submit"
              className="w-full font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <p className="text-center text-xs text-muted-foreground/60">
              Contact your workspace admin for an invitation.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
