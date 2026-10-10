"""
Generic, reusable Manim scenes.

The pipeline passes parameters through the SCENE_PARAMS env var (JSON):
  P["duration"]  target length in seconds (animation is paced to fit narration)
  P["accent"]    accent color
  P["format"]    "vertical" (1080x1920, frame 4.5 x 8 units) or
                 "landscape" (1920x1080, frame 14.2 x 8 units)

Equations needs LaTeX installed. Graph and Flow do not.
"""
import json
import math
import os

import numpy as np
from manim import *

P = json.loads(os.environ.get("SCENE_PARAMS", "{}"))
DUR = float(P.get("duration", 6))
LAND = P.get("format", "vertical") == "landscape"
BG = "#0B1020"
ACCENT = P.get("accent", "#FFC857")
SAFE_W = 11.0 if LAND else 11.6   # max content width in Manim units (frame is 14.22 wide)
SAFE_H = 5.8 if LAND else 17.5    # max content height in Manim units (frame is 25.28 tall)


class Equations(Scene):
    """params: lines = ["a^2+b^2=c^2", "c=\\sqrt{a^2+b^2}"]  (LaTeX or math expression)
    Renders equations with large, high-visibility typography optimized for mobile screens.
    """

    def construct(self):
        self.camera.background_color = BG
        lines = P.get("lines", ["a^2 + b^2 = c^2"])
        step = DUR / (len(lines) + 1)
        prev = None

        def make_eq(ln):
            try:
                m = MathTex(ln, color=WHITE).scale(2.8 if not LAND else 3.2)
                if m.width > SAFE_W:
                    m.scale_to_fit_width(SAFE_W)
                return m
            except Exception:
                # High-contrast bold unicode fallback when LaTeX packages are missing
                replacements = {
                    "\\sqrt": "√",
                    "\\frac": "",
                    "\\cdot": " · ",
                    "\\times": " × ",
                    "\\approx": " ≈ ",
                    "\\alpha": "α",
                    "\\beta": "β",
                    "\\delta": "δ",
                    "\\Delta": "Δ",
                    "\\theta": "θ",
                    "\\sigma": "σ",
                    "\\partial": "∂",
                    "^2": "²",
                    "^3": "³",
                    "^T": "ᵀ",
                    "_{out}": "ₒᵤₜ",
                    "_{in}": "ᵢₙ",
                    "\\hat{y}": "ŷ",
                    "{": "",
                    "}": "",
                    "\\": "",
                }
                clean = ln
                for k, v in replacements.items():
                    clean = clean.replace(k, v)
                fs = 64 if not LAND else 72
                t = Text(clean, font_size=fs, weight=BOLD, color=WHITE)
                if t.width > SAFE_W:
                    t.scale_to_fit_width(SAFE_W)
                return t

        for ln in lines:
            m = make_eq(ln)
            if LAND:
                m.shift(DOWN * 0.3)
            if prev is None:
                self.play(FadeIn(m, scale=1.15), run_time=step * 0.6)
            else:
                self.play(ReplacementTransform(prev, m), run_time=step * 0.6)
            self.wait(step * 0.4)
            prev = m
        self.wait(step)


class Graph(Scene):
    """params: fn = "np.sin(x)", x_range=[-6,6,2], y_range=[-2,2,1]"""

    def construct(self):
        self.camera.background_color = BG
        xr = P.get("x_range", [-3, 3, 1])
        yr = P.get("y_range", [-3, 3, 1])
        fn = P.get("fn", "x**2")
        f = lambda x: eval(fn, {"np": np, "math": math}, {"x": x})
        ax = Axes(
            x_range=xr, y_range=yr,
            x_length=9.0 if LAND else 4.0,
            y_length=5.2 if LAND else 4.0,
            axis_config={"color": GREY_B, "include_tip": False},
        )
        if LAND:
            ax.shift(DOWN * 0.3)
        curve = ax.plot(f, color=ACCENT, stroke_width=6)
        self.play(Create(ax), run_time=DUR * 0.25)
        self.play(Create(curve), run_time=DUR * 0.5)
        dot = Dot(color=WHITE).move_to(curve.get_start())
        self.play(FadeIn(dot), run_time=0.2)
        self.play(MoveAlongPath(dot, curve), run_time=DUR * 0.2, rate_func=smooth)
        self.wait(0.1)


class Flow(Scene):
    """params: items = ["Sun", "Plant", "Sugar"]
    vertical: boxes stacked top to bottom; landscape: boxes left to right"""

    def construct(self):
        self.camera.background_color = BG
        items = P.get("items", ["Input", "Process", "Output"])
        step = DUR / (len(items) + 1)
        bw, bh = (3.0, 1.4) if LAND else (10.5, 2.4)
        fs = 36 if LAND else 58
        boxes = VGroup()
        for t in items:
            r = RoundedRectangle(corner_radius=0.25, width=bw, height=bh,
                                 color=ACCENT, stroke_width=5)
            txt = Text(t, font_size=fs, weight=BOLD, color=WHITE).move_to(r)
            if txt.width > bw - 0.6:
                txt.scale_to_fit_width(bw - 0.6)
            boxes.add(VGroup(r, txt))
        if LAND:
            boxes.arrange(RIGHT, buff=0.9)
            if boxes.width > SAFE_W + 1:
                boxes.scale_to_fit_width(SAFE_W + 1)
            boxes.move_to(ORIGIN + DOWN * 0.3)
        else:
            boxes.arrange(DOWN, buff=0.9)
            if boxes.height > SAFE_H:
                boxes.scale_to_fit_height(SAFE_H)
            boxes.move_to(ORIGIN)
        for i, b in enumerate(boxes):
            self.play(FadeIn(b, shift=(LEFT if LAND else UP) * 0.3), run_time=step * 0.6)
            if i > 0:
                prev = boxes[i - 1]
                a = (Arrow(prev.get_right(), b.get_left(), buff=0.05, color=GREY_B, stroke_width=4)
                     if LAND else
                     Arrow(prev.get_bottom(), b.get_top(), buff=0.05, color=GREY_B, stroke_width=4))
                self.play(Create(a), run_time=step * 0.2)
            self.wait(step * 0.2)
        self.wait(step)
