import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { User } from "@/lib/models/Auth";

interface ProfileCardProps {
  user: User;
}

export function ProfileCard({ user }: Readonly<ProfileCardProps>) {
  const name = user.userName ?? "Account";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your account details.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar className="size-16">
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
      </CardContent>
    </Card>
  );
}
