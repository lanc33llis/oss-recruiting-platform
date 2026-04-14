"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
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
import { addSystem } from "../actions";
import { PlusCircle } from "lucide-react";

export function AddSystemDialog({ teamId }: { teamId: string }) {
  const [state, formAction] = useFormState(addSystem, {
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
        <Button variant="secondary">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add System
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add System</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new system.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="teamId" value={teamId} />
          <div className="grid gap-2">
            <Label htmlFor="name">System Name</Label>
            <Input id="name" name="name" placeholder="Enter system name" />
            {state?.errors?.name && (
              <p className="text-sm text-red-500">{state.errors.name[0]}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Enter system description"
            />
            {state?.errors?.description && (
              <p className="text-sm text-red-500">
                {state.errors.description[0]}
              </p>
            )}
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding..." : "Add System"}
    </Button>
  );
}
