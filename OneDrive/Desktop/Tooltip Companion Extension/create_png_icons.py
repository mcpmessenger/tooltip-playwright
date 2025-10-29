import sys
from PIL import Image
import os

def resize_icon(input_path, output_path, size):
    """Resize glippy.png to specified size"""
    try:
        img = Image.open(input_path)
        # Use high-quality resampling
        img_resized = img.resize((size, size), Image.Resampling.LANCZOS)
        img_resized.save(output_path, 'PNG', optimize=True)
        print(f"Created {output_path} ({size}x{size})")
        return True
    except Exception as e:
        print(f"Error creating {output_path}: {e}")
        return False

if __name__ == "__main__":
    # Paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(base_dir, 'icons')
    glippy_path = os.path.join(icons_dir, 'glippy.png')
    
    if not os.path.exists(glippy_path):
        print(f"ERROR: {glippy_path} not found!")
        sys.exit(1)
    
    print(f"Creating PNG icons from {glippy_path}...")
    print("")
    
    # Create icons
    sizes = {
        'icon16.png': 16,
        'icon48.png': 48,
        'icon128.png': 128
    }
    
    success = True
    for filename, size in sizes.items():
        output_path = os.path.join(icons_dir, filename)
        if not resize_icon(glippy_path, output_path, size):
            success = False
    
    print("")
    if success:
        print("SUCCESS: All icons created successfully!")
        print("")
        print("Next step: Update manifest.json to use .png files")
    else:
        print("ERROR: Some icons failed to create")
        sys.exit(1)
