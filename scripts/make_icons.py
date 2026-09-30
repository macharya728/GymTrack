"""Generate GymTrack app icons (run once; output committed to public/)."""
from PIL import Image, ImageDraw

BG = (11, 15, 20)
LIME = (200, 245, 69)


def draw(size: int, maskable: bool) -> Image.Image:
    img = Image.new("RGB", (size, size), BG)
    d = ImageDraw.Draw(img)
    s = size / 512
    # maskable icons need content inside the central 80% safe zone
    k = 0.72 if maskable else 1.0
    cx = cy = size / 2

    def box(x0, y0, x1, y1):
        return [cx + (x0 - 256) * s * k, cy + (y0 - 256) * s * k, cx + (x1 - 256) * s * k, cy + (y1 - 256) * s * k]

    # progress ring (270 degrees)
    d.arc(box(96, 96, 416, 416), start=-90, end=180, fill=LIME, width=int(34 * s * k))
    d.arc(box(96, 96, 416, 416), start=180, end=270, fill=(39, 49, 64), width=int(34 * s * k))
    # dumbbell
    d.rounded_rectangle(box(196, 244, 316, 268), radius=int(8 * s * k), fill=LIME)
    for x in (168, 318):
        d.rounded_rectangle(box(x, 206, x + 26, 306), radius=int(10 * s * k), fill=LIME)
    for x in (146, 346):
        d.rounded_rectangle(box(x, 224, x + 20, 288), radius=int(8 * s * k), fill=LIME)
    return img


draw(192, False).save("public/icon-192.png")
draw(512, False).save("public/icon-512.png")
draw(512, True).save("public/icon-maskable-512.png")
draw(180, False).save("public/apple-touch-icon.png")
print("icons written")
