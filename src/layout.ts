import { useVideoConfig } from "remotion";

// Adapts padding to vertical (reel) or landscape (16:9) videos.
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const landscape = width > height;
  return {
    width,
    height,
    landscape,
    padX: landscape ? 160 : 80,
    padTop: landscape ? 60 : 120,
    // vertical: keep content above the Shorts/Reels buttons and title area
    padBottom: landscape ? 80 : 320,
  };
};
