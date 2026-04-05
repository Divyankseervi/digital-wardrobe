"""
shopping.py — Smart Shopping Recommendation Engine
Suggests 3 complementary items to complete an outfit based on detected clothing.
"""

def get_shopping_recommendations(clothing_type: str, color: str, formality: str) -> list:
    """
    Given a detected clothing type, color, and formality level,
    return 3 complementary items to complete the outfit.
    Each item has: name, brand, price, buy_url, image, formality, category
    """
    item = clothing_type.lower()
    color_lower = color.lower()
    formality_lower = formality.lower()

    # ── Color Harmony Map ──
    color_complements = {
        "black":       ["White", "Grey", "Navy"],
        "white":       ["Black", "Navy", "Charcoal"],
        "navy":        ["White", "Khaki", "Burgundy"],
        "blue":        ["White", "Beige", "Grey"],
        "red":         ["Black", "White", "Navy"],
        "grey":        ["White", "Black", "Navy"],
        "green":       ["Khaki", "White", "Brown"],
        "brown":       ["Cream", "White", "Olive"],
        "beige":       ["Navy", "Brown", "White"],
        "maroon":      ["Grey", "White", "Beige"],
        "pink":        ["Grey", "White", "Navy"],
        "olive":       ["White", "Cream", "Brown"],
        "cream":       ["Navy", "Brown", "Olive"],
        "khaki":       ["Navy", "White", "Burgundy"],
        "charcoal":    ["White", "Light Blue", "Burgundy"],
    }

    # Get harmonious colors or fallback
    accent_colors = color_complements.get(color_lower, ["White", "Black", "Grey"])

    # ── Outfit Templates by Clothing Category ──
    # Each template: (category_keyword, list of 3 complementary items)

    # FORMAL items
    formal_templates = {
        "suit": [
            {"name": f"{accent_colors[0]} Dress Shirt",       "category": "Shirt",  "brand": "Van Heusen",  "price": 1899, "image": "https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[1]} Silk Tie",           "category": "Tie",    "brand": "Park Avenue", "price": 999,  "image": "https://images.unsplash.com/photo-1589756823695-278bc923a203?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[2]} Oxford Shoes",       "category": "Shoes",  "brand": "Hush Puppies","price": 4499, "image": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&h=500&fit=crop"},
        ],
        "tie": [
            {"name": f"{accent_colors[0]} Formal Shirt",      "category": "Shirt",  "brand": "Arrow",       "price": 1799, "image": "https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[1]} Blazer",             "category": "Blazer", "brand": "Raymond",     "price": 5999, "image": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop"},
            {"name": f"Charcoal Dress Pants",                  "category": "Pants",  "brand": "Van Heusen",  "price": 2499, "image": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=500&fit=crop"},
        ],
        "trench coat": [
            {"name": f"{accent_colors[0]} Turtleneck",        "category": "Top",    "brand": "Marks & Spencer","price": 1999,"image": "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[1]} Slim Trousers",     "category": "Pants",  "brand": "Arrow",       "price": 2299, "image": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[2]} Chelsea Boots",      "category": "Shoes",  "brand": "Clarks",      "price": 5999, "image": "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400&h=500&fit=crop"},
        ],
        "loafer": [
            {"name": f"{accent_colors[0]} Chinos",             "category": "Pants",  "brand": "Allen Solly", "price": 1999, "image": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[1]} Oxford Shirt",       "category": "Shirt",  "brand": "Van Heusen",  "price": 1599, "image": "https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[2]} Leather Belt",       "category": "Belt",   "brand": "Hidesign",    "price": 1299, "image": "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=400&h=500&fit=crop"},
        ],
    }

    # SEMI-FORMAL items
    semi_formal_templates = {
        "cardigan": [
            {"name": f"{accent_colors[0]} Oxford Shirt",      "category": "Shirt",  "brand": "Allen Solly", "price": 1599, "image": "https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[1]} Chinos",             "category": "Pants",  "brand": "U.S. Polo",   "price": 1899, "image": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[2]} Loafers",            "category": "Shoes",  "brand": "Hush Puppies","price": 3499, "image": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&h=500&fit=crop"},
        ],
        "blazer": [
            {"name": f"{accent_colors[0]} Crew-Neck Tee",     "category": "Tshirt", "brand": "H&M",         "price": 799,  "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[1]} Slim Jeans",         "category": "Jeans",  "brand": "Levi's",      "price": 2499, "image": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[2]} White Sneakers",     "category": "Shoes",  "brand": "Puma",        "price": 3999, "image": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=500&fit=crop"},
        ],
        "polo": [
            {"name": f"{accent_colors[1]} Chinos",             "category": "Pants",  "brand": "Allen Solly", "price": 1799, "image": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[0]} Canvas Sneakers",    "category": "Shoes",  "brand": "Converse",    "price": 2999, "image": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[2]} Leather Watch",      "category": "Watch",  "brand": "Fossil",      "price": 5999, "image": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=500&fit=crop"},
        ],
        "jacket": [
            {"name": f"{accent_colors[0]} Henley T-Shirt",    "category": "Tshirt", "brand": "Jack & Jones","price": 999,  "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[1]} Jogger Pants",       "category": "Pants",  "brand": "Adidas",      "price": 2499, "image": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[2]} Running Shoes",      "category": "Shoes",  "brand": "Nike",        "price": 4999, "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop"},
        ],
    }

    # CASUAL items
    casual_templates = {
        "jersey": [
            {"name": f"{accent_colors[0]} Joggers",           "category": "Pants",  "brand": "Nike",        "price": 2299, "image": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[1]} Running Shoes",     "category": "Shoes",  "brand": "Adidas",      "price": 4499, "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[2]} Sports Watch",       "category": "Watch",  "brand": "Casio",       "price": 2999, "image": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=500&fit=crop"},
        ],
        "t-shirt": [
            {"name": f"{accent_colors[0]} Slim Jeans",        "category": "Jeans",  "brand": "Levi's",      "price": 2499, "image": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[1]} Canvas Sneakers",   "category": "Shoes",  "brand": "Vans",        "price": 3499, "image": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[2]} Baseball Cap",       "category": "Cap",    "brand": "H&M",         "price": 599,  "image": "https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=400&h=500&fit=crop"},
        ],
        "jean": [
            {"name": f"{accent_colors[0]} Graphic Tee",       "category": "Tshirt", "brand": "Bewakoof",    "price": 599,  "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[1]} Sneakers",           "category": "Shoes",  "brand": "Puma",        "price": 3499, "image": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[2]} Denim Jacket",       "category": "Jacket", "brand": "Levi's",      "price": 3999, "image": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&h=500&fit=crop"},
        ],
        "sneaker": [
            {"name": f"{accent_colors[0]} Joggers",           "category": "Pants",  "brand": "Nike",        "price": 2299, "image": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[1]} Hoodie",             "category": "Hoodie", "brand": "H&M",         "price": 1499, "image": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[2]} Crossbody Bag",      "category": "Bag",    "brand": "Wildcraft",   "price": 1299, "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop"},
        ],
        "sweatshirt": [
            {"name": f"{accent_colors[0]} Track Pants",       "category": "Pants",  "brand": "Adidas",      "price": 1999, "image": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[1]} Running Shoes",     "category": "Shoes",  "brand": "Nike",        "price": 4999, "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[2]} Beanie Cap",         "category": "Cap",    "brand": "Decathlon",   "price": 399,  "image": "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=400&h=500&fit=crop"},
        ],
        "miniskirt": [
            {"name": f"{accent_colors[0]} Crop Top",          "category": "Top",    "brand": "Zara",        "price": 1299, "image": "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[1]} Ankle Boots",       "category": "Shoes",  "brand": "Aldo",        "price": 4999, "image": "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400&h=500&fit=crop"},
            {"name": f"{accent_colors[2]} Clutch Bag",         "category": "Bag",    "brand": "Lavie",       "price": 1499, "image": "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&h=500&fit=crop"},
        ],
    }

    # ── Find the best template match ──
    recommendations = None

    # Select template pool based on formality
    if "formal" == formality_lower:
        template_pool = formal_templates
    elif "semi-formal" == formality_lower:
        template_pool = semi_formal_templates
    else:
        template_pool = casual_templates

    # Try to find a keyword match in the detected clothing type
    for keyword, items in template_pool.items():
        if keyword in item:
            recommendations = items
            break

    # Fallback: if no match, use a generic outfit
    if not recommendations:
        if formality_lower == "formal":
            recommendations = [
                {"name": f"{accent_colors[0]} Dress Shirt",   "category": "Shirt",  "brand": "Van Heusen",  "price": 1899, "image": "https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=400&h=500&fit=crop"},
                {"name": f"{accent_colors[1]} Dress Pants",   "category": "Pants",  "brand": "Arrow",       "price": 2299, "image": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=500&fit=crop"},
                {"name": f"{accent_colors[2]} Oxford Shoes",   "category": "Shoes",  "brand": "Hush Puppies","price": 4499, "image": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&h=500&fit=crop"},
            ]
        elif formality_lower == "semi-formal":
            recommendations = [
                {"name": f"{accent_colors[0]} Button-Down Shirt","category": "Shirt","brand": "Allen Solly", "price": 1599, "image": "https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=400&h=500&fit=crop"},
                {"name": f"{accent_colors[1]} Chinos",         "category": "Pants",  "brand": "U.S. Polo",   "price": 1899, "image": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=500&fit=crop"},
                {"name": f"{accent_colors[2]} Loafers",        "category": "Shoes",  "brand": "Clarks",      "price": 3999, "image": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&h=500&fit=crop"},
            ]
        else:
            recommendations = [
                {"name": f"{accent_colors[0]} Graphic Tee",   "category": "Tshirt", "brand": "Bewakoof",    "price": 599,  "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop"},
                {"name": f"{accent_colors[1]} Joggers",        "category": "Pants",  "brand": "Nike",        "price": 2299, "image": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=500&fit=crop"},
                {"name": f"{accent_colors[2]} Sneakers",       "category": "Shoes",  "brand": "Puma",        "price": 3499, "image": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=500&fit=crop"},
            ]

    # ── Enrich each recommendation with buy URL + formality ──
    enriched = []
    for rec in recommendations:
        search_query = f"{rec['name']} {rec['brand']}".replace(" ", "+")
        rec["formality"] = formality
        rec["buy_url"] = f"https://www.myntra.com/{rec['category'].lower()}?rawQuery={search_query}"
        enriched.append(rec)

    return enriched
