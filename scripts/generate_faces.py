"""
FaceGen Batch Face Generation Script
Generates 100 counterbalanced face stimuli for social psychology experiments

Design:
- 100 faces total
- Race: 25 African, 25 European, 25 East Asian, 25 South Asian (balanced)
- Gender: 50 male, 50 female (balanced within each race)
- Age: 18-35, naturally skewed toward mid-20s
"""

import subprocess
import pandas as pd
import numpy as np
from pathlib import Path
import os

# Configuration
SDK_BIN = r"C:\FaceGen\SDK\bin\win\x64\vs22\release"
WORKING_DIR = r"C:\FaceGen\SDK\data\csam\Animate\experiment_faces"
FG3_EXE = os.path.join(SDK_BIN, "fg3.exe")
FGBL_EXE = os.path.join(SDK_BIN, "fgbl.exe")

# Create working directory if it doesn't exist
Path(WORKING_DIR).mkdir(parents=True, exist_ok=True)

def generate_age_natural_distribution(n_samples):
    """
    Generate ages with natural distribution skewed toward mid-20s
    Uses beta distribution to create realistic age spread
    """
    # Beta distribution parameters for natural skew toward mid-20s
    # alpha=2, beta=2 creates a bell curve
    ages = np.random.beta(2, 2, n_samples) * (35 - 18) + 18
    ages = np.round(ages).astype(int)
    return ages

def create_design_matrix():
    """
    Create balanced design matrix:
    - 4 races × 25 each = 100
    - Within each race: ~12-13 male, ~12-13 female
    - Ages: naturally distributed 18-35
    """
    races = ['african', 'european', 'eastAsian', 'southAsian']
    design = []
    
    face_id = 1
    for race in races:
        # 25 faces per race
        # Alternate gender to ensure balance: 13 male, 12 female (or vice versa)
        genders = ['male'] * 13 + ['female'] * 12
        np.random.shuffle(genders)  # Randomize order
        
        ages = generate_age_natural_distribution(25)
        
        for gender, age in zip(genders, ages):
            design.append({
                'face_id': f'face_{face_id:03d}',
                'race': race,
                'gender': gender,
                'age': int(age)
            })
            face_id += 1
    
    return pd.DataFrame(design)

def run_command(cmd, description):
    """Run a shell command and handle errors"""
    print(f"  {description}...")
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            check=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"  ERROR: {e}")
        print(f"  STDOUT: {e.stdout}")
        print(f"  STDERR: {e.stderr}")
        return False

def generate_single_face(face_info, working_dir):
    """
    Generate a single face image with specified demographics
    
    Steps:
    1. Create base face with race and gender
    2. Modify age
    3. Apply to mesh
    4. Apply to color map
    5. Setup render config
    6. Render final image
    """
    face_id = face_info['face_id']
    race = face_info['race']
    gender = face_info['gender']
    age = face_info['age']
    
    print(f"\nGenerating {face_id}: {race} {gender} age {age}")
    
    # Change to working directory
    os.chdir(working_dir)
    
    # File names
    base_fg = f"{face_id}_base.fg"
    aged_fg = f"{face_id}_aged.fg"
    mesh_tri = f"{face_id}.tri"
    texture_jpg = f"{face_id}_texture.jpg"
    config_txt = f"{face_id}_config.txt"
    final_png = f"{face_id}.png"
    
    # Step 1: Create base face
    cmd1 = f'"{FG3_EXE}" create random {race} {gender} {base_fg}'
    if not run_command(cmd1, "Creating base face"):
        return False
    
    # Step 2: Modify age
    cmd2 = f'"{FG3_EXE}" controls demographic edit {base_fg} age {age} {aged_fg}'
    if not run_command(cmd2, f"Setting age to {age}"):
        return False
    
    # Step 3: Apply to mesh
    cmd3 = f'"{FG3_EXE}" apply ssm ../Head/HeadHires {aged_fg} {mesh_tri}'
    if not run_command(cmd3, "Applying to mesh"):
        return False
    
    # Step 4: Apply to color map
    cmd4 = f'"{FG3_EXE}" apply scm ../Head/HeadHires {aged_fg} {texture_jpg}'
    if not run_command(cmd4, "Applying to color map"):
        return False
    
    # Step 5: Setup render config
    cmd5 = f'"{FGBL_EXE}" render setup {config_txt} {mesh_tri} {texture_jpg}'
    if not run_command(cmd5, "Setting up render"):
        return False
    
    # Step 6: Render final image
    cmd6 = f'"{FGBL_EXE}" render run {config_txt} {final_png}'
    if not run_command(cmd6, "Rendering final image"):
        return False
    
    print(f"  ✓ Successfully created {final_png}")
    
    # Clean up intermediate files to save space
    for temp_file in [base_fg, aged_fg, mesh_tri, texture_jpg, config_txt]:
        try:
            os.remove(temp_file)
        except:
            pass
    
    return True

def main():
    """Main execution function"""
    print("="*60)
    print("FaceGen Batch Face Generation")
    print("="*60)
    
    # Generate design matrix
    print("\n1. Creating experimental design...")
    design_df = create_design_matrix()
    
    # Save design to CSV
    design_file = os.path.join(WORKING_DIR, "face_design.csv")
    design_df.to_csv(design_file, index=False)
    print(f"   Design saved to: {design_file}")
    
    # Print summary statistics
    print("\n2. Design summary:")
    print(f"   Total faces: {len(design_df)}")
    print(f"\n   Race distribution:")
    print(design_df['race'].value_counts().sort_index())
    print(f"\n   Gender distribution:")
    print(design_df['gender'].value_counts())
    print(f"\n   Age range: {design_df['age'].min()} - {design_df['age'].max()}")
    print(f"   Age mean: {design_df['age'].mean():.1f}")
    print(f"   Age std: {design_df['age'].std():.1f}")
    
    # Generate faces
    print(f"\n3. Generating {len(design_df)} face images...")
    print(f"   Output directory: {WORKING_DIR}")
    print(f"   This will take a while (~2-3 minutes per face)...\n")
    
    success_count = 0
    failed_faces = []
    
    for idx, row in design_df.iterrows():
        success = generate_single_face(row, WORKING_DIR)
        if success:
            success_count += 1
        else:
            failed_faces.append(row['face_id'])
        
        # Progress update
        print(f"\nProgress: {idx + 1}/{len(design_df)} ({100*(idx+1)/len(design_df):.1f}%)")
    
    # Final summary
    print("\n" + "="*60)
    print("GENERATION COMPLETE")
    print("="*60)
    print(f"Successfully generated: {success_count}/{len(design_df)} faces")
    
    if failed_faces:
        print(f"\nFailed faces: {', '.join(failed_faces)}")
        print("Check error messages above for details.")
    
    print(f"\nOutput files:")
    print(f"  - Face images: {WORKING_DIR}\\face_*.jpg")
    print(f"  - Design matrix: {design_file}")
    
if __name__ == "__main__":
    main()
