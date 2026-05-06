import { Button } from "../ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { ButtonVariant } from "./CommonTypes";

interface ConfirmationDialogContentProps {
  title: string;
  description: string;
  confirmButtonVariant?: ButtonVariant;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export function ConfirmationDialogContent({
  title,
  description,
  onConfirm,
  onCancel,
  confirmButtonVariant,
}: Readonly<ConfirmationDialogContentProps>) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </DialogClose>
        <Button onClick={onConfirm} variant={confirmButtonVariant}>
          Confirm
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
