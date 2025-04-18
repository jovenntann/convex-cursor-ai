"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function TelegramLinkModal() {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const hasTelegramId = useQuery(api.users.hasTelegramId);

  // Generate the Telegram deep link with user ID
  const telegramLink = user 
    ? `https://t.me/BudgetTrackrBot?start=${user.id}`
    : "";

  useEffect(() => {
    // Only show the modal if the user is authenticated and doesn't have a Telegram ID
    if (user && hasTelegramId === false) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [user, hasTelegramId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link your Telegram account</DialogTitle>
          <DialogDescription>
            Connect your Telegram account to upload receipts and get spending summaries directly from your phone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <p>
            Linking your Telegram account makes it easy to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Quickly upload receipts by sending photos</li>
            <li>Receive daily and monthly spending summaries</li>
            <li>Get real-time budget alerts</li>
          </ul>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Maybe later
          </Button>
          <Button variant="default" asChild>
            <a href={telegramLink} target="_blank" rel="noopener noreferrer">
              Connect Telegram
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 