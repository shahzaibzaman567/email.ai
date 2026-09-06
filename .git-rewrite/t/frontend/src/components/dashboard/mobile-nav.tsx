"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden flex items-center">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="mr-2">
        <Menu className="size-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          
          {/* Drawer */}
          <div className="relative z-50 flex w-64 flex-col bg-card h-full animate-in slide-in-from-left-full duration-300 shadow-xl">
            <div className="absolute right-2 top-2">
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            {/* We pass a prop or just render the standard Sidebar. Since Sidebar has "hidden md:flex", we need to pass a prop or override the classes. */}
            <Sidebar mobile />
          </div>
        </div>
      )}
    </div>
  );
}
