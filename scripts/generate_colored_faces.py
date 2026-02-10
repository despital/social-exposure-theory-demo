"""
Script to generate face images with red and blue backgrounds.
Discovers all PNG files in the input directory and outputs
red and blue background versions to the output directory.
Works with PNG images that have transparent backgrounds.

Usage:
    python generate_colored_faces.py <input_dir> [output_dir]

    input_dir   - Directory containing face PNG images
    output_dir  - Where to save colored versions (default: stimuli/faces)
"""

from PIL import Image
import glob
import os
import sys

# Defaults
DEFAULT_OUTPUT_DIR = "stimuli/faces"
RED_COLOR = (255, 0, 0)
BLUE_COLOR = (0, 0, 255)


def create_colored_versions(face_img, output_path_red, output_path_blue):
    """Create red and blue background versions of a face image."""
    has_transparency = (
        face_img.mode in ('RGBA', 'LA')
        or (face_img.mode == 'P' and 'transparency' in face_img.info)
    )

    # === Create RED version ===
    red_bg = Image.new('RGB', face_img.size, RED_COLOR)
    if has_transparency:
        face_rgba = face_img.convert('RGBA')
        red_bg.paste(face_rgba, (0, 0), face_rgba)
    else:
        red_bg = face_img.convert('RGB')
    red_bg.save(output_path_red, 'PNG')
    print(f"  Created RED: {output_path_red}")

    # === Create BLUE version ===
    blue_bg = Image.new('RGB', face_img.size, BLUE_COLOR)
    if has_transparency:
        face_rgba = face_img.convert('RGBA')
        blue_bg.paste(face_rgba, (0, 0), face_rgba)
    else:
        blue_bg = face_img.convert('RGB')
    blue_bg.save(output_path_blue, 'PNG')
    print(f"  Created BLUE: {output_path_blue}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: python {os.path.basename(__file__)} <input_dir> [output_dir]")
        sys.exit(1)

    input_dir = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_OUTPUT_DIR

    if not os.path.isdir(input_dir):
        print(f"Error: {input_dir} is not a valid directory")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    # Discover all PNG files in the input directory
    png_files = sorted(glob.glob(os.path.join(input_dir, "*.png")))

    if not png_files:
        print(f"No PNG files found in {input_dir}")
        sys.exit(1)

    print(f"Input directory:  {input_dir}")
    print(f"Output directory: {output_dir}")
    print(f"Found {len(png_files)} PNG files")
    print()

    count = 0
    for filepath in png_files:
        name = os.path.splitext(os.path.basename(filepath))[0]
        output_path_red = os.path.join(output_dir, f"{name}_red.png")
        output_path_blue = os.path.join(output_dir, f"{name}_blue.png")

        face_img = Image.open(filepath)
        create_colored_versions(face_img, output_path_red, output_path_blue)
        count += 1

    print()
    print(f"Done! Generated {count * 2} images ({count} red + {count} blue)")
    print(f"Output location: {output_dir}/")
