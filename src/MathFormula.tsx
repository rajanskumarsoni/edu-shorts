import React from "react";
import katex from "katex";

export interface MathFormulaProps {
  equation?: string;
  color?: string;
  accent?: string;
  fontSize?: number | string;
  displayMode?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Clean up LaTeX input string to handle accidental double escapes,
 * surrounding quotes, or raw markdown artifacts.
 */
export function cleanLatexString(raw: string): string {
  if (!raw) return "";
  let s = raw.trim();

  // Strip leading and trailing quotes
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }

  // If the string starts and ends with $$ or $, strip them
  if (s.startsWith("$$") && s.endsWith("$$") && s.length >= 4) {
    s = s.slice(2, -2).trim();
  } else if (s.startsWith("$") && s.endsWith("$") && s.length >= 2) {
    s = s.slice(1, -1).trim();
  }

  // Convert double backslashes before commands into single backslashes
  // e.g. \\pi -> \pi, \\mathbf -> \mathbf
  s = s.replace(/\\\\([a-zA-Z])/g, (_, letter) => "\\" + letter);

  return s;
}

/**
 * MathFormula — High-Fidelity KaTeX Equation Renderer for Remotion.
 *
 * Renders mathematical expressions, Greek symbols, fractions, vectors,
 * and equations with publication-quality KaTeX typography.
 */
export const MathFormula: React.FC<MathFormulaProps> = ({
  equation,
  color = "#FFFFFF",
  accent = "#00F0FF",
  fontSize = 32,
  displayMode = true,
  style,
  className,
}) => {
  if (!equation) return null;

  const cleaned = cleanLatexString(equation);

  let renderedHtml = "";
  try {
    renderedHtml = katex.renderToString(cleaned, {
      displayMode,
      throwOnError: false,
    });
  } catch (err) {
    renderedHtml = `<span style="color: ${color}; font-family: monospace;">${cleaned}</span>`;
  }

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        fontSize,
        lineHeight: 1.25,
        letterSpacing: "0.02em",
        padding: "10px 22px",
        borderRadius: 16,
        background: "rgba(10, 15, 28, 0.88)",
        border: `1.5px solid ${accent}55`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 0 16px ${accent}11`,
        backdropFilter: "blur(12px)",
        maxWidth: "100%",
        overflowX: "hidden",
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
