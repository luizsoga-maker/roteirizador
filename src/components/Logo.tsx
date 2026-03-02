"use client";

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <img
      src="/placeholder.svg"
      alt="Logo"
      className={`w-24 h-24 object-contain mx-auto d-block ${className}`}
    />
  );
}