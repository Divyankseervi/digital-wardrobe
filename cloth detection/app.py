import cv2
import numpy as np
import tensorflow as tf
from sklearn.cluster import KMeans
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input, decode_predictions
from tensorflow.keras.preprocessing import image
import webcolors
from collections import Counter
import os

# Suppress annoying TensorFlow info messages in the terminal
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# ==========================================
# 1. LOAD PRE-TRAINED CLASSIFICATION MODEL
# ==========================================
model = MobileNetV2(weights='imagenet')

# ==========================================
# 2. HELPER FUNCTIONS
# ==========================================

def get_closest_color_name(requested_color):
    """Converts an RGB tuple into a human-readable color name."""
    min_colors = {}
    # Using the new updated webcolors syntax!
    for name in webcolors.names("css3"):
        r_c, g_c, b_c = webcolors.name_to_rgb(name)
        rd = (r_c - requested_color[0]) ** 2
        gd = (g_c - requested_color[1]) ** 2
        bd = (b_c - requested_color[2]) ** 2
        min_colors[(rd + gd + bd)] = name
    return min_colors[min(min_colors.keys())].capitalize()

def extract_dominant_color(image_path, k=4):
    """Extracts dominant color using K-Means clustering."""
    img = cv2.imread(image_path)
    if img is None:
        return "Image not found"
        
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Crop the center to avoid background colors
    h, w, _ = img.shape
    center_img = img[int(h*0.2):int(h*0.8), int(w*0.2):int(w*0.8)]
    
    pixels = center_img.reshape((-1, 3))
    
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(pixels)
    
    counts = Counter(kmeans.labels_)
    dominant_cluster = max(counts, key=counts.get)
    dominant_rgb = kmeans.cluster_centers_[dominant_cluster]
    
    return get_closest_color_name(dominant_rgb)

def classify_clothing_type(image_path):
    """Classifies clothing type using MobileNetV2."""
    try:
        img = image.load_img(image_path, target_size=(224, 224))
    except FileNotFoundError:
        return "Error: Image file not found."
        
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)
    
    predictions = model.predict(img_array, verbose=0)
    decoded = decode_predictions(predictions, top=1)[0]
    
    return decoded[0][1].replace('_', ' ').capitalize()

def determine_formality(clothing_type):
    """Rule-based mapper for formality."""
    item = clothing_type.lower()
    
    casual_keywords = ['jean', 'jersey', 't-shirt', 'sneaker', 'sweatshirt', 'miniskirt', 'sarong']
    formal_keywords = ['suit', 'trench coat', 'tie', 'loafer', 'oxford', 'bow tie']
    semi_formal_keywords = ['cardigan', 'polo', 'blazer', 'stole']
    
    for word in formal_keywords:
        if word in item: return "Formal"
        
    for word in semi_formal_keywords:
        if word in item: return "Semi-Formal"
        
    return "Casual"

# ==========================================
# 3. MAIN PIPELINE
# ==========================================

def analyze_clothing(image_path):
    """Runs the full pipeline and outputs structured metadata."""
    print(f"Analyzing {image_path}...")
    
    clothing_type = classify_clothing_type(image_path)
    if "Error" in clothing_type:
        return {"error": "Could not find the image. Did you name it correctly?"}
        
    dominant_color = extract_dominant_color(image_path)
    formality = determine_formality(clothing_type)
    
    metadata = {
        "type": clothing_type,
        "color": dominant_color,
        "formality": formality
    }
    
    return metadata

# ==========================================
# 4. EXECUTION
# ==========================================
if __name__ == "__main__":
    # Ensure you still have your 'test_image.jpg' ready!
    result = analyze_clothing("test_image.jpg")
    print("\n--- Final Wardrobe Metadata ---")
    print(result)