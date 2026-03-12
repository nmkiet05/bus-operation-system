"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useRef } from "react";

// Helper to determine depth
const getPathDepth = (path: string) => {
    if (path === "/") return 0;
    if (path.startsWith("/trips")) return 1;
    if (path.startsWith("/booking")) return 2;
    return 0; // Default
};

export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
    const pathname = usePathname();
    const prevPathRef = useRef(pathname);

    // Compare depth to determine direction
    const prevDepth = getPathDepth(prevPathRef.current);
    const currDepth = getPathDepth(pathname);
    const direction = currDepth > prevDepth ? 1 : -1;

    // Update ref only after calculating direction
    if (prevPathRef.current !== pathname) {
        prevPathRef.current = pathname;
    }

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? "100%" : "-100%",
        }),
        center: { x: 0 },
        exit: (direction: number) => ({
            x: direction > 0 ? "-100%" : "100%",
        })
    };

    return (
        <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
                key={pathname}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ ease: "easeInOut", duration: 0.5 }}
                className={className}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
