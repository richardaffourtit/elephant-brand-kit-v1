/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";

interface LogoProps {
  className?: string;
  size?: number;
  color?: string;
  animated?: boolean;
}

/**
 * Logo component for "EL"
 * Balanced 50/50 horizontal split
 * E - Ear (Left 50%): Rounded Box Ear with intersecting middle line
 * L - Head/Trunk (Right 50%): Head profile with stylized trunk
 */
export default function Logo({ className = "", size = 200, color = "currentColor", animated = true }: LogoProps) {
  const TOP = 60;
  const BOTTOM = 140;
  const CENTER_X = 100; // Shifted slightly left to balance visual weight
  
  // Optical balancing: E is a solid box, L is thin lines.
  // We reduce E width slightly and increase L reach to compensate.
  const E_WIDTH = 75;
  const L_WIDTH = 85;
  
  const LEFT_X = CENTER_X - E_WIDTH;   // 25
  const RIGHT_X = CENTER_X + L_WIDTH;  // 185
  const MID_Y = (TOP + BOTTOM) / 2;    // 100

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 210 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial={animated ? { opacity: 0, scale: 0.9 } : false}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
      transition={animated ? { duration: 0.8, ease: "easeOut" } : {duration: 0}}
    >
      <g stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
        {/* The 'E' (Ear) - Rounded Box Style */}
        <motion.path
          d={`M${CENTER_X} ${TOP} H${LEFT_X + 15} Q${LEFT_X} ${TOP} ${LEFT_X} ${TOP + 15} V${BOTTOM - 15} Q${LEFT_X} ${BOTTOM} ${LEFT_X + 15} ${BOTTOM} H${CENTER_X}`}
          initial={animated ? { pathLength: 0 } : false}
          animate={animated ? { pathLength: 1 } : undefined}
          transition={animated ? { duration: 1.2, ease: "easeInOut" } : {duration: 0}}
        />
        
        {/* Middle Line of E - Intersecting with the left vertical line */}
        <motion.path
          d={`M${LEFT_X} ${MID_Y} H${CENTER_X - 25}`}
          initial={animated ? { pathLength: 0 } : false}
          animate={animated ? { pathLength: 1 } : undefined}
          transition={animated ? { duration: 0.8, delay: 0.8, ease: "easeInOut" } : {duration: 0}}
        />
        
        {/* The 'L' (Head and Trunk) - Geometric half-circle tip with adjusted reach */}
        <motion.path
          d={`M${CENTER_X} ${TOP} V${BOTTOM} H${RIGHT_X - 20} A20 20 0 0 0 ${RIGHT_X - 20} ${BOTTOM - 40}`}
          initial={animated ? { pathLength: 0 } : false}
          animate={animated ? { pathLength: 1 } : undefined}
          transition={animated ? { duration: 1.5, delay: 0.4, ease: "easeInOut" } : {duration: 0}}
        />
        
        {/* Eye */}
        <motion.circle
          cx={CENTER_X + 18}
          cy={TOP + 22}
          r="3"
          fill={color}
          stroke="none"
          initial={animated ? { opacity: 0 } : false}
          animate={animated ? { opacity: 1 } : undefined}
          transition={animated ? { delay: 1.6 } : {duration: 0}}
        />
      </g>
    </motion.svg>
  );
}
