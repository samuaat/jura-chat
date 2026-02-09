"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { StreamingText } from "@/components/streaming-text";
import NeuralBackground from "./neural-background";
import ScrollReveal from "./scroll-reveal";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden min-h-[90vh] flex flex-col justify-center pt-20 pb-20 lg:pt-32 lg:pb-32 bg-gray-950">

            {/* Neural Network Background */}
            <NeuralBackground />

            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen" />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* Left Column: Text & CTA */}
                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
                        <ScrollReveal>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/80 border border-gray-700 backdrop-blur-md mb-6 shadow-xl">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                <span className="text-gray-300 text-xs font-semibold tracking-wide uppercase">Kísérleti jogi AI</span>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal delay={0.1}>
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight">
                                Jogi válaszok,<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 drop-shadow-sm">
                                    másodpercek alatt.
                                </span>
                            </h1>
                        </ScrollReveal>

                        <ScrollReveal delay={0.2}>
                            <p className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl">
                                A JURA mesterséges intelligenciája segít eligazodni a magyar jogszabályok között.
                                Tedd fel a kérdésed, és kapj <span className="text-blue-300 font-medium">közérthető, releváns</span> választ.
                            </p>
                        </ScrollReveal>

                        <ScrollReveal delay={0.3} className="p-2"> {/* Added padding to container for scale effect */}
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6"> {/* Increased gap */}
                                <Link
                                    href="/chat"
                                    className="group relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-blue-900/30 transition-all hover:scale-105 hover:shadow-blue-500/25 focus:outline-none ring-offset-2 ring-offset-gray-900 focus:ring-2 focus:ring-blue-500"
                                >
                                    <span className="relative z-10 flex items-center gap-2 text-white">
                                        Kipróbálom most
                                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </span>
                                </Link>
                                <Link
                                    href="#how-it-works"
                                    className="inline-flex items-center justify-center rounded-2xl border border-gray-700 bg-gray-800/30 px-8 py-4 text-lg font-medium text-gray-300 shadow-sm transition-colors hover:bg-gray-800 hover:text-white hover:border-gray-600 backdrop-blur-sm"
                                >
                                    Hogyan működik?
                                </Link>
                            </div>
                        </ScrollReveal>
                    </div>

                    {/* Right Column: Chat Preview */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ delay: 0.4, duration: 0.8, type: "spring", bounce: 0.2 }}
                        className="relative hidden lg:block"
                    >
                        {/* Glow behind chat */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-3xl rounded-[3rem] -z-10" />

                        <div className="relative rounded-[2rem] border border-gray-700/50 bg-gray-900/80 backdrop-blur-xl p-5 shadow-2xl ring-1 ring-white/5">
                            <div className="mb-6 flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex space-x-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                                    </div>
                                </div>
                                <div className="text-xs font-mono text-gray-500 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    JURA AI v1.0
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* User Message */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1, duration: 0.5 }}
                                    className="flex gap-4 justify-end"
                                >
                                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-600 to-indigo-600 p-4 text-sm text-white shadow-lg shadow-blue-900/20">
                                        <p className="font-medium">Milyen jogaim vannak, ha az albérlőm nem fizet?</p>
                                    </div>
                                </motion.div>

                                {/* AI Response */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.5, duration: 0.5 }}
                                    className="flex gap-4 items-start"
                                >
                                    <div className="mt-1 h-8 w-8 flex-none rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 flex items-center justify-center shadow-lg">
                                        <span className="font-bold text-white text-xs">J</span>
                                    </div>
                                    <div className="space-y-3 max-w-[90%]">
                                        <div className="rounded-2xl rounded-tl-sm bg-gray-800/50 border border-gray-700/50 p-4 shadow-sm text-gray-200 text-sm leading-relaxed">
                                            <StreamingText
                                                text="A Ptk. és a Lakástörvény alapján először írásban kell felszólítanod a bérlőt a fizetésre. Ha a megadott határidőre sem fizet, felmondhatod a szerződést."
                                                speed={30}
                                                startDelay={1800}
                                            />
                                        </div>

                                        {/* Disclaimer Pill */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 5.5, duration: 0.5 }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Ez nem jogi tanács.
                                        </motion.div>
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
