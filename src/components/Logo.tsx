"use client";

import React from 'react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <circle cx="50" cy="50" r="48" fill="url(#paint0_linear)" />
      <path 
        d="M30 50C30 38.9543 38.9543 30 50 30C61.0457 30 70 38.9543 70 50C70 61.0457 61.0457 70 50 70C38.9543 70 30 61.0457 30 50Z" 
        stroke="white" 
        strokeWidth="4" 
      />
      <circle cx="50" cy="50" r="6" fill="white" />
      <path 
        d="M50 30V20M50 80V70M30 50H20M80 50H70" 
        stroke="white" 
        strokeWidth="4" 
        strokeLinecap="round" 
      />
      <path 
        d="M35 35L40 40M60 60L65 65M35 65L40 60M60 40L65 35" 
        stroke="white" 
        strokeWidth="4" 
        strokeLinecap="round" 
      />
      <defs>
        <linearGradient id="paint0_linear" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}