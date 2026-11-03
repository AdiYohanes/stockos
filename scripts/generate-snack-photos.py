import os
import io
import hashlib
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join(os.environ.get("CLAUDE_JOB_DIR", "."), "tmp", "snack_photos")
os.makedirs(OUT_DIR, exist_ok=True)

def draw_beng_beng():
    img = Image.new("RGBA", (1024, 1024), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)
    # Background card
    d.rounded_rectangle([40, 40, 984, 984], radius=48, fill=(254, 243, 199, 255), outline=(30, 41, 59, 255), width=16)

    # Candy wrapper background (Red & Gold)
    d.rounded_rectangle([140, 360, 884, 680], radius=24, fill=(185, 28, 28, 255), outline=(30, 41, 59, 255), width=12)
    # Gold decorative stripes
    d.polygon([(140, 420), (320, 360), (280, 360), (140, 400)], fill=(245, 158, 11, 255))
    d.polygon([(140, 620), (840, 360), (884, 360), (884, 390), (140, 670)], fill=(245, 158, 11, 255))
    d.polygon([(300, 680), (884, 480), (884, 520), (380, 680)], fill=(217, 119, 6, 255))

    # Chocolate bar popping out on the right
    d.rounded_rectangle([720, 420, 930, 620], radius=16, fill=(69, 26, 3, 255), outline=(30, 41, 59, 255), width=10)
    # Crispy waffle texture dots
    for x in range(745, 910, 32):
        for y in range(445, 600, 30):
            d.ellipse([x, y, x+14, y+14], fill=(217, 119, 6, 255))

    # Central Beng Beng brand text banner
    d.rounded_rectangle([180, 460, 740, 590], radius=20, fill=(254, 240, 138, 255), outline=(30, 41, 59, 255), width=10)
    # Text: BENG-BENG
    try:
        font = ImageFont.truetype("arialbd.ttf", 90)
        font_sub = ImageFont.truetype("arialbd.ttf", 36)
    except Exception:
        font = ImageFont.load_default()
        font_sub = font

    d.text((220, 470), "beng-beng", fill=(185, 28, 28, 255), font=font)

    # 4 Kelezatan badge
    d.rounded_rectangle([200, 615, 680, 665], radius=12, fill=(245, 158, 11, 255), outline=(30, 41, 59, 255), width=6)
    d.text((220, 622), "WAFER • KARAMEL • KRISPI • COKELAT", fill=(69, 26, 3, 255), font=font_sub)

    # Top tag
    d.rounded_rectangle([180, 220, 420, 300], radius=16, fill=(220, 38, 38, 255), outline=(30, 41, 59, 255), width=8)
    d.text((210, 235), "SNACK", fill=(255, 255, 255, 255), font=font_sub)
    return img

