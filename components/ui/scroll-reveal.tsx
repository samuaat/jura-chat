"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ScrollRevealProps {
    children: ReactNode;
    width?: "fit-content" | "100%";
    delay?: number;
    className?: string; // Add className prop
}

export default function ScrollReveal({ children, width = "fit-content", delay = 0, className = "" }: ScrollRevealProps) {
    return (
        <div style={{ width }} className={`${className} overflow-hidden`}> {/* Added overflow-hidden to prevent scrollbar flicker */}
            <motion.div
                variants={{
                    hidden: { opacity: 0, y: 30 }, // Reduced distance to 30px
                    visible: { opacity: 1, y: 0 },
                }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }} // Trigger slightly before element is in view
                transition={{ duration: 0.6, delay: delay, ease: "easeOut" }} // Smoother ease
            >
                {children}
            </motion.div>
        </div>
    );
}
