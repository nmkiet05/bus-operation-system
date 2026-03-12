"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScrollAnimationProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    direction?: "up" | "down" | "left" | "right";
}

export default function ScrollAnimation({
    children,
    className,
    delay = 0,
    direction = "up",
}: ScrollAnimationProps) {
    const getInitial = () => {
        switch (direction) {
            case "up": return { opacity: 0, y: 50 };
            case "down": return { opacity: 0, y: -50 };
            case "left": return { opacity: 0, x: 50 };
            case "right": return { opacity: 0, x: -50 };
            default: return { opacity: 0, y: 50 };
        }
    };

    return (
        <motion.div
            initial={getInitial()}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: delay, ease: "easeOut" }}
            className={cn(className)}
        >
            {children}
        </motion.div>
    );
}