def draw_better():
    img = Image.new("RGBA", (1024, 1024), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)
    # Background card
    d.rounded_rectangle([40, 40, 984, 984], radius=48, fill=(254, 242, 242, 255), outline=(30, 41, 59, 255), width=16)

    # Red wrapping wrapper
    d.rounded_rectangle([120, 320, 904, 720], radius=28, fill=(220, 38, 38, 255), outline=(30, 41, 59, 255), width=12)
    # Yellow dynamic waves
    d.chord([100, 260, 920, 760], start=30, end=150, fill=(251, 191, 36, 255), outline=(30, 41, 59, 255), width=10)

    # Round Sandwich Biscuit graphic on the left
    # Bottom biscuit
    d.ellipse([180, 400, 440, 640], fill=(62, 39, 35, 255), outline=(30, 41, 59, 255), width=10)
    # Vanilla cream layer
    d.ellipse([190, 415, 430, 625], fill=(255, 251, 235, 255), outline=(30, 41, 59, 255), width=6)
    # Top biscuit
    d.ellipse([200, 430, 420, 610], fill=(62, 39, 35, 255), outline=(30, 41, 59, 255), width=8)
    # Chocolate drizzles on biscuit
    d.arc([230, 460, 390, 580], 45, 220, fill=(251, 191, 36, 255), width=8)

    # "BETTER" text on the right
    try:
        font = ImageFont.truetype("arialbd.ttf", 110)
        font_sub = ImageFont.truetype("arialbd.ttf", 34)
    except Exception:
        font = ImageFont.load_default()
        font_sub = font

    # Shadow
    d.text((475, 435), "BETTER", fill=(30, 41, 59, 255), font=font)
    d.text((470, 430), "BETTER", fill=(254, 240, 138, 255), font=font)

    d.rounded_rectangle([470, 560, 850, 620], radius=12, fill=(255, 255, 255, 255), outline=(30, 41, 59, 255), width=6)
    d.text((490, 572), "SANDWICH BISKUIT", fill=(220, 38, 38, 255), font=font_sub)

    # Top tag
    d.rounded_rectangle([180, 180, 440, 260], radius=16, fill=(217, 119, 6, 255), outline=(30, 41, 59, 255), width=8)
    d.text((210, 195), "BISKUIT", fill=(255, 255, 255, 255), font=font_sub)
    return img

def draw_okky_jelly():
    img = Image.new("RGBA", (1024, 1024), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)
    # Background card
    d.rounded_rectangle([40, 40, 984, 984], radius=48, fill=(253, 242, 248, 255), outline=(30, 41, 59, 255), width=16)

    # Straw (striped green & white)
    d.line([(580, 180), (660, 80)], fill=(16, 185, 129, 255), width=28)
    d.line([(580, 180), (520, 360)], fill=(16, 185, 129, 255), width=28)

    # Cup body (Tapered polygon)
    cup_coords = [(340, 340), (684, 340), (620, 820), (404, 820)]
    d.polygon(cup_coords, fill=(244, 114, 182, 255), outline=(30, 41, 59, 255))
    # Outer stroke
    d.line([(340, 340), (684, 340), (620, 820), (404, 820), (340, 340)], fill=(30, 41, 59, 255), width=12)

    # Jelly liquid wave inside
    d.chord([360, 400, 668, 540], 0, 180, fill=(236, 72, 153, 255))

    # Blue foil lid on top
    d.rounded_rectangle([310, 310, 714, 360], radius=12, fill=(14, 165, 233, 255), outline=(30, 41, 59, 255), width=10)

    # Brand badge in center of cup
    d.ellipse([420, 480, 604, 664], fill=(255, 255, 255, 255), outline=(30, 41, 59, 255), width=8)

    try:
        font_big = ImageFont.truetype("arialbd.ttf", 64)
        font_med = ImageFont.truetype("arialbd.ttf", 36)
        font_sub = ImageFont.truetype("arialbd.ttf", 30)
    except Exception:
        font_big = ImageFont.load_default()
        font_med = font_big
        font_sub = font_big

    d.text((440, 520), "OKKY", fill=(219, 39, 119, 255), font=font_big)
    d.text((450, 590), "JELLY", fill=(16, 185, 129, 255), font=font_med)

    # Fruit label banner
    d.rounded_rectangle([380, 710, 644, 770], radius=12, fill=(251, 191, 36, 255), outline=(30, 41, 59, 255), width=6)
    d.text((410, 722), "RASA JAMBU", fill=(30, 41, 59, 255), font=font_sub)

    # Top tag
    d.rounded_rectangle([140, 140, 380, 220], radius=16, fill=(236, 72, 153, 255), outline=(30, 41, 59, 255), width=8)
    d.text((170, 155), "MINUMAN", fill=(255, 255, 255, 255), font=font_sub)
    return img

