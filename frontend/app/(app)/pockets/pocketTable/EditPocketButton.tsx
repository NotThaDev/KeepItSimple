"use client";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { Pocket } from "@/lib/models/Pocket";
import { useState } from "react";
import { PocketDrawerContent } from "../PocketDrawerContent";
import { useRouter } from "next/navigation";

interface EditPocketButtonProps {
  pocket: Pocket;
}

export function EditPocketButton({ pocket }: Readonly<EditPocketButtonProps>) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DrawerTrigger>
      {isOpen && (
        <PocketDrawerContent
          pocket={pocket}
          onSave={() => {
            setIsOpen(false);
            router.refresh();
          }}
        />
      )}
    </Drawer>
  );
}
