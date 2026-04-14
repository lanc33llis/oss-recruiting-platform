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
import { editSystem } from "../actions";
import { Settings2 } from "lucide-react";
import { type systems } from "~/server/db/schema";
import { SubmitButton } from "./submit-button";

const initialState = {
  errors: {},
  message: "",
};

export function EditSystemDialog({
  system,
}: {
  system: typeof systems.$inferSelect;
}) {
  const [state, formAction] = useFormState(editSystem, initialState);
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
        <Button variant="secondary" size="sm" className="text-xs">
          <Settings2 />
          Edit System
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit System</DialogTitle>
          <DialogDescription>
            Fill in the details to edit the system.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={system.id} />
          <div className="grid gap-2">
            <Label htmlFor="name">System Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter system name"
              defaultValue={system.name}
            />
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
              defaultValue={system.description ?? ""}
            />
            {state?.errors?.description && (
              <p className="text-sm text-red-500">
                {state.errors.description[0]}
              </p>
            )}
          </div>
          <DialogFooter>
            <SubmitButton>Save Changes</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
