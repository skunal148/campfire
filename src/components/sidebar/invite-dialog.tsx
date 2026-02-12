"use client";

import { useState } from "react";
import { UserPlus, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteUser } from "@/lib/actions/invite";

export function InviteDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setEmail("");
    setDisplayName("");
    setPassword("");
    setError(null);
    setSuccess(null);
    setCopied(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await inviteUser(email, displayName, password);
      setSuccess({ email, password });
    } catch (err: any) {
      setError(err.message ?? "Failed to invite user");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!success) return;
    await navigator.clipboard.writeText(
      `Email: ${success.email}\nPassword: ${success.password}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <button
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-[#3f4147] hover:text-foreground"
          title="Invite people"
        >
          <UserPlus className="h-4 w-4" />
          Invite people
        </button>
      </DialogTrigger>
      <DialogContent className="border-border bg-[#1a1d21] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Invite a new member</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create an account for them. Share the credentials so they can sign in.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-md border border-green-800 bg-green-950/30 p-4">
              <p className="mb-2 text-sm font-medium text-green-400">
                Account created successfully!
              </p>
              <div className="space-y-1 text-sm text-foreground">
                <p>
                  <span className="text-muted-foreground">Email:</span> {success.email}
                </p>
                <p>
                  <span className="text-muted-foreground">Password:</span> {success.password}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy credentials"}
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  reset();
                }}
              >
                Invite another
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="invite-name">Display Name</Label>
              <Input
                id="invite-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-password">Password</Label>
              <Input
                id="invite-password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Temporary password"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account & invite"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
