import cv2
import numpy as np
import tensorflow as tf
from sklearn.cluster import KMeans
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input, decode_predictions
from tensorflow.keras.preprocessing import image
import webcolors
from collections import Counter
from shopping import get_shopping_recommendations
import os
import shutil
import requests
from pydantic import BaseModel

# FastAPI Imports
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Initialize the App
app = FastAPI(title="Smart Wardrobe AI API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# ==========================================
# 1. LOAD MODEL (Happens once when server starts)
# ==========================================
print("Loading AI Model... please wait.")
model = MobileNetV2(weights='imagenet')
print("Model loaded successfully!")

# ==========================================
# 2. HELPER FUNCTIONS
# ==========================================

def get_closest_color_name(requested_color):
    min_colors = {}
    for name in webcolors.names("css3"):
        r_c, g_c, b_c = webcolors.name_to_rgb(name)
        rd = (r_c - requested_color[0]) ** 2
        gd = (g_c - requested_color[1]) ** 2
        bd = (b_c - requested_color[2]) ** 2
        min_colors[(rd + gd + bd)] = name
    return min_colors[min(min_colors.keys())].capitalize()

def extract_dominant_color(image_path, k=4):
    img = cv2.imread(image_path)
    if img is None: return "Unknown"
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
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
    img = image.load_img(image_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)
    predictions = model.predict(img_array, verbose=0)
    decoded = decode_predictions(predictions, top=1)[0]
    return decoded[0][1].replace('_', ' ').capitalize()

def determine_formality(clothing_type):
    item = clothing_type.lower()
    casual = ['jean', 'jersey', 't-shirt', 'sneaker', 'sweatshirt', 'miniskirt']
    formal = ['suit', 'trench coat', 'tie', 'loafer', 'oxford', 'bow tie']
    semi_formal = ['cardigan', 'polo', 'blazer', 'stole', 'jacket']
    
    for word in formal:
        if word in item: return "Formal"
    for word in semi_formal:
        if word in item: return "Semi-Formal"
    return "Casual"

# ==========================================
# 3. API ENDPOINT
# ==========================================

class AnalyzeRequest(BaseModel):
    imageUrl: str

@app.post("/analyze")
async def analyze_image(request: AnalyzeRequest):
    """
    Endpoint: Receives JSON with imageUrl, downloads it, runs analysis, 
    returns JSON, and cleans up.
    """
    
    image_url = request.imageUrl
    if not image_url:
        raise HTTPException(status_code=400, detail="Image URL is required")

    # 1. Download the image temporarily
    temp_filename = f"temp_{os.urandom(4).hex()}.jpg"
    try:
        print(f"Downloading image from: {image_url[:100]}...")
        response = requests.get(image_url, stream=True, timeout=15)
        response.raise_for_status()
        with open(temp_filename, 'wb') as out_file:
            shutil.copyfileobj(response.raw, out_file)
        print(f"Image downloaded successfully: {os.path.getsize(temp_filename)} bytes")
    except Exception as e:
        print(f"ERROR downloading image: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to download image: {str(e)}")

    try:
        # 2. Run your existing AI logic
        clothing_type = classify_clothing_type(temp_filename)
        dominant_color = extract_dominant_color(temp_filename)
        formality = determine_formality(clothing_type)

        # 3. Get shopping recommendations
        recommendations = get_shopping_recommendations(clothing_type, dominant_color, formality)

        # 4. Create the JSON response
        result = {
            "category": clothing_type, 
            "color": dominant_color,
            "formality": formality,
            "original_type": clothing_type,
            "shopping_recommendations": recommendations
        }
        print(f"Analysis result: category={clothing_type}, color={dominant_color}, formality={formality}")
        
    except Exception as e:
        print(f"ERROR during analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

    return JSONResponse(content=result)


class AnalyzeBase64Request(BaseModel):
    imageBase64: str

@app.post("/analyze-base64")
async def analyze_image_base64(request: AnalyzeBase64Request):
    """
    Endpoint: Receives base64-encoded image data directly,
    saves to temp file, runs analysis, returns JSON, and cleans up.
    This avoids needing to download from a URL.
    """
    import base64

    image_data = request.imageBase64
    if not image_data:
        raise HTTPException(status_code=400, detail="imageBase64 is required")

    # Strip data URI prefix if present (e.g. "data:image/jpeg;base64,...")
    if "," in image_data:
        image_data = image_data.split(",", 1)[1]

    temp_filename = f"temp_{os.urandom(4).hex()}.jpg"
    try:
        raw_bytes = base64.b64decode(image_data)
        with open(temp_filename, 'wb') as out_file:
            out_file.write(raw_bytes)
        print(f"Base64 image saved: {len(raw_bytes)} bytes")
    except Exception as e:
        print(f"ERROR decoding base64: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")

    try:
        clothing_type = classify_clothing_type(temp_filename)
        dominant_color = extract_dominant_color(temp_filename)
        formality = determine_formality(clothing_type)
        recommendations = get_shopping_recommendations(clothing_type, dominant_color, formality)

        result = {
            "category": clothing_type,
            "color": dominant_color,
            "formality": formality,
            "original_type": clothing_type,
            "shopping_recommendations": recommendations
        }
        print(f"Base64 analysis result: category={clothing_type}, color={dominant_color}, formality={formality}")

    except Exception as e:
        print(f"ERROR during base64 analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

    return JSONResponse(content=result)


import tempfile

@app.post("/analyze-upload")
async def analyze_upload(file: UploadFile = File(...)):
    """
    Endpoint: Accepts a multipart file upload, saves to temp OS directory,
    runs analysis, returns JSON, cleans up.
    """
    temp_dir = tempfile.gettempdir()
    temp_filename = os.path.join(temp_dir, f"temp_{os.urandom(4).hex()}.jpg")
    try:
        contents = await file.read()
        with open(temp_filename, 'wb') as out_file:
            out_file.write(contents)
        print(f"Upload received: {file.filename}, {len(contents)} bytes")
    except Exception as e:
        print(f"ERROR saving upload: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to save upload: {str(e)}")

    try:
        clothing_type = classify_clothing_type(temp_filename)
        dominant_color = extract_dominant_color(temp_filename)
        formality = determine_formality(clothing_type)

        result = {
            "category": clothing_type,
            "color": dominant_color,
            "formality": formality,
        }
        print(f"Upload analysis: category={clothing_type}, color={dominant_color}, formality={formality}")

    except Exception as e:
        print(f"ERROR during upload analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

    return JSONResponse(content=result)


class RecommendRequest(BaseModel):
    category: str
    color: str
    formality: str

@app.post("/recommend")
async def recommend(request: RecommendRequest):
    """
    Endpoint: Takes known category/color/formality and returns
    shopping recommendations without any AI image processing.
    """
    try:
        recommendations = get_shopping_recommendations(
            request.category, request.color, request.formality
        )
        result = {
            "category": request.category,
            "color": request.color,
            "formality": request.formality,
            "shopping_recommendations": recommendations
        }
        print(f"Recommend: {request.category}, {request.color}, {request.formality} -> {len(recommendations)} items")
        return JSONResponse(content=result)
    except Exception as e:
        print(f"ERROR in recommend: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
def home():
    return {"message": "Smart Wardrobe AI is running!"}

