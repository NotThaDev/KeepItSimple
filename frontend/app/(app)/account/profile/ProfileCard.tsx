"use client";

import { ImageUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  deleteProfilePicture,
  uploadProfilePicture,
} from "@/lib/models/Account";
import { profilePictureUrl, type User } from "@/lib/models/Auth";
import { RemovePictureDialog } from "./RemovePictureDialog";
import { ACCEPTED_IMAGE_TYPES, toAvatarBlob } from "./utils";

interface ProfileCardProps {
  user: User;
}

export function ProfileCard({ user }: Readonly<ProfileCardProps>) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const name = user.userName ?? "Account";
  const hasPicture = Boolean(user.pictureVersion);

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setBusy(true);
    try {
      let blob: Blob;
      try {
        blob = await toAvatarBlob(file);
      } catch {
        toast.error("Failed to read the image");
        return;
      }

      const response = await uploadProfilePicture(blob);
      if (response.error) {
        toast.error(`Failed to upload the picture: ${response.error}`);
        return;
      }
      toast.success("Picture updated");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    setBusy(true);
    try {
      const response = await deleteProfilePicture();
      if (response.error) {
        toast.error(`Failed to remove the picture: ${response.error}`);
        return;
      }
      toast.success("Picture removed");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your account details.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={profilePictureUrl(user)} alt="" />
            <AvatarFallback className="text-xl">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <dl className="grid min-w-0 flex-1 gap-2">
            <div>
              <dt className="text-sm text-muted-foreground">Username</dt>
              <dd className="truncate font-medium">{user.userName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="truncate font-medium">{user.email}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            className="hidden"
            onChange={onFileChange}
          />
          <Button
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <ImageUp />
            {hasPicture ? "Change picture" : "Upload picture"}
          </Button>
          {hasPicture && (
            <RemovePictureDialog busy={busy} onRemove={onRemove} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
