/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import React from "react";

interface ElementBoxProps {
  symbol: string;
  name: string;
  number?: number;
  mass?: string;
  electrons?: string;
  colorPop?: string;
  isActive?: boolean;
  isScraped?: boolean;
  isDarkMode?: boolean;
  elementShape?: "square" | "rounded" | "circle";
}

/**
 * A periodic table style element box
 */
const ElementBox: React.FC<ElementBoxProps> = ({ 
  symbol, 
  name, 
  number, 
  mass,
  electrons,
  colorPop = "#FF0000", 
  isActive = false,
  isScraped = false,
  isDarkMode = false,
  elementShape = "square"
}) => {
  const getShapeClass = () => {
    if (elementShape === "rounded") return "rounded-[4px]";
    if (elementShape === "circle") return "rounded-full";
    return "rounded-none";
  };

  return (
    <motion.div
      layout
      animate={{ 
        opacity: isScraped && !isActive ? (isDarkMode ? 0.3 : 0.2) : 1,
        scale: isScraped && !isActive ? 0.9 : 1,
        borderColor: isActive ? colorPop : (isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.1)"),
        borderWidth: isActive ? "2px" : "1px",
      }}
      className={`
        border border-solid ${getShapeClass()}
        aspect-square flex flex-col p-1.5 relative transition-colors
        ${isActive ? (isDarkMode ? 'z-50 shadow-[0_0_100px_rgba(255,255,255,0.05)]' : 'z-50 shadow-[0_0_100px_rgba(0,0,0,0.15)]') : 'z-10'}
        ${isDarkMode ? 'bg-[#050505]' : 'bg-white'}
      `}
      style={{
        borderColor: isActive ? colorPop : undefined,
      }}
    >
      {/* Top Labels - Standardized for all elements */}
      <div className={`flex justify-between items-start font-mono leading-none tracking-tighter text-[4px] ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
        <span>{number || ""}</span>
        <span className="text-right w-[12px] truncate">{electrons ? electrons.slice(0, 3) : ""}</span>
      </div>
      
      {/* Symbol */}
      <div className="flex-1 flex items-center justify-center relative">
        <span 
          className={`font-black tracking-tighter leading-none ${symbol.length > 2 ? 'text-[12px]' : 'text-[16px]'}`}
          style={{ color: isActive ? colorPop : (isDarkMode ? '#404040' : 'currentColor') }}
        >
          {symbol}
        </span>
      </div>
      
      {/* Bottom Information */}
      <div className="flex flex-col items-center">
        <div className={`uppercase tracking-[0.05em] font-black w-full text-center leading-tight truncate text-[5px] ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
          {name}
        </div>
        <div className={`font-mono tracking-tighter text-[4px] ${isDarkMode ? 'text-zinc-700' : 'text-zinc-300'}`}>
          {mass || ""}
        </div>
      </div>
    </motion.div>
  );
};

export default ElementBox;
