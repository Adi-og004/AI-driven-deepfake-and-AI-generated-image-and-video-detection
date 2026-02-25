"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileImage, FileVideo, X } from "lucide-react";
import clsx from "clsx";

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    isAnalyzing: boolean;
}

export default function FileUpload({ onFileSelect, isAnalyzing }: FileUploadProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [fileType, setFileType] = useState<"image" | "video" | null>(null);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (!file) return;

            const type = file.type.startsWith("video/") ? "video" : "image";
            setFileType(type);
            setPreview(URL.createObjectURL(file));
            onFileSelect(file);
        },
        [onFileSelect]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".jpeg", ".jpg", ".png", ".webp"],
            "video/*": [".mp4", ".mov", ".avi"],
        },
        maxFiles: 1,
        disabled: isAnalyzing,
    });

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        setFileType(null);
        // Resetting parent state could be done via callback; kept simple here
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div
                {...getRootProps()}
                className={clsx(
                    "relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-md cursor-pointer group hover:bg-black/60",
                    isDragActive ? "border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.3)]" : "border-white/20",
                    preview ? "min-h-[400px]" : "min-h-[300px]",
                    isAnalyzing ? "pointer-events-none" : ""
                )}
            >
                <input {...getInputProps()} />

                <AnimatePresence mode="wait">
                    {!preview ? (
                        <motion.div
                            key="upload-prompt"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center text-center space-y-4"
                        >
                            <div className="p-4 rounded-full bg-white/5 group-hover:bg-indigo-500/20 transition-colors">
                                <UploadCloud className="w-12 h-12 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">Drag & Drop Media</h3>
                                <p className="text-gray-400 mt-2 text-sm">
                                    Upload an image or video to analyze for AI generation.
                                </p>
                                <div className="mt-6 flex items-center justify-center space-x-4 text-xs font-mono text-gray-500">
                                    <span className="flex items-center"><FileImage className="w-4 h-4 mr-1" /> Images (JPG, PNG)</span>
                                    <span className="flex items-center"><FileVideo className="w-4 h-4 mr-1" /> Videos (MP4, MOV)</span>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 w-full h-full"
                        >
                            {fileType === "image" ? (
                                <img src={preview} alt="Preview" className="w-full h-full object-contain bg-black/50" />
                            ) : (
                                <video src={preview} className="w-full h-full object-contain bg-black/50" controls={false} autoPlay loop muted />
                            )}

                            {!isAnalyzing && (
                                <button
                                    onClick={clearFile}
                                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-red-500/80 rounded-full text-white backdrop-blur-md transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}

                            {/* Laser Scanning Animation */}
                            {isAnalyzing && (
                                <div className="absolute inset-0 overflow-hidden rounded-3xl z-10 pointer-events-none">
                                    <div className="absolute inset-0 bg-indigo-900/20 backdrop-blur-[2px]" />
                                    <motion.div
                                        className="absolute top-0 left-0 w-full h-[4px] bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,1)] z-20"
                                        animate={{
                                            top: ["0%", "100%", "0%"],
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "linear",
                                        }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center z-30">
                                        <span className="px-4 py-2 bg-black/80 rounded-full text-cyan-400 font-mono text-sm uppercase tracking-widest border border-cyan-500/30">
                                            Analyzing Media Data...
                                        </span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
