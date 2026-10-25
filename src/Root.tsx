import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { ThreeDGradient } from "./scenes/ThreeDGradient";
import type { SceneSpec, VideoProps } from "./types";

const defaultProps: VideoProps = {
  fps: 30,
  width: 1080,
  height: 1920,
  scenes: [
    {
      type: "hook",
      durationInFrames: 90,
      text: "Run pipeline.py to generate real content",
    },
  ],
};

export const Root: React.FC = () => (
  <>
    <Composition
      id="Video"
      component={Video}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={90}
      defaultProps={defaultProps}
      calculateMetadata={({ props }: { props: VideoProps }) => {
        const fps = props?.fps || 30;
        const totalDuration = (props?.scenes || []).reduce(
          (a: number, s: any) =>
            a + (s.durationInFrames ?? Math.round((s.seconds ?? 3) * fps)),
          0
        );
        return {
          durationInFrames: Math.max(1, totalDuration || 90),
          fps: fps,
          width: props?.width || ((props as any)?.format === "landscape" ? 1920 : 1080),
          height: props?.height || ((props as any)?.format === "landscape" ? 1080 : 1920),
        };
      }}
    />
    <Composition
      id="ThreeDGradient"
      component={ThreeDGradient}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={349}
    />
  </>
);
