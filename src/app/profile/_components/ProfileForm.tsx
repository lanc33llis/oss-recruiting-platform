"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { User, Mail, FileText, PhoneIcon } from "lucide-react";
import type { User as UserType } from "next-auth";
import { revalidateEmail, updateProfile } from "../actions";
import { UploadButton } from "~/app/people/_components/upload-things";
import { toast } from "sonner";

import { useRouter } from "next/navigation";
import { appConfig } from "~/config";

interface ProfileFormProps {
  user: UserType & {
    phoneNumber?: string | null;
    eidEmail?: string | null;
    major?: string | null;
    eidEmailVerified?: boolean | null;
  };
  resumeUrl?: string | null;
}

export function ProfileForm({ user, resumeUrl }: ProfileFormProps) {
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.eidEmail ?? "");
  const [number, setNumber] = useState(user.phoneNumber ?? "");
  const [major, setMajor] = useState(user.major ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [resumeFile, setResumeFile] = useState<string | null>(
    resumeUrl ?? null,
  );

  const router = useRouter();

  const handleSaveProfile = async () => {
    setIsSaving(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phoneNumber", number);
    formData.append("major", major);

    const { needsToRevalidateEmail, success, error } =
      await updateProfile(formData);

    if (!success) {
      toast.error(error ?? "Failed to update profile");
    } else {
      if (needsToRevalidateEmail) {
        toast.success(
          appConfig.identity.reverifySuccessMessage,
          {},
        );
      } else {
        toast.success("Profile updated successfully", {});
      }
    }

    setIsSaving(false);
  };

  return (
    <div className="space-y-6 pt-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="mt-1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{appConfig.identity.verifiedEmailLabel}</Label>
            <div className="relative mt-1">
              <Mail className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Phone Number</Label>
            <div className="relative mt-1">
              <PhoneIcon className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., 123-456-7890"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="major">Major</Label>
            <Input
              id="major"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="Enter your major"
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2">
            {!user.eidEmailVerified && (
              <Button
                variant="secondary"
                onClick={async () => {
                  const res = await revalidateEmail(email);

                  if (res?.error) {
                    toast.error(res.error);
                  } else {
                    toast.success(
                      appConfig.identity.verificationSentMessage,
                    );
                  }
                }}
              >
                {appConfig.pages.profile.resendVerificationLabel}
              </Button>
            )}
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving
                ? appConfig.pages.profile.savingLabel
                : appConfig.pages.profile.saveChangesLabel}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resume Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="resume">Upload Resume</Label>
            <UploadButton
              endpoint="resumeUploader"
              onClientUploadComplete={(file) => {
                toast.success("Successfully uploaded resume", {});
                void router.refresh();
                if (file && file.length > 0) {
                  setResumeFile(file[0]!.ufsUrl);
                }
              }}
            />
          </div>
          {resumeFile && (
            <div className="bg-muted flex items-center justify-between rounded-md p-3">
              <embed src={resumeFile} className="h-[600px] w-full" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
