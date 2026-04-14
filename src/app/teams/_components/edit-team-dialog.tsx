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
import { editTeam } from "../actions";
import { Settings2Icon } from "lucide-react";
import { type teams } from "~/server/db/schema";

export function EditTeamDialog({ team }: { team: typeof teams.$inferSelect }) {
  const [state, formAction] = useFormState(editTeam, {
    errors: {},
    message: "",
  });
  const [open, setOpen] = useState(false);

  const handleStateChange = useEffectEvent(() => {
    if (!state) return;

    if (state.errors && Object.keys(state.errors).length > 0) {
      return;
    }

    if (!state.message) return;

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
          <Settings2Icon className="h-4 w-4" />
          Edit Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Fill in the details to edit the team.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={team.id} />
          <div className="grid gap-2">
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter team name"
              defaultValue={team.name}
            />
            {state?.errors?.name && (
              <p className="text-sm text-red-500">{state.errors.name}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Enter team description"
              defaultValue={team.description ?? ""}
            />
            {state?.errors?.description && (
              <p className="text-sm text-red-500">{state.errors.description}</p>
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
      {pending ? "Saving..." : "Save Changes"}
    </Button>
  );
}
