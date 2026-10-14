import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneSpec } from "../types";
import { FONT, resolveSceneTag } from "../theme";
import { getActiveVisualBeat } from "../VisualStory";

const STATES = new Set(["search", "collision", "locked", "payment", "booked", "segments"]);

const panel: React.CSSProperties = {
  border: "1px solid rgba(173, 200, 239, 0.48)",
  borderRadius: 18,
  background: "linear-gradient(145deg, rgba(24,48,79,0.96), rgba(11,27,49,0.96))",
  boxShadow: "0 18px 42px rgba(0,0,0,0.28), inset 0 1px rgba(255,255,255,0.08)",
};

const SeatBooking: React.FC<{ scene: SceneSpec; accent: string }> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height, fps } = useVideoConfig();
  const progress = frame / Math.max(durationInFrames - 1, 1);
  const beat = getActiveVisualBeat(scene.beats, progress);
  const state = beat?.visualState && STATES.has(beat.visualState) ? beat.visualState : "search";
  const focus = beat?.focus;
  const motion = interpolate(frame % Math.max(1, fps), [0, fps - 1], [0, 1]);
  const compact = width > height;
  const targetStatus =
    state === "collision"
      ? "RACE"
      : state === "locked"
      ? "LOCKED · YOU"
      : state === "payment"
      ? "HELD · YOU"
      : state === "booked"
      ? "BOOKED"
      : "FREE";
  const statusColor =
    state === "booked" ? "#47D7A2" : state === "locked" || state === "payment" ? accent : "#AFC4DF";

  return (
    <AbsoluteFill
      style={{
        padding: compact ? "112px 90px 170px" : "170px 54px 470px",
        color: "#F5F7FF",
        fontFamily: FONT,
        justifyContent: "center",
        gap: compact ? 22 : 30,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 42%, #19375b 0%, #0b1d35 54%, #09172b 100%)" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.2, backgroundImage: "linear-gradient(rgba(150,190,235,.28) 1px, transparent 1px), linear-gradient(90deg, rgba(150,190,235,.28) 1px, transparent 1px)", backgroundSize: "88px 88px", transform: "perspective(650px) rotateX(58deg) scale(1.6)", transformOrigin: "center 70%" }} />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{ color: accent, fontFamily: "monospace", fontSize: compact ? 20 : 28, fontWeight: 800, letterSpacing: "0.18em", marginBottom: 10 }}>
          {resolveSceneTag(scene, "02 / ONE SEAT · TWO REQUESTS")}
        </div>
        <div style={{ fontSize: compact ? 48 : 62, lineHeight: 1.05, fontWeight: 900 }}>
          {scene.title || "One Seat. Two Requests."}
        </div>
      </div>

      {state === "segments" ? (
        <div style={{ ...panel, position: "relative", zIndex: 1, padding: compact ? 24 : 32 }}>
          <div style={{ textAlign: "center", color: accent, fontFamily: "monospace", fontSize: compact ? 24 : 30, fontWeight: 800, letterSpacing: "0.12em", marginBottom: 28 }}>
            ONE SEAT · THREE STATIONS
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", gap: 8 }}>
            <div style={{ position: "absolute", top: 20, left: "12%", right: "12%", height: 5, background: "linear-gradient(90deg, #FFC857 0 50%, #61D8C4 50% 100%)", boxShadow: "0 0 18px rgba(0,240,255,0.35)" }} />
            {["NEW DELHI", "KANPUR", "PATNA"].map((station, index) => (
              <div key={station} style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: index === 1 ? "#0B1020" : index === 0 ? "#FFC857" : "#61D8C4", border: `4px solid ${index === 1 ? "#FFC857" : "#F5F7FF"}`, boxShadow: `0 0 20px ${index === 2 ? "#61D8C4" : "#FFC857"}` }} />
                <div style={{ color: "#F5F7FF", fontFamily: "monospace", fontSize: compact ? 18 : 26, fontWeight: 800, textAlign: "center" }}>{station}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", gap: 12, marginTop: 36 }}>
            <div style={{ color: "#FFC857", fontSize: compact ? 24 : 32, fontWeight: 900 }}>DELHI → KANPUR</div>
            <div style={{ color: "#61D8C4", fontSize: compact ? 24 : 32, fontWeight: 900 }}>KANPUR → PATNA</div>
          </div>
          <div style={{ marginTop: 20, textAlign: "center", color: "#DCE8FA", fontSize: compact ? 21 : 30, fontWeight: 700 }}>
            A full-route booking overlaps both segments
          </div>
        </div>
      ) : (
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: compact ? "row" : "column", alignItems: "center", gap: 22 }}>
          <div style={{ ...panel, width: "100%", padding: compact ? 18 : 26 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px 16px", color: "#AFC4DF", fontFamily: "monospace", fontSize: compact ? 18 : 24, fontWeight: 800, letterSpacing: "0.1em" }}>
              <span>SEAT</span><span>COACH</span><span>STATUS</span><span>VERSION</span>
            </div>
            {[21, 22, 23, 24, 25].map((seat) => {
              const selected = seat === 23;
              const status = selected ? targetStatus : seat === 22 ? "FREE" : "BOOKED";
              const color = selected ? statusColor : "#AFC4DF";
              return (
                <div
                  key={seat}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "0.55fr 0.65fr 1.6fr 0.65fr",
                    alignItems: "center",
                    gap: 8,
                    minHeight: compact ? 54 : 74,
                    marginTop: 8,
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: `2px solid ${selected ? color : "rgba(173,200,239,0.45)"}`,
                    background: selected ? `${color}1B` : "rgba(12,29,51,0.8)",
                    boxShadow: selected ? `0 0 22px ${color}33` : "none",
                    color: selected ? "#FFFFFF" : "#B6C8DE",
                    fontFamily: "monospace",
                    fontSize: compact ? 18 : 25,
                    fontWeight: 800,
                    transition: "background 180ms linear",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <SeatGlyph color={selected ? color : "#91A8C5"} />
                    {seat}
                  </span>
                  <span>B4</span><span style={{ color }}>{status}</span><span style={{ color: selected ? accent : "#91A8C5" }}>{selected && state === "booked" ? "v8" : "v7"}</span>
                </div>
              );
            })}
          </div>

          <div style={{ ...panel, width: compact ? "38%" : "100%", minHeight: compact ? 180 : 126, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, textAlign: "center" }}>
            {state === "search" && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <DatabaseGlyph label="READ COPIES" accent={accent} active={focus === "read-replica"} />
                <div style={{ color: "#AFC4DF", fontFamily: "monospace", fontSize: compact ? 22 : 28, fontWeight: 900 }}>→</div>
                <DatabaseGlyph label="MAIN DB · WRITES" accent={accent} active={focus === "main-database"} />
              </div>
            )}
            {state === "collision" && (
              <div style={{ display: "flex", gap: 12, animation: "none", transform: `translateY(${(motion - 0.5) * 5}px)` }}>
                <span style={{ ...requestPill, color: "#FFC857" }}>REQUEST A</span>
                <span style={{ ...requestPill, color: "#61D8C4" }}>REQUEST B</span>
              </div>
            )}
            {state === "locked" && <div style={{ fontSize: compact ? 45 : 58 }}>🔒</div>}
            {state === "locked" && <div style={{ color: "#FF7A88", fontFamily: "monospace", fontSize: compact ? 18 : 24, fontWeight: 900 }}>REQUEST B · REJECTED</div>}
            {state === "payment" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ width: compact ? 102 : 120, height: compact ? 102 : 120, borderRadius: "50%", border: `6px solid ${accent}`, display: "grid", placeItems: "center", color: "#FFFFFF", fontSize: compact ? 25 : 30, fontWeight: 900, boxShadow: `0 0 24px ${accent}44` }}>
                  01:59
                </div>
                <div style={{ color: "#47D7A2", fontSize: compact ? 17 : 22, fontWeight: 900 }}>ROW LOCK RELEASED</div>
              </div>
            )}
            {state === "booked" && <div style={{ fontSize: compact ? 42 : 52, color: "#47D7A2", fontWeight: 900 }}>✓</div>}
            <div style={{ color: accent, fontFamily: "monospace", fontSize: compact ? 18 : 26, fontWeight: 900, letterSpacing: "0.1em" }}>
              {state === "search" && "SEARCH COPIES"}
              {state === "collision" && "TWO REQUESTS · SAME ROW"}
              {state === "locked" && "ROW CLAIMED"}
              {state === "payment" && "SHORT HOLD · PAYMENT PENDING"}
              {state === "booked" && "WRITE CONFIRMED"}
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const requestPill: React.CSSProperties = {
  padding: "10px 14px",
  border: "1px solid currentColor",
  borderRadius: 999,
  background: "rgba(9, 23, 43, 0.9)",
  fontFamily: "monospace",
  fontSize: 22,
  fontWeight: 900,
};

const DatabaseGlyph: React.FC<{ label: string; accent: string; active: boolean }> = ({
  label,
  accent,
  active,
}) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
    <div
      style={{
        position: "relative",
        width: 92,
        height: 66,
        borderRadius: "50% / 18%",
        border: `2px solid ${active ? accent : "#8CA9CC"}`,
        background: "linear-gradient(90deg, #153457, #264f7b)",
        boxShadow: active ? `0 0 20px ${accent}55` : "0 0 12px rgba(109,157,213,0.2)",
      }}
    >
      {[0, 1, 2].map((layer) => (
        <div
          key={layer}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: layer * 15,
            height: 24,
            border: `2px solid ${active ? accent : "#8CA9CC"}`,
            borderRadius: "50%",
            background: layer === 0 ? "rgba(55,101,151,0.92)" : "rgba(28,62,99,0.94)",
          }}
        />
      ))}
    </div>
    <div style={{ color: active ? accent : "#C6D5E8", fontFamily: "monospace", fontSize: 18, fontWeight: 900, textAlign: "center" }}>
      {label}
    </div>
  </div>
);

const SeatGlyph: React.FC<{ color: string }> = ({ color }) => (
  <svg width="28" height="30" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M13 7v22h28" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 24h29v8H13zM18 32v9M37 32v9" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SeatBookingScene: React.FC<{ scene: SceneSpec; accent: string }> = (props) => (
  <SeatBooking {...props} />
);
