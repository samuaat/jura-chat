"use client";

import Link from "next/link";
import {
    Briefcase,
    Home,
    ShoppingCart,
    FileText,
    AlertOctagon,
    Scale,
    CheckCircle,
    XCircle,
    HelpCircle
} from "lucide-react";
import ScrollReveal from "./scroll-reveal";

export default function Features() {
    const helpfulTopics = [
        {
            title: "Munkajogi kérdések",
            description: "Felmondás, vagy szabadságolás? Segítünk tisztázni a szabályokat és a lehetőségeidet.",
            icon: Briefcase,
            color: "blue",
        },
        {
            title: "Ingatlanügyek",
            description: "Bérleti szerződés, közös költség vagy birtokvédelem? Gyors válaszok lakásügyekben.",
            icon: Home,
            color: "emerald",
        },
        {
            title: "Fogyasztóvédelem",
            description: "Hibás termék, garancia, online vásárlás? Tudd meg, milyen jogaid vannak vásárlóként.",
            icon: ShoppingCart,
            color: "purple",
        },
        {
            title: "Szerződések",
            description: "Nem érted az apróbetűt? Segítünk értelmezni a szerződéses kötelmeket.",
            icon: FileText,
            color: "indigo",
        },
    ];

    const limitations = [
        {
            title: "Nem ügyvéd",
            description: "Ez egy AI eszköz tájékozódásra. Nem helyettesíti a szakértő jogi tanácsadást.",
            icon: XCircle,
            color: "rose",
        },
        {
            title: "Nincs képviselet",
            description: "A JURA nem tud téged képviselni bíróságon vagy hatóságok előtt.",
            icon: Scale,
            color: "rose",
        },
        {
            title: "Tévedhet",
            description: "Bár folyamatosan tanul, az AI néha pontatlan lehet. Mindig ellenőrizd a forrásokat!",
            icon: AlertOctagon,
            color: "rose",
        },
    ];

    return (
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 border-t border-gray-800/50 bg-gray-950/50 backdrop-blur-sm">

            {/* Helping Hands Section */}
            <div className="max-w-7xl mx-auto mb-32">
                <ScrollReveal width="100%">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Miben <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">segít</span> a JURA?
                        </h2>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                            A leggyakoribb mindennapi jogi helyzetekben nyújt gyors, elsődleges tájékoztatást.
                        </p>
                    </div>
                </ScrollReveal>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {helpfulTopics.map((item, index) => {
                        const colors = {
                            blue: "text-blue-400 bg-blue-500/10 border-blue-500/20 hover:border-blue-500/50",
                            emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50",
                            purple: "text-purple-400 bg-purple-500/10 border-purple-500/20 hover:border-purple-500/50",
                            indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/50",
                            rose: "text-rose-400 bg-rose-500/10 border-rose-500/20 hover:border-rose-500/50",
                        }[item.color] || "text-gray-400 bg-gray-500/10 border-gray-500/20";

                        return (
                            <ScrollReveal key={item.title} delay={index * 0.1} className="h-full">
                                <div className={`group h-full p-6 rounded-2xl border bg-gray-900/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-${item.color}-500/10 ${colors.split(' ').slice(2).join(' ')}`}>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${colors.split(' ').slice(0, 2).join(' ')}`}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                                </div>
                            </ScrollReveal>
                        );
                    })}
                </div>
            </div>

            {/* Limitations Section */}
            <div className="max-w-5xl mx-auto">
                <ScrollReveal width="100%">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Hol vannak a <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">határok</span>?
                        </h2>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                            Fontos érteni, hogy mire NEM alkalmas a rendszer, hogy biztonságosan tudd használni.
                        </p>
                    </div>
                </ScrollReveal>

                <div className="grid gap-6 md:grid-cols-3">
                    {limitations.map((item, index) => (
                        <ScrollReveal key={item.title} delay={index * 0.1} className="h-full">
                            <div className="group h-full p-6 rounded-2xl border border-rose-500/20 bg-gray-900/40 backdrop-blur-md transition-all duration-300 hover:border-rose-500/50 hover:bg-rose-950/10">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-rose-500/10 text-rose-400">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
