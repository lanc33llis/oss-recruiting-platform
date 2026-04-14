"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

// Type for event
export type Event = RouterOutputs["events"]["getEvents"][number];

export function EventsList() {
  const { data: user, isLoading: userLoading } =
    api.users.getCurrentUser.useQuery();
  const {
    data: events,
    isLoading,
    error,
    refetch,
  } = api.events.getEvents.useQuery(undefined, { enabled: !!user });
  const { data: joinedEvents } = api.events.getEventsByUser.useQuery(
    user ? { userId: user.id } : { userId: "" },
    { enabled: !!user },
  );
  const joinMutation = api.events.joinEvent.useMutation({
    onSuccess: () => void refetch(),
  });
  const leaveMutation = api.events.leaveEvent.useMutation({
    onSuccess: () => void refetch(),
  });
  const createMutation = api.events.createEvent.useMutation({
    onSuccess: () => {
      setDialogOpen(false);
      setForm({
        name: "",
        description: "",
        startTime: "",
        endTime: "",
        location: "",
      });
      void refetch();
    },
  });
  const updateMutation = api.events.updateEvent.useMutation({
    onSuccess: () => {
      setEditDialogOpen(false);
      setEditEventId(null);
      void refetch();
    },
  });
  const deleteMutation = api.events.deleteEvent.useMutation({
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setDeleteEventId(null);
      void refetch();
    },
  });
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

  if (userLoading || isLoading) return <div>Loading events...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const joinedSet = new Set(joinedEvents?.map((e) => e.id));

  const isTeamManager =
    user?.role === "TEAM_MANAGEMENT" || user?.role === "ADMIN";

  return (
    <div className="grid gap-4">
      {events && events.length > 0 ? (
        events.map((e: Event) => {
          const joined = joinedSet.has(e.id);
          const isAdmin = user?.role === "ADMIN";
          return (
            <Card key={e.id}>
              <CardHeader>
                <CardTitle>{e.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div>Description: {e.description}</div>
                <div>Start: {new Date(e.startTime).toLocaleString()}</div>
                <div>End: {new Date(e.endTime).toLocaleString()}</div>
                <div>Location: {e.location}</div>
                <div className="mt-2 flex gap-2">
                  {joined ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={
                        leavingId === e.id && leaveMutation.status === "pending"
                      }
                      onClick={() => {
                        setLeavingId(e.id);
                        leaveMutation.mutate({ id: e.id });
                      }}
                    >
                      {leavingId === e.id && leaveMutation.status === "pending"
                        ? "Leaving..."
                        : "Leave Event"}
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      disabled={
                        joiningId === e.id && joinMutation.status === "pending"
                      }
                      onClick={() => {
                        setJoiningId(e.id);
                        joinMutation.mutate({ id: e.id });
                      }}
                    >
                      {joiningId === e.id && joinMutation.status === "pending"
                        ? "Joining..."
                        : "Join Event"}
                    </Button>
                  )}
                  {isAdmin && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditEventId(e.id);
                          setEditForm({
                            name: e.name,
                            description: e.description ?? "",
                            startTime: new Date(e.startTime)
                              .toISOString()
                              .slice(0, 16),
                            endTime: new Date(e.endTime)
                              .toISOString()
                              .slice(0, 16),
                            location: e.location ?? "",
                          });
                          setEditDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setDeleteEventId(e.id);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={
                          deleteMutation.status === "pending" &&
                          deleteEventId === e.id
                        }
                      >
                        {deleteMutation.status === "pending" &&
                        deleteEventId === e.id
                          ? "Deleting..."
                          : "Delete"}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <div>No events found.</div>
      )}
      {isTeamManager && (
        <>
          <div className="mb-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default">Create Event</Button>
              </DialogTrigger>
              <DialogContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createMutation.mutate({
                      name: form.name,
                      description: form.description,
                      startTime: new Date(form.startTime),
                      endTime: new Date(form.endTime),
                      location: form.location,
                    });
                  }}
                  className="grid gap-3"
                >
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                  />
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    required
                  />
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startTime: e.target.value }))
                    }
                    required
                  />
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endTime: e.target.value }))
                    }
                    required
                  />
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, location: e.target.value }))
                    }
                    required
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="submit"
                      disabled={createMutation.status === "pending"}
                    >
                      {createMutation.status === "pending"
                        ? "Creating..."
                        : "Create Event"}
                    </Button>
                    <DialogClose asChild>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </DialogClose>
                  </div>
                  {createMutation.error && (
                    <div className="mt-2 text-sm text-red-500">
                      {createMutation.error.message}
                    </div>
                  )}
                </form>
              </DialogContent>
            </Dialog>
          </div>
          {/* Edit Event Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editEventId) return;
                  updateMutation.mutate({
                    id: editEventId,
                    data: {
                      name: editForm.name,
                      description: editForm.description,
                      startTime: new Date(editForm.startTime),
                      endTime: new Date(editForm.endTime),
                      location: editForm.location,
                    },
                  });
                }}
                className="grid gap-3"
              >
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, description: e.target.value }))
                  }
                  required
                />
                <Label htmlFor="edit-startTime">Start Time</Label>
                <Input
                  id="edit-startTime"
                  type="datetime-local"
                  value={editForm.startTime}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, startTime: e.target.value }))
                  }
                  required
                />
                <Label htmlFor="edit-endTime">End Time</Label>
                <Input
                  id="edit-endTime"
                  type="datetime-local"
                  value={editForm.endTime}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, endTime: e.target.value }))
                  }
                  required
                />
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, location: e.target.value }))
                  }
                  required
                />
                <div className="mt-2 flex gap-2">
                  <Button
                    type="submit"
                    disabled={updateMutation.status === "pending"}
                  >
                    {updateMutation.status === "pending"
                      ? "Saving..."
                      : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
                {updateMutation.error && (
                  <div className="mt-2 text-sm text-red-500">
                    {updateMutation.error.message}
                  </div>
                )}
              </form>
            </DialogContent>
          </Dialog>
          {/* Delete Event Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <div className="mb-4">
                Are you sure you want to delete this event?
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (deleteEventId) {
                      deleteMutation.mutate({ id: deleteEventId });
                    }
                  }}
                  disabled={deleteMutation.status === "pending"}
                >
                  {deleteMutation.status === "pending"
                    ? "Deleting..."
                    : "Delete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
              {deleteMutation.error && (
                <div className="mt-2 text-sm text-red-500">
                  {deleteMutation.error.message}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
