import sys
import json
import cv2
import numpy as np
from sklearn.cluster import KMeans

def process_image(image_path, target_width, n_colors=8):
    # 1. Load Image
    img = cv2.imread(image_path)
    if img is None:
        return json.dumps({"error": "Failed to load image"})
    
    # Convert BGR to RGB
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # 2. Resizing
    h, w, _ = img.shape
    aspect_ratio = h / w
    # Knitting stitches are not perfectly square (usually wider than tall), 
    # but for simplicity we assume square or let user adjust gauge. 
    # To be precise, we should factor in gauge here: Ratio = (RowGauge / StitchGauge)
    # But let's stick to pixel-aspect-ratio for now.
    target_height = int(target_width * aspect_ratio)
    
    # Use INTER_AREA for better decimation (downsampling)
    resized = cv2.resize(img, (target_width, target_height), interpolation=cv2.INTER_AREA)
    
    # 3. Color Quantization
    pixels = resized.reshape(-1, 3)
    kmeans = KMeans(n_clusters=n_colors, random_state=42, n_init=10)
    labels = kmeans.fit_predict(pixels)
    centers = kmeans.cluster_centers_.astype(int)
    
    # Map back to image
    quantized_pixels = centers[labels]
    
    # 4. Generate Grid Data
    # Reshape back to 2D
    grid_pixels = quantized_pixels.reshape(target_height, target_width, 3)
    
    grid_data = []
    
    for row in range(target_height):
        grid_row = []
        for col in range(target_width):
            r, g, b = grid_pixels[row][col]
            hex_color = "#{:02x}{:02x}{:02x}".format(r, g, b)
            grid_row.append({
                "color": hex_color,
                "symbolId": None
            })
        grid_data.append(grid_row)
        
    return json.dumps(grid_data)

if __name__ == "__main__":
    try:
        if len(sys.argv) < 3:
            print(json.dumps([]))
            sys.exit(1)
            
        img_path = sys.argv[1]
        width = int(sys.argv[2])
        colors = int(sys.argv[3]) if len(sys.argv) > 3 else 8
        
        result = process_image(img_path, width, colors)
        print(result)
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
