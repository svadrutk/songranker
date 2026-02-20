"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut, Send } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useFeedback } from "./FeedbackProvider";
import { cn } from "@/lib/utils";
import { useNavigationStore } from "@/lib/store";

export function Navbar() {
  const { user, signOut, openAuthModal } = useAuth();
  const { openFeedback } = useFeedback();
  const { view, navigateToCreate, navigateToAnalytics, navigateToMyRankings, setSidebarCollapsed } = useNavigationStore();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleLogoClick = () => {
    navigateToCreate();
    setSidebarCollapsed(true);
  };

  // Use dark logo as default during SSR to avoid hydration mismatch
  const logoSrc = mounted && resolvedTheme === "dark" ? "/logo/logo.svg" : "/logo/logo-dark.svg";

  return (
    <nav className="w-full border-b bg-background/95 backdrop-blur-md sticky top-0 z-[60]">
      <div className="w-full px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-12">
          <button
            type="button"
            onClick={handleLogoClick}
            className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity"
          >
            <Image
              src={logoSrc}
              alt="Chorusboard Logo"
              width={36}
              height={36}
              className="h-9 w-9 md:h-12 md:w-12"
            />
            <h1 className="font-mono text-xl md:text-3xl font-bold tracking-tighter lowercase shrink-0">
              chorusboard
            </h1>
          </button>

          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => navigateToCreate()}
              className={cn(
                "font-mono text-sm uppercase font-black tracking-widest transition-colors",
                view === "create" ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              Create
            </button>
            <button
              onClick={() => navigateToMyRankings(false)}
              className={cn(
                "font-mono text-sm uppercase font-black tracking-widest transition-colors",
                view === "my_rankings" ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              My Rankings
            </button>
            <button
              onClick={() => navigateToAnalytics()}
              className={cn(
                "font-mono text-sm uppercase font-black tracking-widest transition-colors",
                view === "analytics" ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              Stats
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={openFeedback}
            className="font-mono text-[10px] md:text-xs uppercase font-bold tracking-widest text-muted-foreground hover:text-primary gap-2"
          >
            <Send className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Feedback</span>
          </Button>

          {user ? (
            <>
              <span className="hidden md:block font-mono text-base font-medium tracking-tight">
                {user.email}
              </span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => signOut()}
                className="h-9 w-9 md:h-10 md:w-10 hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label="Logout"
              >
                <LogOut className="h-4.5 w-4.5 md:h-5 md:w-5" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-1 md:gap-3">
              <Button 
                variant="ghost" 
                onClick={() => openAuthModal("login")}
                className="font-mono text-[10px] md:text-sm uppercase font-bold tracking-wider px-3 md:px-6 h-9 md:h-10"
              >
                Login
              </Button>
              <Button 
                onClick={() => openAuthModal("signup")}
                className="font-mono text-[10px] md:text-sm uppercase font-bold tracking-wider px-3 md:px-6 h-9 md:h-10 shrink-0"
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
