/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Settings2, Download, Palette, Type, Layers, Save, Check, Layout } from "lucide-react";
import JSZip from "jszip";
import { toPng, toJpeg, toCanvas } from "html-to-image";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { useRef } from "react";
import ElementBox from "./ElementBox";
import Logo from "../Logo";

const SLIDE_SIZE = 1080; // Instagram Resolution
const GRID_SIZE = 60; // Size of each element box in px

const PRINCIPLES = [
  { symbol: "No", name: "Not Okay", subline: "This is not okay.", color: "#FF3B30", number: 102, mass: "259.10", electrons: "2,8,18,32,32,8,2" },
  { symbol: "Us", name: "Community", subline: "Not maximizing profits.", color: "#34C759", number: 120, mass: "302.2", electrons: "2,8,18,32,32,18,8,2" },
  { symbol: "Rh", name: "Honesty", subline: "Radical honesty.", color: "#5856D6", number: 121, mass: "305.1", electrons: "2,8,18,32,32,21,8,2" },
  { symbol: "Ya", name: "Yes And", subline: "Constellation thinking.", color: "#FF9500", number: 122, mass: "308.5", electrons: "2,8,18,32,32,22,8,2" },
];

export default function CarouselBuilder() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [colorPop, setColorPop] = useState(PRINCIPLES[0].color);
  const [activePrinciple, setActivePrinciple] = useState(PRINCIPLES[0]);
  const [slide1Text, setSlide1Text] = useState("THE CATCH-22");
  const [slide2Text, setSlide2Text] = useState("MAXIMIZING PROFIT VS COMMUNITY");
  const [hashtags, setHashtags] = useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [appTheme, setAppTheme] = useState<"theme1" | "theme2" | "theme3" | "theme4">("theme1");
  const [bgTexture, setBgTexture] = useState<"solid" | "dots" | "grid">("solid");
  const [elementShape, setElementShape] = useState<"square" | "rounded" | "circle">("square");
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "4:5" | "9:16">("1:1");
  const [showWatermark, setShowWatermark] = useState(true);
  const [exportMode, setExportMode] = useState<"motion" | "still_png" | "still_jpg">("motion");
  const [exportProgress, setExportProgress] = useState(0);
  const [manualProgress, setManualProgress] = useState<number | null>(null);
  const [isExportingLogo, setIsExportingLogo] = useState(false);
  const logoExportRef = useRef<HTMLDivElement>(null);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem("elephant_carousel_data");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setSlide1Text(data.slide1Text || "THE CATCH-22");
        setSlide2Text(data.slide2Text || "MAXIMIZING PROFIT VS COMMUNITY");
        setHashtags(data.hashtags || {});
        setColorPop(data.colorPop || PRINCIPLES[0].color);
        setIsDarkMode(data.isDarkMode || false);
        setAppTheme(data.appTheme || "theme1");
        setBgTexture(data.bgTexture || "solid");
        setElementShape(data.elementShape || "square");
        const principle = PRINCIPLES.find(p => p.symbol === data.activePrincipleSymbol);
        if (principle) setActivePrinciple(principle);
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    }
  }, []);

  const saveToLocal = () => {
    const data = {
      slide1Text,
      slide2Text,
      hashtags,
      colorPop,
      isDarkMode,
      appTheme,
      bgTexture,
      elementShape,
      activePrincipleSymbol: activePrinciple.symbol
    };
    localStorage.setItem("elephant_carousel_data", JSON.stringify(data));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const totalSlides = 4;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

  const handlePrincipleChange = (p: typeof PRINCIPLES[0]) => {
    setActivePrinciple(p);
    setColorPop(p.color);
  };

  const exportCarousel = async () => {
    let exportHeight = 1080;
    if (aspectRatio === '4:5') exportHeight = 1350;
    if (aspectRatio === '9:16') exportHeight = 1920;

    try {
      console.log(`Export started using ${exportMode} mode...`);
      setIsExporting(true);
      setExportProgress(0);

      let selectedCodec = '';
      if (exportMode === "motion") {
        const codecs = [
          'avc1.42E01E', // Baseline
          'avc1.4D401E', // Main
          'avc1.64001E', // High
          'vp09.00.10.08' // VP9 fallback
        ];
        
        for (const codec of codecs) {
          const result = await VideoEncoder.isConfigSupported({
            codec: codec,
            width: 1080,
            height: exportHeight,
            bitrate: 4_000_000,
            framerate: 30
          });
          if (result.supported) {
            selectedCodec = codec;
            break;
          }
        }

        if (!selectedCodec && window.VideoEncoder) {
          alert("Motion export codec not found. Switching to Stills (PNG).");
          setExportMode("still_png");
          return;
        }
      }
      
      const zip = new JSZip();
      const folder = zip.folder(`${activePrinciple.name}_insta_assets${isDarkMode ? '_dm' : ''}`);
      
      for (let i = 0; i < totalSlides; i++) {
        console.log(`Processing Slide ${i+1}/${totalSlides}...`);
        setCurrentSlide(i);
        setExportProgress((i / totalSlides) * 100);
        
        // Wait for slide transition
        await new Promise(r => setTimeout(r, 800));

        const slideElement = document.getElementById('export-frame');
        if (!(slideElement instanceof HTMLElement)) continue;

        const scaleRatio = 1080 / slideElement.offsetWidth;
        const captureOptions = { 
          pixelRatio: 1, 
          cacheBust: true,
          width: 1080,
          height: exportHeight,
          style: {
            transform: `scale(${scaleRatio})`,
            transformOrigin: 'top left',
            width: `${slideElement.offsetWidth}px`,
            height: `${slideElement.offsetHeight}px`
          },
          backgroundColor: isDarkMode ? '#050505' : '#ffffff' // Avoid dark mode bugs with transparent spaces
        };

        if (exportMode.startsWith("still") || i < 2) {
          // Final frame capture for stills
          setManualProgress(1);
          console.log(`Waiting for Slide ${i+1} animation to settle...`);
          // Wait significantly longer (5s) for all motion, logic, and rendering to reach absolute zero state.
          await new Promise(r => setTimeout(r, 5000)); 
          
          const slideElement = document.getElementById('export-frame');
          if (slideElement instanceof HTMLElement) {
            
            const isJpg = exportMode === "still_jpg";
            const dataUrl = isJpg 
                ? await toJpeg(slideElement, { ...captureOptions, quality: 1.0 })
                : await toPng(slideElement, captureOptions);
            const ext = isJpg ? 'jpg' : 'png';
            
            folder?.file(`slide_${i+1}${isDarkMode ? '_dm' : ''}.${ext}`, dataUrl.split(',')[1], {base64: true});
          }
          setManualProgress(null);
        } else {
          // Motion export
          const fps = 30;
          const durationSec = 3;
          const frameCount = fps * durationSec;
          
          const muxer = new Muxer({
            target: new ArrayBufferTarget(),
            video: {
              codec: selectedCodec.startsWith('avc1') ? 'avc' : 'vp9',
              width: 1080,
              height: exportHeight
            },
            fastStart: 'in-memory'
          });

          const encoder = new VideoEncoder({
            output: (chunk, metadata) => muxer.addVideoChunk(chunk, metadata),
            error: (e) => console.error("Encoder Error:", e)
          });

          encoder.configure({
            codec: selectedCodec,
            width: 1080,
            height: exportHeight,
            bitrate: 4_000_000,
            framerate: fps
          });

          for (let f = 0; f <= frameCount; f++) {
            const p = f / frameCount;
            setManualProgress(p);
            setExportProgress(((i + (p * 0.95)) / totalSlides) * 100);
            
            await new Promise(r => requestAnimationFrame(r));
            await new Promise(r => setTimeout(r, 30)); 

            const canvasFrame = await toCanvas(slideElement, captureOptions);

            const videoFrame = new VideoFrame(canvasFrame, { 
              timestamp: (f * 1000000) / fps 
            });
            encoder.encode(videoFrame);
            videoFrame.close();
          }
          
          await encoder.flush();
          muxer.finalize();
          
          const { buffer } = muxer.target as ArrayBufferTarget;
          folder?.file(`slide_${i+1}_motion${isDarkMode ? '_dm' : ''}.mp4`, buffer);
          setManualProgress(null);
        }
      }
      
      setExportProgress(100);
      const content = await zip.generateAsync({type:"blob"});
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${activePrinciple.name}_insta_kit${isDarkMode ? '_dm' : ''}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please check the browser console for specific errors.");
    } finally {
      setIsExporting(false);
      setManualProgress(null);
      setExportProgress(0);
    }
  };

  const exportLogo = async (format: 'png' | 'jpg') => {
    if (!logoExportRef.current) return;
    try {
      setIsExportingLogo(true);
      
      // Short delay to ensure React commits the DOM for the offscreen node
      await new Promise(r => setTimeout(r, 100));

      const captureOptions = { 
        pixelRatio: 3, 
        cacheBust: true,
        width: 1080,
        height: 1080,
        ...(format === 'jpg' ? { backgroundColor: isDarkMode ? '#050505' : '#ffffff' } : {})
      };

      const dataUrl = format === 'jpg' 
        ? await toJpeg(logoExportRef.current, { ...captureOptions, quality: 1.0 })
        : await toPng(logoExportRef.current, captureOptions);
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `ELEPHANT_Logo_1x1_Mark_${isDarkMode ? 'Dark' : 'Light'}.${format}`;
      link.click();
    } catch (error) {
      console.error("Logo export failed:", error);
      alert("Logo export failed. Please check the browser console.");
    } finally {
      setIsExportingLogo(false);
    }
  };

  const getFontSize = (text: string) => {
    const cleanText = text.replace(/\{|\}/g, '');
    if (cleanText.length > 100) return 'text-xl md:text-2xl';
    if (cleanText.length > 60) return 'text-2xl md:text-3xl';
    if (cleanText.length > 30) return 'text-3xl md:text-4xl';
    return 'text-4xl md:text-5xl';
  };

  const getThemeHeadlineClasses = (theme: string) => {
    switch (theme) {
      case 'theme2':
        return 'leading-none flex flex-wrap justify-center items-center';
      case 'theme3':
        return `font-mono uppercase font-normal leading-tight tracking-tight ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`;
      case 'theme4':
        return `font-black uppercase tracking-tighter leading-[0.8] ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'} scale-y-110`;
      case 'theme1':
      default:
        return `font-serif italic leading-tight ${isDarkMode ? 'text-zinc-700' : 'text-zinc-800'}`;
    }
  };

  const getThemeContainerClasses = (theme: string) => {
    if (theme === 'theme2') return 'flex flex-col items-center gap-4';
    if (theme === 'theme4') return 'flex flex-col items-center gap-2';
    return 'space-y-6';
  };

  const renderHighlightedText = (text: string, color: string) => {
    const parts = text.split(/(\{.*?\})/g);
    return parts.map((part, i) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        const content = part.slice(1, -1);
        if (appTheme === 'theme2') {
          return (
            <span key={i} style={{ backgroundColor: color }} className="text-white px-3 md:px-4 py-1 mx-1 inline-block uppercase font-sans font-black tracking-tighter italic">
              {content}
            </span>
          );
        }
        if (appTheme === 'theme3') {
          return (
            <span key={i} style={{ backgroundColor: color }} className="text-white px-2 py-0.5 mx-1 inline-block font-mono tracking-tight shadow-[4px_4px_0_0_rgba(0,0,0,1)] border border-black">
              {content}
            </span>
          );
        }
        if (appTheme === 'theme4') {
          return (
            <span key={i} style={{ color }} className="underline decoration-8 underline-offset-8">
              {content}
            </span>
          );
        }
        return (
          <span key={i} style={{ color }}>
            {content}
          </span>
        );
      }
      // Non-highlighted text
      if (appTheme === 'theme2') {
        const words = part.split(/\s+/);
        return (
          <span key={i} className="inline-block leading-[1.3]">
            {words.map((word, wi) => word ? (
              <span key={`${i}-${wi}`} className={`px-3 md:px-4 py-1 inline-block uppercase font-sans font-black tracking-tighter italic ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'} mx-[2px] mb-2`}>
                {word}
              </span>
            ) : null)}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F0F0F0]">
      {/* Editor Panel */}
      <div className="w-full lg:w-96 bg-white border-r border-black/5 p-8 overflow-y-auto z-30 shadow-xl">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold italic">E</div>
          <h2 className="text-xs uppercase tracking-[0.3em] font-bold">Carousel Creator</h2>
        </div>

        <section className="space-y-8">
          <div>
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40 mb-4">
              <Palette className="w-3 h-3" /> Theme Color
            </label>
            <div className="flex flex-wrap gap-3">
              {["#FF3B30", "#34C759", "#5856D6", "#FF9500", "#007AFF", "#000000"].map((c) => (
                <button
                  key={c}
                  onClick={() => setColorPop(c)}
                  className={`w-10 h-10 rounded-full border-2 transition-transform active:scale-95 ${colorPop === c ? 'border-black scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input 
                type="color" 
                value={colorPop} 
                onChange={(e) => setColorPop(e.target.value)}
                className="w-10 h-10 rounded-full border-none cursor-pointer bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40 mb-4">
              <Layers className="w-3 h-3" /> active Principle
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {PRINCIPLES.map((p) => (
                <button
                  key={p.symbol}
                  onClick={() => handlePrincipleChange(p)}
                  className={`p-4 border text-left transition-all ${activePrinciple.symbol === p.symbol ? 'border-black bg-black text-white shadow-lg' : 'border-black/5 hover:border-black/20'}`}
                >
                  <div className="text-xl font-bold font-mono tracking-tighter">{p.symbol}</div>
                  <div className="text-[8px] uppercase tracking-widest font-bold opacity-60 mt-1">{p.name}</div>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => exportLogo("png")}
                disabled={isExportingLogo}
                className="flex-1 py-3 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-all border border-black/10 hover:border-black/30 hover:bg-black/5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> Logo PNG
              </button>
              <button
                onClick={() => exportLogo("jpg")}
                disabled={isExportingLogo}
                className="flex-1 py-3 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-all border border-black/10 hover:border-black/30 hover:bg-black/5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> Logo JPG
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40 mb-4">
              <Type className="w-3 h-3" /> Typography Theme
            </label>
            <div className="flex p-1 bg-zinc-100 rounded-xl mb-4 overflow-hidden">
              <button
                onClick={() => setAppTheme("theme1")}
                className={`flex-1 py-3 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-all ${appTheme === "theme1" ? 'bg-white shadow-sm text-black' : 'text-zinc-400 hover:text-black'}`}
              >
                1. Editorial
              </button>
              <button
                onClick={() => setAppTheme("theme2")}
                className={`flex-1 py-3 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-all ${appTheme === "theme2" ? 'bg-white shadow-sm text-black' : 'text-zinc-400 hover:text-black'}`}
              >
                2. Kruger
              </button>
              <button
                onClick={() => setAppTheme("theme3")}
                className={`flex-1 py-3 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-all font-mono ${appTheme === "theme3" ? 'bg-white shadow-sm text-black' : 'text-zinc-400 hover:text-black'}`}
              >
                3. Technical
              </button>
              <button
                onClick={() => setAppTheme("theme4")}
                className={`flex-1 py-3 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-all ${appTheme === "theme4" ? 'bg-white shadow-sm text-black' : 'text-zinc-400 hover:text-black'}`}
              >
                4. Brutal
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40 mb-4">
              <Layers className="w-3 h-3" /> Background Texture
            </label>
            <div className="flex p-1 bg-zinc-100 rounded-xl mb-4 overflow-hidden">
              <button
                onClick={() => setBgTexture("solid")}
                className={`flex-1 py-3 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-all ${bgTexture === "solid" ? 'bg-white shadow-sm text-black' : 'text-zinc-400 hover:text-black'}`}
              >
                Solid
              </button>
              <button
                onClick={() => setBgTexture("dots")}
                className={`flex-1 py-3 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-all ${bgTexture === "dots" ? 'bg-white shadow-sm text-black' : 'text-zinc-400 hover:text-black'}`}
              >
                Dots
              </button>
              <button
                onClick={() => setBgTexture("grid")}
                className={`flex-1 py-3 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-all ${bgTexture === "grid" ? 'bg-white shadow-sm text-black' : 'text-zinc-400 hover:text-black'}`}
              >
                Grid
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40 mb-4">
              <Type className="w-3 h-3" /> Element Shape
            </label>
            <div className="flex p-1 bg-zinc-100 rounded-xl mb-4 overflow-hidden">
              <button
                onClick={() => setElementShape("square")}
                className={`flex-1 py-3 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-all ${elementShape === "square" ? 'bg-white shadow-sm text-black' : 'text-zinc-400 hover:text-black'}`}
              >
                Square
              </button>
              <button
                onClick={() => setElementShape("rounded")}
                className={`flex-1 py-3 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-all ${elementShape === "rounded" ? 'bg-white shadow-sm text-black' : 'text-zinc-400 hover:text-black'}`}
              >
                Rounded
              </button>
              <button
                onClick={() => setElementShape("circle")}
                className={`flex-1 py-3 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-all ${elementShape === "circle" ? 'bg-white shadow-sm text-black' : 'text-zinc-400 hover:text-black'}`}
              >
                Circle
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40 mb-4">
              <Layout className="w-3 h-3" /> Aspect Ratio
            </label>
            <div className="flex p-1 bg-zinc-100 rounded-xl mb-4 overflow-hidden">
              <button
                onClick={() => setAspectRatio("1:1")}
                className={`flex-1 py-3 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-all ${aspectRatio === "1:1" ? 'bg-white shadow-sm text-black' : 'text-zinc-400 hover:text-black'}`}
              >
                1:1 (Post)
              </button>
              <button
                onClick={() => setAspectRatio("4:5")}
                className={`flex-1 py-3 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-all ${aspectRatio === "4:5" ? 'bg-white shadow-sm text-black' : 'text-zinc-400 hover:text-black'}`}
              >
                4:5 (Portrait)
              </button>
              <button
                onClick={() => setAspectRatio("9:16")}
                className={`flex-1 py-3 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-all ${aspectRatio === "9:16" ? 'bg-white shadow-sm text-black' : 'text-zinc-400 hover:text-black'}`}
              >
                9:16 (Story)
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40 mb-4">
              <Type className="w-3 h-3" /> Slide 1: Callout
            </label>
            <textarea
              value={slide1Text}
              onChange={(e) => setSlide1Text(e.target.value)}
              className="w-full p-4 border border-black/5 rounded-xl font-serif text-sm italic resize-none focus:outline-none focus:border-black/20"
              rows={3}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40 mb-4">
              <Type className="w-3 h-3" /> Slide 2: Issue
            </label>
            <textarea
              value={slide2Text}
              onChange={(e) => setSlide2Text(e.target.value)}
              className="w-full p-4 border border-black/5 rounded-xl font-serif text-sm italic resize-none focus:outline-none focus:border-black/20"
              rows={3}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40 mb-4">
              <Type className="w-3 h-3" /> Slide 3: Hashtag
            </label>
            <input
              type="text"
              value={hashtags[activePrinciple.symbol] || `#thisis${activePrinciple.name.toLowerCase().replace(/\s+/g, '')}`}
              onChange={(e) => setHashtags({...hashtags, [activePrinciple.symbol]: e.target.value})}
              className="w-full p-4 border border-black/5 rounded-xl font-mono text-sm focus:outline-none focus:border-black/20"
            />
          </div>
        </section>

        <div className="flex flex-col gap-4 mt-12">
          {/* Output Configurations */}
          <div className="p-4 bg-white border border-zinc-100 shadow-sm rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Dark Mode</label>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-black' : 'bg-black/10'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Watermark Logo</label>
              <button 
                onClick={() => setShowWatermark(!showWatermark)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${showWatermark ? 'bg-black' : 'bg-black/10'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${showWatermark ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
          <div className="flex p-1 bg-zinc-100 rounded-xl">
            <button 
              onClick={() => setExportMode("motion")}
              className={`flex-1 py-2 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-all ${exportMode === "motion" ? 'bg-white shadow-sm text-black' : 'text-zinc-400'}`}
            >
              Motion (MP4)
            </button>
            <button 
              onClick={() => setExportMode("still_png")}
              className={`flex-1 py-2 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-all ${exportMode === "still_png" ? 'bg-white shadow-sm text-black' : 'text-zinc-400'}`}
            >
              Stills (PNG)
            </button>
            <button 
              onClick={() => setExportMode("still_jpg")}
              className={`flex-1 py-2 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-all ${exportMode === "still_jpg" ? 'bg-white shadow-sm text-black' : 'text-zinc-400'}`}
            >
              Stills (JPG)
            </button>
          </div>

          <button 
            onClick={saveToLocal}
            className={`w-full flex items-center justify-center gap-3 p-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-xl active:scale-[0.98] ${isSaved ? 'bg-green-600' : 'bg-black'} text-white`}
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {isSaved ? "Saved Locally" : "Save Creative Copy"}
          </button>

          <button 
            onClick={exportCarousel} 
            disabled={isExporting} 
            className={`w-full flex items-center justify-center gap-3 p-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-colors shadow-sm active:scale-[0.98] ${isExporting ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed' : 'bg-zinc-100 text-black hover:bg-zinc-200'}`}
          >
            <Download className="w-4 h-4" />
            {isExporting ? (manualProgress === 1 ? "Settling animations..." : "Exporting...") : "Export Carousel Package"}
          </button>
        </div>
      </div>

      {/* Preview Viewport */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Navigation Overlays */}
        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-20">
          <button 
            onClick={prevSlide}
            className="w-12 h-12 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg pointer-events-auto hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={nextSlide}
            className="w-12 h-12 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg pointer-events-auto hover:bg-white transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-10 flex gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1 transition-all rounded-full ${currentSlide === i ? 'w-8 bg-black' : 'w-2 bg-black/10'}`} 
            />
          ))}
        </div>

        {/* The Slide Frame */}
        <div id="export-frame" className={`w-full ${aspectRatio === '9:16' ? 'max-w-[340px] aspect-[9/16]' : aspectRatio === '4:5' ? 'max-w-[480px] aspect-[4/5]' : 'max-w-[600px] aspect-square'} shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] relative overflow-hidden transition-colors ${isDarkMode ? 'bg-[#050505]' : 'bg-white'}`}>
          <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={`slide-wrapper absolute inset-0 flex flex-col items-center justify-center text-center ${currentSlide > 1 ? 'p-0' : 'p-12'}`}
              >
              {currentSlide === 0 && (
                <div className={`w-full px-8 ${getThemeContainerClasses(appTheme)}`}>
                  <div className={`text-[10px] uppercase tracking-[0.5em] font-bold italic ${isDarkMode ? 'opacity-40 text-white' : 'opacity-30'}`}>Callout</div>
                  <h3 className={`${getFontSize(slide1Text)} ${getThemeHeadlineClasses(appTheme)} transition-all duration-300`}>
                    {renderHighlightedText(slide1Text, colorPop)}
                  </h3>
                  <div className={`w-12 h-[2px] mx-auto ${isDarkMode ? 'bg-white/20' : 'bg-black/10'}`} />
                </div>
              )}

              {currentSlide === 1 && (
                <div className={`w-full px-8 ${getThemeContainerClasses(appTheme)}`}>
                  <div className={`text-[10px] uppercase tracking-[0.5em] font-bold italic ${isDarkMode ? 'opacity-40 text-white' : 'opacity-30'}`}>The Issue</div>
                  <h3 className={`${getFontSize(slide2Text)} ${getThemeHeadlineClasses(appTheme)} transition-all duration-300`}>
                    {renderHighlightedText(slide2Text, colorPop)}
                  </h3>
                  <div className={`w-12 h-[1px] mx-auto ${isDarkMode ? 'bg-white/20' : 'bg-black/10'}`} />
                </div>
              )}

              {currentSlide === 2 && (
                <Slide3 principle={activePrinciple} colorPop={colorPop} manualProgress={manualProgress} isDarkMode={isDarkMode} appTheme={appTheme} hashtag={hashtags[activePrinciple.symbol] || `#thisis${activePrinciple.name.toLowerCase().replace(/\s+/g, '')}`} elementShape={elementShape} />
              )}

              {currentSlide === 3 && (
                <Slide4 colorPop={colorPop} manualProgress={manualProgress} isDarkMode={isDarkMode} appTheme={appTheme} />
              )}
            </motion.div>
          </AnimatePresence>
          
          {/* Background Texture Overlay */}
          {bgTexture === 'dots' && (
            <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px', color: isDarkMode ? 'white' : 'black' }} />
          )}
          {bgTexture === 'grid' && (
            <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px', color: isDarkMode ? 'white' : 'black' }} />
          )}

          {/* Watermark */}
          {showWatermark && (
            <div className="absolute top-[5%] right-[5%] z-[100] opacity-30 pointer-events-none mix-blend-difference">
              <Logo size={40} color={isDarkMode ? 'white' : 'black'} />
            </div>
          )}
        </div>

        <div className="mt-8 text-[10px] uppercase tracking-[0.3em] font-bold opacity-20">
          Slide {currentSlide + 1} of {totalSlides} // Instagram 1080x1080
        </div>
        
        {isExporting && (
          <div className="mt-4 w-full max-w-[600px] h-1 bg-zinc-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-black"
              animate={{ width: `${exportProgress}%` }}
            />
          </div>
        )}
      </div>
      
      {/* Hidden Render Node for Isolated Logo Export */}
      <div className="absolute top-0 left-0 w-0 h-0 overflow-hidden pointer-events-none">
        <div 
          ref={logoExportRef} 
          className="w-[1080px] h-[1080px] flex items-center justify-center bg-transparent"
        >
          <Logo size={600} color={colorPop} animated={false} />
        </div>
      </div>
    </div>
  );
}

function Slide3({ principle, colorPop, manualProgress, isDarkMode, appTheme, hashtag, elementShape }: { principle: any, colorPop: string, manualProgress: number | null, isDarkMode: boolean, appTheme: string, hashtag: string, elementShape: "square" | "rounded" | "circle" }) {
  const [isScraped, setIsScraped] = useState(false);
  const GRID_COLS = 18;
  const GRID_ROWS = 10;
  const GRID_SIZE = 60;
  
  // Center our principle in the transition metals (Row 4, Col 8)
  const TARGET_ROW = 4; 
  const TARGET_COL = 8; 

  useEffect(() => {
    if (manualProgress !== null) {
      if (manualProgress > 0.5) setIsScraped(true);
      return;
    }
    // No pause at the start: immediately start the zoom in.
    const timer = setTimeout(() => setIsScraped(true), 50);
    return () => clearTimeout(timer);
  }, [manualProgress]);

  const effectiveProgress = manualProgress !== null ? manualProgress : (isScraped ? 1 : 0);

  const getAtomicNumber = (r: number, c: number) => {
    if (r === 0 && c === 0) return 1;
    if (r === 0 && c === 17) return 2;
    if (r === 1) {
      if (c < 2) return 3 + c;
      if (c >= 12) return 5 + (c - 12);
    }
    if (r === 2) {
      if (c < 2) return 11 + c;
      if (c >= 12) return 13 + (c - 12);
    }
    if (r === 3) return 19 + c;
    if (r === 4) return 37 + c;
    if (r === 5) {
      if (c < 2) return 55 + c;
      if (c >= 3) return 69 + c;
    }
    if (r === 6) {
      if (c < 2) return 87 + c;
      if (c >= 3) return 101 + c;
    }
    if (r === 8 && c >= 2 && c <= 16) return 57 + (c - 2);
    if (r === 9 && c >= 2 && c <= 16) return 89 + (c - 2);
    return 0;
  };

  const SYMBOLS = [
    "", "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr", "Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe", "Cs", "Ba", "La", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po", "At", "Rn", "Fr", "Ra", "Ac", "Th", "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr", "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds", "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og"
  ];

  const elements = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const isTarget = r === TARGET_ROW && c === TARGET_COL;
      const atomicNum = getAtomicNumber(r, c);
      
      if (atomicNum > 0 || isTarget) {
        elements.push({
          r, c,
          s: isTarget ? principle.symbol : (SYMBOLS[atomicNum] || "X"),
          n: isTarget ? principle.number : atomicNum,
          m: isTarget ? principle.mass : (atomicNum * 2.1).toFixed(2),
          e: isTarget ? principle.electrons : "2,8",
          active: isTarget
        });
      }
    }
  }

  const gw = GRID_COLS * GRID_SIZE;
  const gh = GRID_ROWS * GRID_SIZE;
  const tx = TARGET_COL * GRID_SIZE + GRID_SIZE / 2;
  const ty = TARGET_ROW * GRID_SIZE + GRID_SIZE / 2;
  const START_SCALE = 0.54; // Adjust so width ~1080 * 0.54 = ~583px, fits nicely in 600px canvas
  const FINAL_SCALE = 4.5; 
  const dx = tx - gw / 2;
  const dy = ty - gh / 2;

  return (
    <div className={`w-full h-full relative overflow-hidden transition-colors ${isDarkMode ? 'bg-[#050505]' : 'bg-[#fafafa]'}`}>
      <motion.div 
        initial={{ 
          scale: START_SCALE, 
          x: 0, 
          y: 0 
        }}
        transition={{ 
          duration: manualProgress !== null ? 0 : 5.0, 
          ease: [0.16, 1, 0.3, 1],
          delay: manualProgress !== null ? 0 : 0
        }}
        animate={{
          scale: START_SCALE + (FINAL_SCALE - START_SCALE) * effectiveProgress,
          x: -dx * FINAL_SCALE * effectiveProgress,
          y: -dy * FINAL_SCALE * effectiveProgress,
        }}
        style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: -gh / 2,
            marginLeft: -gw / 2,
            width: gw,
            height: gh,
            transformOrigin: '50% 50%',
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_COLS}, ${GRID_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, ${GRID_SIZE}px)`,
        }}
      >
        {elements.map((el, i) => (
          <div 
            key={i} 
            style={{ 
              gridColumn: el.c + 1, 
              gridRow: el.r + 1,
              width: GRID_SIZE,
              height: GRID_SIZE
            }}
          >
            <ElementBox 
              symbol={el.s} 
              name={el.active ? principle.name : ""} 
              number={el.n} 
              mass={el.m}
              electrons={el.e}
              isActive={el.active} 
              isScraped={effectiveProgress > 0.5}
              colorPop={colorPop}
              isDarkMode={isDarkMode}
              elementShape={elementShape}
            />
          </div>
        ))}
      </motion.div>
      
      <motion.div
        transition={{ duration: manualProgress !== null ? 0 : 0.5 }}
        animate={{ opacity: effectiveProgress > 0.8 ? 1 : 0 }}
        className="absolute bottom-10 left-0 right-0 z-30 flex flex-col items-center pointer-events-none"
      >
        <div className={`text-[20px] ${appTheme === 'theme2' ? 'font-sans font-black italic tracking-tighter uppercase' : appTheme === 'theme3' ? 'font-mono uppercase tracking-tight' : appTheme === 'theme4' ? 'font-black uppercase tracking-tighter scale-y-110' : 'font-serif italic'} ${isDarkMode ? 'text-zinc-600' : 'text-zinc-500'}`}>
          {hashtag}
        </div>
      </motion.div>
    </div>
  );
}

function Slide4({ colorPop, manualProgress, isDarkMode, appTheme }: { colorPop: string, manualProgress: number | null, isDarkMode: boolean, appTheme: string }) {
  const parts = "ELEPHANT".split("");
  const effectiveProgress = manualProgress !== null ? manualProgress : 1;

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center p-0 m-0 transition-colors ${isDarkMode ? 'bg-[#050505]' : 'bg-white'}`}>
      <div className="flex flex-col items-center justify-center gap-8">
        <Logo size={240} color={isDarkMode ? 'white' : 'black'} />
        
        <div className="flex flex-col items-center">
          <motion.div 
            className="flex items-baseline"
            animate={{ opacity: effectiveProgress > 0.2 ? 1 : 0 }}
          >
            {parts.map((char, i) => {
              const isEL = (char === "E" || char === "L") && i < 2;
              const charDelay = i * 0.1;
              // Adjust progress mapping so that effectiveProgress=1.0 definitely covers the whole sequence
              const charProgress = manualProgress === 1 ? 1 : Math.max(0, Math.min(1, (effectiveProgress * 1.5 - 0.3 - charDelay) * 5));
              
              return (
                <motion.span
                  key={i}
                  className={`text-6xl ${appTheme === 'theme2' ? 'font-black italic' : appTheme === 'theme3' ? 'font-mono uppercase font-bold' : appTheme === 'theme4' ? 'font-black uppercase' : 'font-light'} tracking-tighter ${isEL ? '' : (isDarkMode ? 'text-zinc-800' : 'text-zinc-200')}`}
                  style={{ color: isEL ? colorPop : undefined }}
                  initial={manualProgress === null ? { y: 20, opacity: 0 } : false}
                  animate={{ y: (1 - charProgress) * 20, opacity: charProgress }}
                  transition={manualProgress !== null ? { duration: 0 } : { delay: 1 + i * 0.1 }}
                >
                  {char}
                </motion.span>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