def draw_teh_gelas_besar():
    img = Image.new("RGBA", (1024, 1024), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)
    # Background card
    d.rounded_rectangle([40, 40, 984, 984], radius=48, fill=(239, 246, 255, 255), outline=(30, 41, 59, 255), width=16)

    # Big Cup (Fluted tea cup)
    cup = [(310, 280), (714, 280), (640, 840), (384, 840)]
    d.polygon(cup, fill=(217, 119, 6, 255)) # Rich brewed tea amber
    # Cup highlights / ribs
    d.line([(430, 320), (430, 800)], fill=(245, 158, 11, 255), width=10)
    d.line([(512, 320), (512, 800)], fill=(245, 158, 11, 255), width=10)
    d.line([(594, 320), (594, 800)], fill=(245, 158, 11, 255), width=10)
    # Outer stroke
    d.line([(310, 280), (714, 280), (640, 840), (384, 840), (310, 280)], fill=(30, 41, 59, 255), width=12)

    # Blue & gold seal lid
    d.rounded_rectangle([280, 250, 744, 310], radius=14, fill=(29, 78, 216, 255), outline=(30, 41, 59, 255), width=10)
    d.line([(310, 280), (714, 280)], fill=(245, 158, 11, 255), width=6)

    # Center emblem banner: Teh Gelas
    d.rounded_rectangle([350, 460, 674, 620], radius=20, fill=(255, 255, 255, 255), outline=(30, 41, 59, 255), width=10)

    try:
        font_brand = ImageFont.truetype("arialbd.ttf", 64)
        font_besar = ImageFont.truetype("arialbd.ttf", 44)
        font_sub = ImageFont.truetype("arialbd.ttf", 32)
    except Exception:
        font_brand = ImageFont.load_default()
        font_besar = font_brand
        font_sub = font_brand

    d.text((380, 480), "Teh Gelas", fill=(29, 78, 216, 255), font=font_brand)
    d.text((430, 555), "ALAMI", fill=(22, 163, 74, 255), font=font_sub)

    # Yellow "BESAR" badge
    d.rounded_rectangle([390, 660, 634, 740], radius=16, fill=(245, 158, 11, 255), outline=(30, 41, 59, 255), width=8)
    d.text((420, 675), "BESAR 300ml", fill=(30, 41, 59, 255), font=font_besar)

    # Top tag
    d.rounded_rectangle([140, 120, 420, 200], radius=16, fill=(29, 78, 216, 255), outline=(30, 41, 59, 255), width=8)
    d.text((170, 135), "CUP BESAR", fill=(255, 255, 255, 255), font=font_sub)
    return img

def draw_teh_pucuk():
    img = Image.new("RGBA", (1024, 1024), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)
    # Background card
    d.rounded_rectangle([40, 40, 984, 984], radius=48, fill=(240, 253, 244, 255), outline=(30, 41, 59, 255), width=16)

    # Red Cap
    d.rounded_rectangle([450, 120, 574, 190], radius=10, fill=(220, 38, 38, 255), outline=(30, 41, 59, 255), width=8)
    # Bottle Neck
    neck = [(465, 190), (559, 190), (574, 280), (450, 280)]
    d.polygon(neck, fill=(180, 83, 9, 255), outline=(30, 41, 59, 255))
    d.line([(465, 190), (559, 190), (574, 280), (450, 280), (465, 190)], fill=(30, 41, 59, 255), width=8)

    # Main bottle body
    bottle = [(430, 280), (594, 280), (620, 860), (404, 860)]
    d.polygon(bottle, fill=(180, 83, 9, 255)) # Dark jasmine tea amber
    # PET bottle side contours & stroke
    d.line([(430, 280), (594, 280), (620, 860), (404, 860), (430, 280)], fill=(30, 41, 59, 255), width=12)

    # Bottle Label Banner (Green + Red + Gold)
    d.rounded_rectangle([390, 420, 634, 680], radius=16, fill=(21, 128, 61, 255), outline=(30, 41, 59, 255), width=10)
    # Red central sash
    d.rectangle([390, 490, 634, 600], fill=(220, 38, 38, 255))
    d.line([(390, 490), (634, 490)], fill=(245, 158, 11, 255), width=6)
    d.line([(390, 600), (634, 600)], fill=(245, 158, 11, 255), width=6)

    try:
        font_teh = ImageFont.truetype("arialbd.ttf", 38)
        font_pucuk = ImageFont.truetype("arialbd.ttf", 52)
        font_sub = ImageFont.truetype("arialbd.ttf", 30)
    except Exception:
        font_teh = ImageFont.load_default()
        font_pucuk = font_teh
        font_sub = font_teh

    d.text((470, 435), "TEH", fill=(255, 255, 255, 255), font=font_teh)
    d.text((410, 510), "PUCUK", fill=(254, 240, 138, 255), font=font_pucuk)
    d.text((435, 615), "HARUM", fill=(255, 255, 255, 255), font=font_sub)

    # Volume badge
    d.rounded_rectangle([420, 720, 604, 780], radius=12, fill=(245, 158, 11, 255), outline=(30, 41, 59, 255), width=6)
    d.text((450, 735), "350 ml", fill=(30, 41, 59, 255), font=font_sub)

    # Top tag
    d.rounded_rectangle([140, 120, 380, 200], radius=16, fill=(21, 128, 61, 255), outline=(30, 41, 59, 255), width=8)
    d.text((170, 135), "BOTOL", fill=(255, 255, 255, 255), font=font_sub)
    return img

