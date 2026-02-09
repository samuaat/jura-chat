"use client";

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { type Container, type Engine } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

export default function NeuralBackground() {
    const [init, setInit] = useState(false);

    // Initialize tsparticles engine
    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = async (container?: Container) => {
        // console.log(container);
    };

    if (!init) {
        return null;
    }

    return (
        <Particles
            id="tsparticles"
            particlesLoaded={particlesLoaded}
            options={{
                autoPlay: true,
                background: {
                    color: {
                        value: "transparent",
                    },
                },
                fpsLimit: 120,
                interactivity: {
                    detectsOn: "window",
                    events: {
                        onHover: {
                            enable: true,
                            mode: "grab", // Connect mouse to nearby nodes
                        },
                        resize: {
                            enable: true,
                            delay: 0.5
                        }
                    },
                    modes: {
                        grab: {
                            distance: 200,
                            links: {
                                opacity: 0.5,
                            },
                        },
                    },
                },
                particles: {
                    color: {
                        value: ["#3b82f6", "#a855f7"], // Blue-500 & Purple-500
                    },
                    links: {
                        color: "#6366f1", // Indigo
                        distance: 150,
                        enable: true,
                        opacity: 0.3,
                        width: 1,
                    },
                    move: {
                        direction: "none",
                        enable: true,
                        outModes: {
                            default: "bounce", // Keep them inside
                        },
                        random: false,
                        speed: 0.6, // Slow movement for elegance
                        straight: false,
                        attract: {
                            enable: false,
                            rotate: {
                                x: 600,
                                y: 1200
                            }
                        }
                    },
                    number: {
                        density: {
                            enable: true,
                            // area: 800,
                        },
                        value: 40, // Low density = cleaner look
                    },
                    opacity: {
                        value: 0.6,
                        animation: {
                            enable: true,
                            speed: 0.5,
                            sync: false
                        }
                    },
                    shape: {
                        type: "circle",
                    },
                    size: {
                        value: { min: 1, max: 2 },
                    },
                },
                detectRetina: true,
                fullScreen: {
                    enable: false,
                    zIndex: -1
                }
            }}
            className="absolute inset-0 z-0 pointer-events-none"
        />
    );
}
