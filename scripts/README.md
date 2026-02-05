# Stimuli Generation Scripts

This directory contains utility scripts for generating and processing the face stimuli used in the experiment.

## Overview

The stimuli generation process consists of two steps:

1. **Generate base face images** using FaceGen software → `generate_faces.py`
2. **Add colored backgrounds** to create red/blue group versions → `generate_colored_faces.py`

---

## Scripts

### 1. `generate_faces.py`

**Purpose:** Generates the base face images using FaceGen software.

**Output:**
- 100 face images with transparent backgrounds (PNG format)
- Saved to: `stimuli/fg_faces/face_001.png` through `face_100.png`

**Dependencies:**
- FaceGen software (specify version used)
- Python 3.x
- [Add any specific Python packages required]

**Usage:**
```bash
python generate_faces.py
```

**Configuration:**
- [Document any parameters or configuration options]
- [Include FaceGen settings used (e.g., diversity parameters, gender mix, etc.)]

**Notes:**
- This script interfaces with FaceGen to programmatically generate diverse face images
- The output images have transparent backgrounds, which are replaced in the next step
- [Add any other relevant information about the generation process]

---

### 2. `generate_colored_faces.py`

**Purpose:** Takes the transparent-background face images and creates red and blue background versions for the experiment's group manipulation.

**Input:**
- Source images: `stimuli/fg_faces/face_001.png` through `face_100.png`
- Images must have transparent backgrounds (PNG with alpha channel)

**Output:**
- 200 colored face images (PNG format):
  - `stimuli/faces/face_000_red.png` through `face_099_red.png` (red backgrounds)
  - `stimuli/faces/face_000_blue.png` through `face_099_blue.png` (blue backgrounds)

**Dependencies:**
- Python 3.x
- Pillow (PIL) library: `pip install Pillow`

**Usage:**
```bash
python generate_colored_faces.py
```

**Configuration:**
You can modify these constants at the top of the script:
```python
INPUT_DIR = "stimuli/fg_faces"      # Source images location
OUTPUT_DIR = "stimuli/faces"        # Output location
RED_COLOR = (255, 0, 0)            # RGB values for red background
BLUE_COLOR = (0, 0, 255)           # RGB values for blue background
```

**How it works:**
1. Opens each PNG image with transparency
2. Creates a solid-colored background (red or blue)
3. Composites the face image over the colored background using the alpha channel
4. Saves both red and blue versions for each face
5. Face numbering changes: input `face_001.png` → output `face_000_red.png` and `face_000_blue.png`

**Notes:**
- Preserves the face image quality while replacing only the transparent background
- Creates both versions simultaneously to ensure consistency
- Output images use 0-indexed numbering (000-099) vs input 1-indexed (001-100)

---

## Full Pipeline

To regenerate all stimuli from scratch:

```bash
# Step 1: Generate base faces (requires FaceGen)
cd scripts
python generate_faces.py

# Step 2: Add colored backgrounds
python generate_colored_faces.py
```

**Result:** 100 source images → 200 experiment-ready images (100 red + 100 blue)

---

## File Structure

```
social-exposure-theory/
├── scripts/
│   ├── generate_faces.py              # FaceGen image generation
│   ├── generate_colored_faces.py      # Background coloring
│   └── README.md                       # This file
└── stimuli/
    ├── fg_faces/                       # Source images (transparent)
    │   ├── face_001.png
    │   └── ...                         # 100 files total
    └── faces/                          # Experiment images (colored)
        ├── face_000_red.png
        ├── face_000_blue.png
        └── ...                         # 200 files total
```

---

## Development Notes

- **Date Created:** 2026-02-05
- **FaceGen Version:** [To be filled in]
- **Python Version:** 3.12.3
- **Pillow Version:** 10.x (verify with `pip show Pillow`)

## Troubleshooting

**Issue:** `ModuleNotFoundError: No module named 'PIL'`
- **Solution:** Install Pillow: `pip install Pillow`

**Issue:** Images don't have colored backgrounds
- **Solution:** Ensure input images have transparent backgrounds (RGBA mode)
- **Check:** Open an image in an image editor and verify transparency

**Issue:** Wrong number of output files
- **Solution:** Verify you have exactly 100 input files numbered 001-100
- **Check:** `ls stimuli/fg_faces/ | wc -l` should output 100

---

## Future Improvements

- [ ] Add command-line arguments for input/output directories
- [ ] Support batch processing with progress bars
- [ ] Add image validation (check dimensions, format, etc.)
- [ ] Create combined script that runs both steps
- [ ] Add option to adjust background opacity
