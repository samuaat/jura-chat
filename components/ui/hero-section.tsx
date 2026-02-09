"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { StreamingText } from "@/components/streaming-text";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-32">
            {/* Background Glow Effect */}
            <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 opacity-20 dark:opacity-10 blur-[100px] bg-gradient-to-b from-blue-400 to-transparent pointer-events-none" />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* Left Column: Text & CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                            className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary"
                        >
                            Kísérleti jogi AI-projekt
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-foreground"
                        >
                            JURA <span className="text-muted-foreground font-light">Chat</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="text-xl sm:text-2xl text-muted-foreground leading-relaxed max-w-2xl"
                        >
                            A mesterséges intelligencia segít eligazodni a magyar jog útvesztőjében.
                            <span className="block mt-2 text-foreground font-medium">Gyors tájékozódás, közérthető válaszok.</span>
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
                        >
                            <Link
                                href="/chat"
                                className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                Belépés a chatbe
                            </Link>
                            <Link
                                href="#how-it-works"
                                className="inline-flex items-center justify-center rounded-2xl border border-input bg-background px-8 py-4 text-lg font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                                Hogyan működik?
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Right Column: Chat Preview */}
                    <motion.div
                        initial={{ opacity: 0, x: 50, rotate: -2 }}
                        animate={{ opacity: 1, x: 0, rotate: 0 }}
                        transition={{ delay: 0.4, duration: 0.8, type: "spring", bounce: 0.2 }}
                        className="relative hidden lg:block"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-purple-500/30 blur-3xl opacity-30 -z-10 rounded-full" />

                        <div className="relative rounded-3xl border border-border/50 bg-background/50 backdrop-blur-xl p-4 shadow-2xl ring-1 ring-white/10">
                            <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground px-2">
                                <span className="font-semibold tracking-wide">ÉLŐ DEMÓ</span>
                                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500 uppercase">
                                    Béta
                                </span>
                            </div>

                            <div className="space-y-4 rounded-2xl bg-card/80 p-5 shadow-inner border border-border/50">
                                {/* User Message */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1, duration: 0.5 }}
                                    className="flex gap-3 justify-end"
                                >
                                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-muted p-4 text-sm text-foreground shadow-sm">
                                        <p className="font-medium">Miben tud segíteni a JURA a mai ügyemben?</p>
                                    </div>
                                    <div className="mt-auto h-8 w-8 flex-none rounded-full bg-muted border border-border" />
                                </motion.div>

                                {/* AI Response */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.5, duration: 0.5 }}
                                    className="flex gap-3"
                                >
                                    <div className="mt-auto h-8 w-8 flex-none rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs">J</div>
                                    <div className="space-y-2 max-w-[90%]">
                                        <div className="p-1">
                                            <p className="font-medium text-sm leading-relaxed text-foreground">
                                                <StreamingText
                                                    text="A JURA kísérleti jogi AI-asszisztens, amely segít a releváns szakaszok és jogintézmények gyors megtalálásában."
                                                    speed={25}
                                                    startDelay={1800}
                                                />
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-border bg-background/50 p-3 text-[11px] text-muted-foreground">
                                            <StreamingText
                                                text="Fontos: a válaszok nem minősülnek jogi tanácsadásnak, és nem helyettesítik ügyvéd véleményét."
                                                speed={15}
                                                startDelay={4500}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
