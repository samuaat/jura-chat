"use client";

import { useEffect, useState } from "react";

interface StreamingTextProps {
    text: string;
    speed?: number;
    className?: string;
    startDelay?: number;
}

export function StreamingText({
    text,
    speed = 30,
    className = "",
    startDelay = 0,
}: StreamingTextProps) {
    const [displayedText, setDisplayedText] = useState("");
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setStarted(true);
        }, startDelay);
        return () => clearTimeout(timeout);
    }, [startDelay]);

    useEffect(() => {
        if (!started) return;

        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex <= text.length) {
                setDisplayedText(text.slice(0, currentIndex));
                currentIndex++;
            } else {
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed, started]);

    return <span className={className}>{displayedText}</span>;
}
