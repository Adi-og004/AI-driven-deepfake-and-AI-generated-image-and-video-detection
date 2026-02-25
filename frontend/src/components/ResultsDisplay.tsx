"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ShieldCheck, Fingerprint, Info, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

interface ResultsDisplayProps {
    score: number; // 0.0 to 1.0 (Fake Probability)
    status: string;
    report: string | null;
}

export default function ResultsDisplay({ score, status, report }: ResultsDisplayProps) {
    // Determine risk level based on the fake probability score (0.0 to 1.0)
    const isFake = score > 0.65;
    const isHighRisk = score > 0.85;
    const percentage = Math.round(score * 100);

    // Parse Gemini report into bullet points
    const bullets = report
        ? report.split("\n").filter(b => b.trim().startsWith("-") || b.trim().startsWith("*")).map(b => b.replace(/^[-*]\s*/, ''))
        : [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
            {/* Probability Gauge Widget */}
            <div className="col-span-1 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-8 flex flex-col items-center justify-center relative overflow-hidden">

                {/* Ambient glow based on risk */}
                <div className={clsx(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-[60px] opacity-40 mix-blend-screen",
                    isFake ? "bg-red-500" : "bg-emerald-500"
                )} />

                <h3 className="text-gray-400 font-medium tracking-wide text-sm uppercase mb-6 z-10">AI Likelihood</h3>

                {/* SVG Circular Gauge */}
                <div className="relative w-48 h-48 flex items-center justify-center z-10">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="96" cy="96" r="80"
                            fill="none"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="12"
                        />
                        <motion.circle
                            cx="96" cy="96" r="80"
                            fill="none"
                            stroke={isHighRisk ? "#ef4444" : isFake ? "#f97316" : "#10b981"}
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 80}
                            initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                            animate={{ strokeDashoffset: (2 * Math.PI * 80) * (1 - score) }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-5xl font-bold text-white tracking-tighter shadow-sm">{percentage}%</span>
                        <span className={clsx("text-sm font-medium mt-1 uppercase", isFake ? "text-red-400" : "text-emerald-400")}>
                            {status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Forensic Report Card */}
            <div className="col-span-1 md:col-span-2 rounded-3xl bg-black/20 border border-white/10 backdrop-blur-2xl p-8 shadow-2xl relative">
                <div className="flex items-center space-x-3 mb-6 border-b border-white/10 pb-4">
                    <Fingerprint className="w-6 h-6 text-indigo-400" />
                    <h2 className="text-2xl font-semibold text-white tracking-tight">Forensic Analysis</h2>
                </div>

                {report ? (
                    <div className="space-y-4">
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {/* Highlight specific keywords using a basic parser */}
                            {bullets.length > 0 ? (
                                <ul className="space-y-3">
                                    {bullets.map((bullet, i) => {
                                        const lc = bullet.toLowerCase();
                                        const isError = lc.includes("anatomical") || lc.includes("extra finger") || lc.includes("limb") || lc.includes("unnatural") || lc.includes("inconsistency") || lc.includes("warp");

                                        return (
                                            <li key={i} className="flex items-start text-gray-300 text-[15px] leading-relaxed">
                                                <span className="mr-3 mt-0.5 mt-1 flex-shrink-0">
                                                    {isError ? (
                                                        <AlertTriangle className="w-4 h-4 text-red-400/80" />
                                                    ) : (
                                                        <Info className="w-4 h-4 text-indigo-400/80" />
                                                    )}
                                                </span>
                                                <span dangerouslySetInnerHTML={{
                                                    __html: bullet.replace(/(anatomical errors|unnatural skin textures|lighting inconsistencies|background warping|extra fingers|fused limbs)/gi, match => `<strong class="text-red-400 bg-red-400/10 px-1 rounded">${match}</strong>`)
                                                }} />
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <span className="text-gray-300">{report}</span>
                            )}
                        </p>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 min-h-[200px] text-gray-500">
                        <ShieldCheck className="w-12 h-12 text-emerald-500/50" />
                        <p>No high-risk AI artifacts detected. The media appears consistent with authentic recordings.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
