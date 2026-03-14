"use client";

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info } from "lucide-react";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "info";
    isLoading?: boolean;
    onConfirm: () => void;
}

/**
 * Reusable Confirm Dialog — thay thế toàn bộ window.confirm() trong dự án.
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   <ConfirmDialog open={open} onOpenChange={setOpen} title="..." description="..." onConfirm={handleConfirm} />
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Xác nhận",
    cancelLabel = "Hủy",
    variant = "warning",
    isLoading = false,
    onConfirm,
}: ConfirmDialogProps) {
    const icon =
        variant === "danger" || variant === "warning" ? (
            <AlertTriangle
                className={`h-5 w-5 ${variant === "danger" ? "text-red-500" : "text-amber-500"}`}
            />
        ) : (
            <Info className="h-5 w-5 text-blue-500" />
        );

    const btnVariant = variant === "danger" ? "destructive" : "default";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {icon}
                        {title}
                    </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-600 py-1">{description}</p>
                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        {cancelLabel}
                    </Button>
                    <Button variant={btnVariant} onClick={onConfirm} disabled={isLoading}>
                        {isLoading ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1 inline-block" />
                        ) : null}
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
