from PIL import Image

logo_path = "/Users/yevheniisemenov/Desktop/JobMe/Flexmoveshop/shopify-store-project/shopify-theme-main/assets/logo.png"

img = Image.open(logo_path).convert("RGBA")
width, height = img.size

# Find bounding box of pixels that are NOT close to white
left = width
top = height
right = 0
bottom = 0

for y in range(height):
    for x in range(width):
        r, g, b, a = img.getpixel((x, y))
        # If pixel is not white (threshold 245 in RGB) and not transparent
        if a > 10 and (r < 245 or g < 245 or b < 245):
            if x < left: left = x
            if x > right: right = x
            if y < top: top = y
            if y > bottom: bottom = y

if right >= left and bottom >= top:
    # Add a comfortable padding of 20 pixels around the text
    padding = 20
    crop_left = max(0, left - padding)
    crop_top = max(0, top - padding)
    crop_right = min(width, right + padding)
    crop_bottom = min(height, bottom + padding)
    
    cropped_img = img.crop((crop_left, crop_top, crop_right, crop_bottom))
    cropped_img.save(logo_path, "PNG")
    print(f"✅ Logo cropped with tolerance! Old size: {img.size}, New size: {cropped_img.size}")
else:
    print("❌ Bounding box not found.")
