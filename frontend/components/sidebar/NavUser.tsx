"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Bell, CircleUserRound, EllipsisVertical, LogOut } from "lucide-react";
import { UnreadBadge } from "../notifications/UnreadBadge";
import { ThemeButton } from "../common/themeSelector/ThemeButton";
import { profilePictureUrl } from "@/lib/models/Auth";
import { useUserIdentityContext } from "@/stores/userIdentity";
import { useNotificationsContext } from "@/stores/notifications";

interface UserMenuContentProps {
  name: string;
  email: string;
  pictureUrl?: string;
}

function UserMenuContent({
  name,
  email,
  pictureUrl,
}: Readonly<UserMenuContentProps>) {
  const { logout } = useUserIdentityContext();
  const { unreadCount, open } = useNotificationsContext();

  return (
    <>
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center justify-between gap-2 px-1 py-1.5">
          <div className="flex items-center gap-2 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={pictureUrl} alt="" />
              <AvatarFallback className="rounded-lg">
                {name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {email}
              </span>
            </div>
          </div>
          <ThemeButton />
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem onSelect={open}>
          <Bell />
          Notifications
          <UnreadBadge count={unreadCount} variant="menu" className="ml-auto" />
          {unreadCount > 0 && (
            <span className="sr-only">({unreadCount} unread)</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account">
            <CircleUserRound />
            Account
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={logout}>
        <LogOut />
        Log out
      </DropdownMenuItem>
    </>
  );
}

interface NavUserProps {
  compact?: boolean;
}

export function NavUser({ compact = false }: Readonly<NavUserProps>) {
  const { isMobile } = useSidebar();
  const { user } = useUserIdentityContext();
  const name = user?.userName ?? "Account";
  const email = user?.email ?? "";
  const pictureUrl = profilePictureUrl(user);
  const { unreadCount } = useNotificationsContext();
  const unreadLabel =
    unreadCount > 0 ? `, ${unreadCount} unread notifications` : "";

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            className="rounded-lg"
            aria-label={`Open user menu${unreadLabel}`}
          >
            <span className="relative">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={pictureUrl} alt="" />
                <AvatarFallback className="rounded-lg">
                  {name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <UnreadBadge count={unreadCount} variant="avatar" />
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="min-w-56 rounded-lg"
          side="bottom"
          align="end"
          sideOffset={4}
        >
          <UserMenuContent name={name} email={email} pictureUrl={pictureUrl} />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              aria-label={`Open user menu${unreadLabel}`}
            >
              <span className="relative">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={pictureUrl} alt="" />
                  <AvatarFallback className="rounded-lg">
                    {name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <UnreadBadge count={unreadCount} variant="avatar" />
              </span>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <UserMenuContent name={name} email={email} pictureUrl={pictureUrl} />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
