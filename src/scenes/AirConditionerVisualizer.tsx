import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneSpec } from "../types";
import { useLayout } from "../layout";
import { FONT, MONO, resolveSceneTag, safeFontSize } from "../theme";
import { RevealText } from "../Reveal";

type Variant = "split_hook" | "indoor_evaporator" | "outdoor_compressor" | "cycle_payoff";

const SCENE_COPY: Record<Variant, { title: string; tag: string; takeaway: string }> = {
  split_hook: {
    title: "WHERE DOES THE HEAT GO?",
    tag: "01 / THE COOLING MYSTERY",
    takeaway: "ROOM HEAT → OUTDOORS",
  },
  indoor_evaporator: {
    title: "THE INDOOR COIL ABSORBS HEAT",
    tag: "03 / HEAT LEAVES THE ROOM",
    takeaway: "WARM AIR IN · COOLER AIR OUT",
  },
  outdoor_compressor: {
    title: "THE OUTDOOR UNIT REJECTS HEAT",
    tag: "05 / HEAT DUMPS OUTSIDE",
    takeaway: "COMPRESS → CONDENSE → EXHAUST",
  },
  cycle_payoff: {
    title: "THE LOOP REPEATS",
    tag: "07 / THE HEAT SHUTTLE",
    takeaway: "INDOOR COIL TAKES HEAT · OUTDOOR COIL RELEASES IT",
  },
};

