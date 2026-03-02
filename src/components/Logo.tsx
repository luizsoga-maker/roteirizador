"use client";

import { useEffect, useState } from "react";

const Logo = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = "/placeholder.svg";
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setIsError(true);
  }, []);

  if (isError) {
    return <div className="text-red-500">Failed to load logo</div>;
  }

  if (!isLoaded) {
    return <div className="animate-pulse text-gray-400">Loading logo...</div>;
  }

  return (
    <img
      src="/placeholder.svg"
      alt="Logo"
      className="w-24 h-24 object-contain mx-auto d-block"
    />
  );
};

export default Logo;