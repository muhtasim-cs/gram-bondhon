"""
download_images.py
------------------
Downloads free Unsplash images for the Gram-Bondhon website.
Run once:  python download_images.py
Requires:  pip install requests
"""

import os
import urllib.request

ASSETS = os.path.join(os.path.dirname(__file__), "assets")
os.makedirs(ASSETS, exist_ok=True)

# Unsplash "source" API — free, no key needed, redirects to a random relevant photo
# Format: https://source.unsplash.com/{width}x{height}/?{keyword}

IMAGES = {
    # Hero slides
    "hero1.jpg":      "https://source.unsplash.com/1920x1080/?farmer,hands,grains",
    "hero2.jpg":      "https://source.unsplash.com/1920x1080/?rice,field,bangladesh",
    "hero3.jpg":      "https://source.unsplash.com/1920x1080/?rural,village,harvest",
    "hero4.jpg":      "https://source.unsplash.com/1920x1080/?agritech,handshake,farm,technology",
    "hero5.jpg":      "https://source.unsplash.com/1920x1080/?nakshi,textile,embroidery,craft",
    "hero6.jpg":      "https://source.unsplash.com/1920x1080/?hands,holding,seeds,farmer",

    # Halal section
    "farmer-rice.jpg": "https://source.unsplash.com/800x600/?farmer,rice,planting",

    # Projects
    "paddy.jpg":   "https://source.unsplash.com/600x400/?paddy,field,rice",
    "poultry.jpg": "https://source.unsplash.com/600x400/?poultry,chicken,farm",
    "fish.jpg":    "https://source.unsplash.com/600x400/?fish,hatchery,aquaculture",
    "nakshi.jpg":  "https://source.unsplash.com/600x400/?textile,embroidery,craft",
    "basket.jpg":  "https://source.unsplash.com/600x400/?basket,weaving,artisan",

    # Testimonial avatars
    "avatar1.jpg": "https://source.unsplash.com/100x100/?man,portrait,professional",
    "avatar2.jpg": "https://source.unsplash.com/100x100/?woman,portrait,professional",
    "avatar3.jpg": "https://source.unsplash.com/100x100/?woman,portrait,bangladesh",

    # About
    "about-img.jpg": "https://source.unsplash.com/800x900/?rural,community,bangladesh",
}

def download(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        with open(path, "wb") as f:
            f.write(resp.read())

if __name__ == "__main__":
    print("Downloading images …")
    for name, url in IMAGES.items():
        dest = os.path.join(ASSETS, name)
        if os.path.exists(dest):
            print(f"  skip  {name}  (already exists)")
            continue
        try:
            print(f"  ↓  {name}")
            download(url, dest)
            print(f"  ✓  {name}")
        except Exception as e:
            print(f"  ✗  {name}  ({e})")
    print("\nDone! Open index.html in your browser.")