PRODUCTS = [
    ("beng-beng", draw_beng_beng),
    ("better", draw_better),
    ("okky-jelly", draw_okky_jelly),
    ("teh-gelas", draw_teh_gelas_besar),
    ("teh-pucuk", draw_teh_pucuk),
]

manifest = {}

for name, draw_fn in PRODUCTS:
    full_img = draw_fn()
    # 1. Display variant: 512x512
    disp = full_img.resize((512, 512), Image.Resampling.LANCZOS)
    disp_bio = io.BytesIO()
    # Convert RGBA to RGB for clean WebP or keep RGBA
    disp.save(disp_bio, format="WEBP", quality=85, method=6)
    disp_bytes = disp_bio.getvalue()
    disp_hash = hashlib.sha256(disp_bytes).hexdigest()
    assert len(disp_bytes) <= 131072, f"Display too large for {name}: {len(disp_bytes)}"

    # 2. Thumb variant: 96x96
    thumb = full_img.resize((96, 96), Image.Resampling.LANCZOS)
    thumb_bio = io.BytesIO()
    thumb.save(thumb_bio, format="WEBP", quality=80, method=6)
    thumb_bytes = thumb_bio.getvalue()
    thumb_hash = hashlib.sha256(thumb_bytes).hexdigest()
    assert len(thumb_bytes) <= 131072, f"Thumb too large for {name}: {len(thumb_bytes)}"

    # Save to disk
    disp_path = os.path.join(OUT_DIR, f"{name}_display_{disp_hash}.webp")
    thumb_path = os.path.join(OUT_DIR, f"{name}_thumb_{thumb_hash}.webp")
    with open(disp_path, "wb") as f:
        f.write(disp_bytes)
    with open(thumb_path, "wb") as f:
        f.write(thumb_bytes)

    manifest[name] = {
        "display": {
            "hash": disp_hash,
            "bytes": len(disp_bytes),
            "width": 512,
            "height": 512,
            "path": disp_path,
        },
        "thumb": {
            "hash": thumb_hash,
            "bytes": len(thumb_bytes),
            "width": 96,
            "height": 96,
            "path": thumb_path,
        }
    }
    print(f"Generated {name}: display {len(disp_bytes)}B ({disp_hash[:8]}...), thumb {len(thumb_bytes)}B ({thumb_hash[:8]}...)")

import json
manifest_path = os.path.join(OUT_DIR, "manifest.json")
with open(manifest_path, "w") as f:
    json.dump(manifest, f, indent=2)
print("Manifest saved to", manifest_path)
