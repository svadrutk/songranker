"use client";

import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Image from "next/image";

export function Navbar() {
  const { user, signOut, openAuthModal } = useAuth();

  return (
    <nav className="w-full border-b bg-background/95 backdrop-blur-md sticky top-0 z-40">
      <div className="w-full px-6 md:px-8 h-16 md:h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-black dark:bg-transparent">
            <Image
              src="/logo/logo.svg"
              alt="Chorusboard Logo"
              width={36}
              height={36}
              className="h-8 w-8 md:h-10 md:w-10"
            />
          </div>
          <h1 className="font-mono text-2xl md:text-3xl font-bold tracking-tighter lowercase">
            chorusboard
          </h1>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <span className="hidden md:block font-mono text-base font-medium tracking-tight">
                {user.email}
              </span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => signOut()}
                className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => openAuthModal("login")}
                className="font-mono text-sm uppercase font-bold tracking-wider px-6 h-10"
              >
                Login
              </Button>
              <Button 
                onClick={() => openAuthModal("signup")}
                className="font-mono text-sm uppercase font-bold tracking-wider px-6 h-10"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
