/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Download, FileCode, Forward, Image as ImageIcon, Video, Layout as LayoutIcon, PenTool } from "lucide-react";
import { useState, useRef } from "react";
import Logo from "./components/Logo";
import CarouselBuilder from "./components/carousel/CarouselBuilder";

export default function App() {
  const [view, setView] = useState<"studio" | "carousel">("studio");
  const [isExporting, setIsExporting] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);

  const downloadSVG = () => {
    const svgElement = document.querySelector('svg');
    if (!svgElement) return;
    
    // Create a copy and force black on white for the file
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "EL_Logo_Export.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPNG = () => {
    const svgElement = document.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 1024;
      canvas.height = 1024;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 1024, 1024);
      
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = "EL_Logo_Export.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const [isRecording, setIsRecording] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  const exportVideo = async () => {
    // Restart animation for clean capture
    setAnimationKey(prev => prev + 1);
    setIsRecording(true);

    const svgElement = document.querySelector('svg');
    if (!svgElement) return;

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const stream = canvas.captureStream(60); // 60 FPS
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000 // 5Mbps for high quality
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'EL_Logo_Animation.webm';
      a.click();
      setIsRecording(false);
    };

    recorder.start();

    // Frame capture loop
    const renderFrame = () => {
      if (recorder.state === 'inactive') return;
      
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 1024, 1024);
        URL.revokeObjectURL(url);
        requestAnimationFrame(renderFrame);
      };
      img.src = url;
    };

    renderFrame();

    // Record for 3 seconds (length of our animation)
    setTimeout(() => {
      recorder.stop();
    }, 3000);
  };

  if (view === "carousel") {
    return (
      <>
        <button 
          onClick={() => setView("studio")}
          className="fixed top-8 left-8 z-50 flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full font-sans font-bold text-[10px] uppercase tracking-widest shadow-xl"
        >
          <PenTool className="w-3 h-3" />
          Switch to Identity
        </button>
        <CarouselBuilder />
      </>
    );
  }

  if (isExporting) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-8">
        <button 
          onClick={() => setIsExporting(false)}
          className="fixed top-8 left-8 text-[10px] uppercase tracking-widest font-bold border-b border-black pb-1"
          disabled={isRecording}
        >
          &larr; Back to Studio
        </button>
        
        <div className="w-full max-w-xl aspect-square bg-white border border-black/5 shadow-2xl flex items-center justify-center relative group" key={animationKey}>
          <Logo size={400} color="#000000" />
          {isRecording && (
            <div className="absolute inset-0 bg-black/5 flex items-center justify-center backdrop-blur-sm z-50">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Capturing Frame Sequence...</span>
              </div>
            </div>
          )}
          <div className="absolute inset-0 border-4 border-black/10 pointer-events-none" />
          <div className="absolute top-4 left-4 text-[8px] font-mono opacity-20 uppercase tracking-tighter">Export Artifact 3.0 // 1024x1024 // 60FPS</div>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-6">
          <ExportButton icon={<FileCode />} label="Download SVG" onClick={downloadSVG} sub="Scalable Vector" disabled={isRecording} />
          <ExportButton icon={<ImageIcon />} label="Download PNG" onClick={downloadPNG} sub="1024px High-Res" disabled={isRecording} />
          <ExportButton icon={<Video />} label="Export Animation" onClick={exportVideo} sub=".WEBM (Video Master)" disabled={isRecording} />
          <div className="flex flex-col justify-center">
            <span className="text-[9px] opacity-40 uppercase tracking-[0.2em] font-bold max-w-[120px]">Convert .webm to GIF/MP4 via ezgif.com</span>
          </div>
        </div>

        <p className="mt-12 text-[10px] uppercase tracking-[0.4em] opacity-30 font-bold max-w-xs text-center leading-loose">
          Assets are rendered as pure high-contrast artifacts for production use.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-serif selection:bg-[#5A5A40] selection:text-white">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#5A5A40]/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#A89F8E]/10 rounded-full blur-[140px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Logo size={40} color="#5A5A40" />
          <span className="text-[10px] uppercase tracking-[0.4em] font-sans font-bold opacity-40">Identity</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setView("carousel")}
            className="flex items-center gap-3 bg-white border border-[#5A5A40]/20 text-[#5A5A40] px-6 py-3 rounded-full font-sans font-bold text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all group"
          >
            <LayoutIcon className="w-3 h-3 group-hover:scale-110 transition-transform" />
            Carousel Builder
          </button>
          <button 
            onClick={() => setIsExporting(true)}
            className="flex items-center gap-3 bg-[#5A5A40] text-white px-6 py-3 rounded-full font-sans font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-[#4A4A30] transition-colors group"
          >
            <Forward className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            Export Assets
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 py-16 flex flex-col items-center justify-center min-h-[75vh]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative px-20 py-20 bg-white rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(90,90,64,0.1)]"
        >
          <Logo size={400} color="#5A5A40" className="relative z-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#5A5A40]/5 rounded-full blur-3xl -z-10" />
        </motion.div>

        <div className="mt-16 text-center max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="text-7xl md:text-9xl font-light tracking-tighter mb-10 text-[#2C2C24]"
          >
            Organic <span className="italic font-serif serif text-[#5A5A40]">Legacy</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs md:text-sm font-sans font-medium opacity-50 max-w-lg mx-auto italic"
          >
            Refining the geometry of memory. A balanced horizontal synthesis of wisdom and form.
          </motion.p>
        </div>
      </main>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-40 grid grid-cols-1 md:grid-cols-3 gap-24 border-t border-[#5A5A40]/5">
        <Feature
          title="Balanced Split"
          description="A precise horizontal distribution where the 'E' ear and 'L' profile occupy equal visual weight and territory."
        />
        <Feature
          title="Internal Purity"
          description="Geometric lines intersected with surgical precision, ensuring an uninterrupted outer silhouette from every angle."
        />
        <Feature
          title="Monolithic DNA"
          description="Characters height-aligned and width-balanced, resulting in a singular, iconic symbol of enduring strength."
        />
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-8 py-20 border-t border-[#5A5A40]/10 flex flex-col md:flex-row justify-between items-center gap-12 text-[10px] tracking-widest opacity-40 font-bold font-sans uppercase">
        <div className="flex items-center gap-4">
           <Logo size={30} color="#5A5A40" className="opacity-40" />
           <p>&copy; 2026 EL Brand Systems</p>
        </div>
        <div className="flex gap-10">
          <span>Global Identity</span>
          <span>Crafted in Studio</span>
        </div>
      </footer>
    </div>
  );
}

function ExportButton({ icon, label, onClick, sub, disabled = false }: { icon: any, label: string, onClick: () => void, sub: string, disabled?: boolean }) {
  return (
    <button 
      onClick={disabled ? undefined : onClick}
      className={`group flex items-center gap-4 p-6 bg-white border border-black/5 rounded-2xl hover:border-black/20 hover:shadow-xl transition-all text-left ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1">{label}</div>
        <div className="text-[9px] opacity-40 uppercase tracking-tighter">{sub}</div>
      </div>
    </button>
  );
}

function Feature({ title, description }: { title: string, description: string }) {
  return (
    <div className="text-center group">
      <h3 className="text-xs uppercase tracking-[0.3em] font-bold mb-6 text-[#2C2C24] font-sans group-hover:text-[#5A5A40] transition-colors">{title}</h3>
      <p className="text-sm font-serif leading-relaxed text-[#5A5A40]/70 italic">
        {description}
      </p>
    </div>
  );
}