export const AirConditionerVisualizer: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const isVertical = !layout.landscape;
  const requestedVariant = scene.variant as Variant | undefined;
  const variant = requestedVariant && requestedVariant in SCENE_COPY ? requestedVariant : "cycle_payoff";
  const copy = SCENE_COPY[variant];
  const title = scene.title || copy.title;
  const tag = resolveSceneTag(scene, copy.tag);
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const airflowPhase = (frame * 5) % 28;
  const refrigerantPhase = (frame * 3) % 24;
  const fanAngle = frame * 3;
  const focus = variant === "indoor_evaporator" ? "indoor" : variant === "outdoor_compressor" ? "outdoor" : "all";
  const focusOpacity = (part: "indoor" | "outdoor") => (focus === "all" || focus === part ? 1 : 0.58);
  const heatPulse = interpolate((frame % 36), [0, 18, 35], [0.55, 1, 0.55]);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(155deg, #0A1017 0%, #101B24 58%, #17211F 100%)",
        padding: `${layout.padTop}px ${layout.padX}px ${layout.padBottom}px`,
        color: "#F5F7F8",
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "relative", zIndex: 2, flexShrink: 0, paddingBottom: 8 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 16px",
            borderRadius: 999,
            border: `1px solid ${accent}88`,
            background: "rgba(8, 15, 21, 0.86)",
            marginBottom: 8,
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: accent }} />
          <span
            style={{
              color: accent,
              fontFamily: MONO,
              fontSize: safeFontSize(isVertical ? 27 : 20, layout.landscape),
              fontWeight: 800,
              letterSpacing: 0,
            }}
          >
            {tag}
          </span>
        </div>
        <RevealText
          text={title}
          align="left"
          delay={3}
          style={{
            fontSize: safeFontSize(isVertical ? 48 : 40, layout.landscape),
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: 0,
          }}
        />
      </div>

      <div style={{ minHeight: 0, flex: 1, transform: `scale(${Math.max(0.94, enter)})` }}>
        <svg
          viewBox="0 0 1000 1040"
          width="100%"
          height="100%"
          role="img"
          aria-label="Cutaway of a split air conditioner moving heat from the room to the outdoors"
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            <linearGradient id="indoor-shell" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F5F7F8" />
              <stop offset="0.56" stopColor="#CBD5D8" />
              <stop offset="1" stopColor="#83939A" />
            </linearGradient>
            <linearGradient id="outdoor-shell" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#66747A" />
              <stop offset="0.45" stopColor="#34434A" />
              <stop offset="1" stopColor="#1C292F" />
            </linearGradient>
            <marker id="arrow-heat" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#F97316" />
            </marker>
            <marker id="arrow-cool" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#42D8E8" />
            </marker>
            <marker id="arrow-liquid" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#E6BD62" />
            </marker>
            <pattern id="coil-fins" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M5 0V12" stroke="#87979C" strokeWidth="2" opacity="0.8" />
              <path d="M10 0V12" stroke="#34464D" strokeWidth="1" opacity="0.8" />
            </pattern>
          </defs>

          <rect x="20" y="28" width="960" height="475" rx="28" fill="#121F27" stroke="#415158" strokeWidth="2" />
          <rect x="20" y="520" width="960" height="490" rx="28" fill="#19221F" stroke="#59604D" strokeWidth="2" />
          <text x="58" y="82" fill="#DDE5E7" fontSize="31" fontWeight="800" fontFamily={MONO}>INDOOR ROOM</text>
          <text x="58" y="574" fill="#DDE5E7" fontSize="31" fontWeight="800" fontFamily={MONO}>OUTDOOR UNIT</text>
          <line x1="45" y1="504" x2="955" y2="504" stroke="#839399" strokeWidth="3" strokeDasharray="10 12" />
            <text x="485" y="479" textAnchor="middle" fill="#8FE8EE" fontSize="28" fontWeight="800" fontFamily={MONO}>EVAPORATOR COIL</text>
            <text x="704" y="298" textAnchor="start" fill="#E5EAEB" fontSize="23" fontWeight="700" fontFamily={MONO}>INDOOR FAN</text>

          <g opacity={focusOpacity("indoor")}>
            <path d="M110 183 H852" stroke="#89979B" strokeWidth="9" opacity="0.65" />
            <rect x="238" y="139" width="500" height="112" rx="28" fill="url(#indoor-shell)" stroke="#F3F5F4" strokeWidth="3" />
            <path d="M262 165 Q272 151 294 151 H680 Q710 151 721 173 L706 190 H268 Z" fill="#FFFFFF" opacity="0.52" />
            <rect x="657" y="162" width="44" height="12" rx="6" fill="#30434A" />
            <circle cx="679" cy="168" r="4" fill="#F97316" />
            <path d="M264 224 Q485 246 713 218" fill="none" stroke="#34444A" strokeWidth="8" strokeLinecap="round" />
            <path d="M300 233 L314 261 M354 237 L367 266 M408 240 L419 270 M462 242 L472 273 M516 241 L525 273 M570 238 L579 269 M624 234 L635 265" stroke="#99A9AD" strokeWidth="5" strokeLinecap="round" />
            <text x="485" y="126" textAnchor="middle" fill="#EFF4F4" fontSize="28" fontWeight="800" fontFamily={MONO}>WALL-MOUNTED INDOOR UNIT</text>

            <rect x="295" y="303" width="380" height="122" rx="18" fill="#26363D" stroke="#42D8E8" strokeWidth={focus === "indoor" ? 5 : 3} />
            <rect x="313" y="320" width="343" height="89" rx="10" fill="url(#coil-fins)" />
            <path d="M324 337 C340 318 356 356 372 337 S404 356 420 337 S452 356 468 337 S500 356 516 337 S548 356 564 337 S596 356 612 337 S640 356 650 337" fill="none" stroke="#42D8E8" strokeWidth="6" />

            <ellipse cx="484" cy="283" rx="138" ry="18" fill="#0A1116" stroke="#89999E" strokeWidth="3" />
            <path d="M365 283 Q484 250 603 283 Q484 314 365 283Z" fill="#43565D" stroke="#A5B3B6" strokeWidth="2" />
            {Array.from({ length: 16 }, (_, index) => (
              <line key={`blower-${index}`} x1={367 + index * 15} y1="280" x2={370 + index * 15} y2="291" stroke="#B6C2C4" strokeWidth="2" opacity="0.65" />
            ))}

            <path d="M918 365 C842 345 760 345 682 365" fill="none" stroke="#F97316" strokeWidth="8" strokeDasharray="14 12" strokeDashoffset={airflowPhase} markerEnd="url(#arrow-heat)" opacity={heatPulse} />
            <path d="M680 405 C760 432 842 432 920 410" fill="none" stroke="#42D8E8" strokeWidth="8" strokeDasharray="14 12" strokeDashoffset={-airflowPhase} markerEnd="url(#arrow-cool)" />
            <text x="744" y="326" fill="#FDB08B" fontSize="25" fontWeight="800" fontFamily={MONO}>WARM AIR IN</text>
            <text x="744" y="457" fill="#8FE8EE" fontSize="25" fontWeight="800" fontFamily={MONO}>COOLED AIR OUT</text>
          </g>

          <g opacity={focusOpacity("outdoor")}>
            <rect x="252" y="640" width="470" height="310" rx="22" fill="url(#outdoor-shell)" stroke="#A9B5B5" strokeWidth="4" />
            <path d="M270 661 H705 V919 H270 Z" fill="url(#coil-fins)" stroke="#68797D" strokeWidth="2" />
            <text x="478" y="632" textAnchor="middle" fill="#E6ECEB" fontSize="28" fontWeight="800" fontFamily={MONO}>FAN + FINNED CONDENSER</text>
            <circle cx="484" cy="784" r="107" fill="#17242A" stroke="#98A8AB" strokeWidth="5" />
            <circle cx="484" cy="784" r="16" fill="#CED5D4" />
            {[0, 60, 120, 180, 240, 300].map((rotation) => (
              <path
                key={`blade-${rotation}`}
                d="M482 776 C490 735 526 708 552 720 C557 749 529 776 490 790Z"
                transform={`rotate(${rotation + fanAngle} 484 784)`}
                fill="#A8B5B5"
                opacity="0.8"
              />
            ))}
            <circle cx="484" cy="784" r="107" fill="none" stroke="#D3DAD8" strokeWidth="3" strokeDasharray="4 13" />

            <rect x="590" y="811" width="100" height="112" rx="34" fill="#202B30" stroke="#F4A261" strokeWidth={focus === "outdoor" ? 5 : 3} />
            <ellipse cx="640" cy="811" rx="50" ry="14" fill="#39464A" stroke="#F4A261" strokeWidth="3" />
            <path d="M606 843 H674 M606 859 H674 M606 875 H674 M606 891 H674" stroke="#78868A" strokeWidth="3" />
            <path d="M614 923 V936 H676 V923" fill="none" stroke="#BEC7C6" strokeWidth="4" />
            <text x="640" y="972" textAnchor="middle" fill="#FFD0A8" fontSize="27" fontWeight="800" fontFamily={MONO}>COMPRESSOR</text>

            <path d="M760 750 C827 718 865 710 920 726" fill="none" stroke="#F97316" strokeWidth="8" strokeDasharray="14 12" strokeDashoffset={-airflowPhase} markerEnd="url(#arrow-heat)" />
            <path d="M765 794 C835 776 880 784 930 809" fill="none" stroke="#F97316" strokeWidth="7" strokeDasharray="12 13" strokeDashoffset={airflowPhase} markerEnd="url(#arrow-heat)" opacity="0.8" />
            <text x="828" y="685" textAnchor="middle" fill="#FDB08B" fontSize="27" fontWeight="800" fontFamily={MONO}>WARM EXHAUST</text>
          </g>

          <g opacity={focus === "all" ? 1 : 0.92}>
            <path d="M653 365 C820 388 853 492 853 610 L853 740 C820 790 755 824 690 850" fill="none" stroke="#42D8E8" strokeWidth="9" strokeDasharray="16 12" strokeDashoffset={refrigerantPhase} markerEnd="url(#arrow-cool)" />

            <path d="M590 850 C520 830 440 785 385 755" fill="none" stroke="#F97316" strokeWidth="9" strokeDasharray="14 12" strokeDashoffset={-refrigerantPhase} markerEnd="url(#arrow-heat)" />
            <path d="M330 900 C220 930 100 912 100 810 L100 522 C100 485 112 466 145 458" fill="none" stroke="#E6BD62" strokeWidth="8" strokeDasharray="14 12" strokeDashoffset={refrigerantPhase} markerEnd="url(#arrow-liquid)" />
            <rect x="51" y="406" width="178" height="54" rx="12" fill="#2C302B" stroke="#E6BD62" strokeWidth="3" />
            <path d="M67 418 L87 433 L67 448 M213 418 L193 433 L213 448" fill="none" stroke="#E6BD62" strokeWidth="4" />
            <text x="140" y="488" textAnchor="middle" fill="#F0D693" fontSize="22" fontWeight="800" fontFamily={MONO}>METERING VALVE</text>
            <path d="M229 433 C266 433 282 414 313 397" fill="none" stroke="#42D8E8" strokeWidth="8" strokeDasharray="14 12" strokeDashoffset={-refrigerantPhase} markerEnd="url(#arrow-cool)" />
          </g>

          {variant === "cycle_payoff" && (
            <g>
              <rect x="51" y="592" width="178" height="70" rx="16" fill="#26302D" stroke={accent} strokeWidth="3" />
              <text x="140" y="622" textAnchor="middle" fill="#F4F6F4" fontSize="25" fontWeight="800" fontFamily={MONO}>ROOM SENSOR</text>
              <text x="140" y="649" textAnchor="middle" fill={accent} fontSize="25" fontWeight="800" fontFamily={MONO}>SET POINT</text>
              <path d="M229 628 C270 610 286 614 314 650" fill="none" stroke={accent} strokeWidth="4" strokeDasharray="8 9" />
            </g>
          )}
        </svg>
      </div>

    </AbsoluteFill>
  );
};