"""
Background removal and cutout generator for edu-shorts.

Adapted from OpenMontage's bg_remove.py tool.
Converts product images, hardware photos, and logos into transparent PNG cutouts
so they can be composited into Remotion 2D/3D scenes without awkward white/black boxes.

Modes:
1. AI Segmentation (rembg / U2Net): Used if rembg is installed.
2. Color-Key Alpha Matting (PIL): Fallback for solid backgrounds (white, black, custom hex)
   requiring zero extra dependencies.
"""

from __future__ import annotations
import argparse
from pathlib import Path
from PIL import Image


def remove_background(
    input_path: str | Path,
    output_path: str | Path | None = None,
    threshold: int = 240,
    bg_mode: str = "white",
) -> Path:
    """Remove background from an image, outputting a transparent PNG.

    Args:
        input_path: Path to source image.
        output_path: Destination path. Defaults to {stem}_nobg.png.
        threshold: Threshold for solid color detection (0-255).
        bg_mode: "white" (removes near-white), "black" (removes near-black), or "auto".

    Returns:
        Path to output transparent PNG.
    """
    in_p = Path(input_path).resolve()
    if not in_p.exists():
        raise FileNotFoundError(f"Input image not found: {in_p}")

    out_p = Path(output_path).resolve() if output_path else in_p.with_name(f"{in_p.stem}_nobg.png")

    # Try AI background removal if rembg is available
    try:
        import rembg
        with open(in_p, "rb") as f_in:
            data = f_in.read()
            output_data = rembg.remove(data)
            with open(out_p, "wb") as f_out:
                f_out.write(output_data)
        return out_p
    except ImportError:
        pass

    # PIL-based high-quality color-key alpha matting fallback
    img = Image.open(in_p).convert("RGBA")
    datas = img.getdata()

    new_data = []
    if bg_mode == "black":
        for item in datas:
            # Check if near black
            if item[0] < (255 - threshold) and item[1] < (255 - threshold) and item[2] < (255 - threshold):
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
    else:
        # Default near-white removal
        for item in datas:
            if item[0] >= threshold and item[1] >= threshold and item[2] >= threshold:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)

    img.putdata(new_data)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_p, "PNG")
    return out_p


def main():
    parser = argparse.ArgumentParser(description="Remove background from image to create transparent cutout PNG")
    parser.add_argument("input", help="Input image path")
    parser.add_argument("--out", "-o", help="Output PNG path")
    parser.add_argument("--threshold", "-t", type=int, default=240, help="Brightness threshold for solid background removal (default 240)")
    parser.add_argument("--mode", "-m", choices=["white", "black", "auto"], default="white", help="Background color to remove")
    args = parser.parse_args()

    out = remove_background(args.input, args.out, threshold=args.threshold, bg_mode=args.mode)
    print(f"Saved transparent cutout to: {out}")


if __name__ == "__main__":
    main()
