"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ServerCrash } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ResultsDisplay from "@/components/ResultsDisplay";

interface AnalysisResult {
  fake_probability: number;
  status: string;
  report: string | null;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null); // Reset previous results on new selection
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to connect to the analysis engine. Please ensure the backend server is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0f1c] text-slate-200 font-sans selection:bg-indigo-500/30">

      {/* Background aesthetics */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 flex flex-col items-center">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4 max-w-2xl"
        >
          <div className="inline-flex items-center justify-center space-x-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium tracking-widest text-emerald-400 uppercase">AI Forensics Engine</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white drop-shadow-sm">
            Detect <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Deepfakes</span> Instantly.
          </h1>
          <p className="text-gray-400 text-lg">
            Upload any image or video. Our sophisticated pipeline utilizes Vision Transformers and Google Gemini to identify manipulative AI artifacts in seconds.
          </p>
        </motion.div>

        {/* Upload Component */}
        <div className="w-full">
          <FileUpload onFileSelect={handleFileSelect} isAnalyzing={isAnalyzing} />
        </div>

        {/* Action Button */}
        {file && !result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8"
          >
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <span>Run Forensic Analysis</span>
              )}
            </button>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 px-6 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center text-red-400 max-w-2xl"
          >
            <div className="p-2 bg-red-500/20 rounded-full mr-4">
              <ServerCrash className="w-5 h-5" />
            </div>
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        {/* Results Component */}
        {result && (
          <ResultsDisplay
            score={result.fake_probability}
            status={result.status}
            report={result.report}
          />
        )}
      </div>
    </main>
  );
}
