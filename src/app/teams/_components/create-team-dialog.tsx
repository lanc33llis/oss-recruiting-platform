"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { createTeam } from "../actions";
import { PlusCircle } from "lucide-react";
import { SubmitButton } from "./submit-button";

export function CreateTeamDialog() {
  const [state, formAction] = useFormState(createTeam, {
    errors: {},
    message: "",
  });
  const [open, setOpen] = useState(false);

  const handleStateChange = useEffectEvent(() => {
    if (!state?.message) return;

    if (state.errors && Object.keys(state.errors).length > 0) {
      toast.error(state.message);
      return;
    }

    toast.success(state.message);
    setOpen(false);
  });

  useEffect(() => {
    handleStateChange();
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Team</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new team.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Team Name</Label>
            <Input id="name" name="name" placeholder="Enter team name" />
            {state?.errors?.name && (
              <p className="text-sm text-red-500">{state.errors.name[0]}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Enter team description"
            />
            {state?.errors?.description && (
              <p className="text-sm text-red-500">
                {state.errors.description[0]}
              </p>
            )}
          </div>
          <DialogFooter>
            <SubmitButton>Create Team</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
