import cv2
import numpy as np
import json
import os

def analyze():
    scratch_dir = r"C:\Users\CHA\Desktop\knitwear-platform\knitwear-platform\scratch"
    files = [f for f in os.listdir(scratch_dir) if f.startswith("media__") and f.endswith((".jpg", ".png"))]
    print("Scratch media files:", files)
    
    for filename in files:
        filepath = os.path.join(scratch_dir, filename)
        img = cv2.imread(filepath, cv2.IMREAD_UNCHANGED)
        if img is None:
            print(f"Failed to read {filename}")
            continue
        print(f"\nAnalyzing file: {filename}")
        print(f"  Shape: {img.shape}")
        
        # Check corners to see what background color is
        h, w = img.shape[:2]
        corners = [
            img[0, 0],
            img[0, w - 1],
            img[h - 1, 0],
            img[h - 1, w - 1]
        ]
        print("  Corners (B, G, R, [A]):", [c.tolist() for c in corners])

if __name__ == "__main__":
    analyze()
