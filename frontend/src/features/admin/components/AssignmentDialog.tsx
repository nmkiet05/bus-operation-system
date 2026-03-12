"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Trip } from "@/features/admin/types";
import { AssignmentForm } from "./AssignmentForm";

interface AssignmentDialogProps {
    trip: Trip | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AssignmentDialog({
    trip,
    open,
    onOpenChange,
}: AssignmentDialogProps) {
    if (!trip) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white">
                <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <DialogTitle className="text-lg text-brand-blue">
                        Điều phối Chuyến xe
                    </DialogTitle>
                    <DialogDescription className="hidden">
                        Cửa sổ thông tin điều phối tài xế và phương tiện.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-4">
                    <AssignmentForm
                        trip={trip}
                        onSuccess={() => onOpenChange(false)}
                        onCancel={() => onOpenChange(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
