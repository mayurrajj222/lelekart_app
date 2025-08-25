import { useState, useRef } from "react";
import { RotateCw } from "lucide-react";

interface Test360ViewProps {
  images: string[];
  name: string;
}

export default function Test360View({ images, name }: Test360ViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate 360 frames
  const get360Frames = () => {
    if (images.length === 0) return [];
    if (images.length === 1) return Array(36).fill(images[0]);

    const frames: string[] = [];
    const totalFrames = 36;

    for (let i = 0; i < totalFrames; i++) {
      const imageIndex = Math.floor((i / totalFrames) * images.length);
      frames.push(images[imageIndex]);
    }

    return frames;
  };

  // Handle mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const relativeX = x / rect.width;

    const frames = get360Frames();
    if (frames.length === 0) return;

    const frameIndex = Math.min(
      frames.length - 1,
      Math.max(0, Math.floor(relativeX * frames.length))
    );

    setActiveIndex(frameIndex % images.length);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">360° View Test</h3>

      <div
        ref={containerRef}
        className="w-full h-64 border border-gray-300 bg-white flex items-center justify-center cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsDragging(true)}
        onMouseLeave={() => setIsDragging(false)}
      >
        {images.length > 0 ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={images[activeIndex]}
              alt={`${name} 360 view`}
              className="max-w-full max-h-full object-contain transition-all duration-200"
            />
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white p-2 rounded text-xs flex items-center gap-2">
              <RotateCw
                size={14}
                className={`${isDragging ? "animate-spin" : "animate-pulse"}`}
              />
              <span>Move mouse left/right to rotate</span>
            </div>
          </div>
        ) : (
          <span className="text-gray-400">No images available</span>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-500 text-center">
        <p>
          Active frame: {activeIndex + 1} of {images.length}
        </p>
        <p>Total 360 frames: {get360Frames().length}</p>
      </div>
    </div>
  );
}
