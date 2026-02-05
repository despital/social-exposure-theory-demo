"""
Script to generate face images with red and blue backgrounds
Reads from stimuli/fg_faces/ and outputs to stimuli/faces/
Creates BOTH red and blue versions of ALL 100 images
Works with PNG images that have transparent backgrounds
"""

from PIL import Image
import os

# Configuration
INPUT_DIR = "stimuli/fg_faces"
OUTPUT_DIR = "stimuli/faces"
RED_COLOR = (255, 0, 0)  # Classic red background
BLUE_COLOR = (0, 0, 255)  # Classic blue background

# Create output directory if it doesn't exist
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("Generating colored face images with transparent backgrounds...")
print(f"Input directory: {INPUT_DIR}")
print(f"Output directory: {OUTPUT_DIR}")
print(f"Creating both RED and BLUE versions of all 100 images")
print()

# Process ALL 100 images and create BOTH red and blue versions
print("Processing all images (face_001.png to face_100.png)...")
for i in range(100):
    input_num = i + 1  # fg_faces uses 001-100
    output_num = i     # output uses 000-099

    input_path = os.path.join(INPUT_DIR, f"face_{str(input_num).zfill(3)}.png")
    output_path_red = os.path.join(OUTPUT_DIR, f"face_{str(output_num).zfill(3)}_red.png")
    output_path_blue = os.path.join(OUTPUT_DIR, f"face_{str(output_num).zfill(3)}_blue.png")

    if os.path.exists(input_path):
        # Open the face image (keep alpha channel if present)
        face_img = Image.open(input_path)

        # === Create RED version ===
        # Create a red background
        red_bg = Image.new('RGB', face_img.size, RED_COLOR)

        # If image has transparency, composite it over the red background
        if face_img.mode in ('RGBA', 'LA') or (face_img.mode == 'P' and 'transparency' in face_img.info):
            # Convert to RGBA if needed
            face_rgba = face_img.convert('RGBA')
            # Composite the face over the red background using alpha channel
            red_bg.paste(face_rgba, (0, 0), face_rgba)
        else:
            # No transparency, just convert and paste
            red_bg = face_img.convert('RGB')

        red_bg.save(output_path_red, 'PNG')
        print(f"  Created RED: {output_path_red}")

        # === Create BLUE version ===
        # Create a blue background
        blue_bg = Image.new('RGB', face_img.size, BLUE_COLOR)

        # If image has transparency, composite it over the blue background
        if face_img.mode in ('RGBA', 'LA') or (face_img.mode == 'P' and 'transparency' in face_img.info):
            # Convert to RGBA if needed
            face_rgba = face_img.convert('RGBA')
            # Composite the face over the blue background using alpha channel
            blue_bg.paste(face_rgba, (0, 0), face_rgba)
        else:
            # No transparency, just convert and paste
            blue_bg = face_img.convert('RGB')

        blue_bg.save(output_path_blue, 'PNG')
        print(f"  Created BLUE: {output_path_blue}")
    else:
        print(f"  WARNING: {input_path} not found")

print()
print("Done! Generated 200 face images (100 red + 100 blue versions)")
print(f"Output location: {OUTPUT_DIR}/")
