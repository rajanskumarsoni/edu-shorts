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
      calculateMetadata={({ props }: { props: VideoProps }) => ({
        durationInFrames: Math.max(
          1,
          props.scenes.reduce((a: number, s: SceneSpec) => a + s.durationInFrames, 0)
        ),
        fps: props.fps,
        width: props.width,
        height: props.height,
      })}
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
