"""Troca o ícone padrão do Capacitor pelo ícone do app (icon-512.png).
Roda depois de `npx cap add android`."""
import os
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
RES = os.path.join(ROOT, "android", "app", "src", "main", "res")
src = Image.open(os.path.join(ROOT, "icon-1024.png")).convert("RGBA")
bg = src.getpixel((4, 4))[:3]

legacy = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
foreground = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}

for d, size in legacy.items():
    out = os.path.join(RES, "mipmap-" + d)
    os.makedirs(out, exist_ok=True)
    icon = src.resize((size, size), Image.LANCZOS)
    icon.save(os.path.join(out, "ic_launcher.png"))
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    round_icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    round_icon.paste(icon, (0, 0), mask)
    round_icon.save(os.path.join(out, "ic_launcher_round.png"))

# Ícone adaptativo (Android 8+): fundo = cor do ícone, frente = ícone na zona segura
for d, size in foreground.items():
    out = os.path.join(RES, "mipmap-" + d)
    os.makedirs(out, exist_ok=True)
    inner = int(size * 0.66)
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    layer.paste(src.resize((inner, inner), Image.LANCZOS), ((size - inner) // 2, (size - inner) // 2))
    layer.save(os.path.join(out, "ic_launcher_foreground.png"))

os.makedirs(os.path.join(RES, "values"), exist_ok=True)
with open(os.path.join(RES, "values", "ic_launcher_background.xml"), "w") as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
            '    <color name="ic_launcher_background">#%02x%02x%02x</color>\n</resources>\n' % bg)
print("Ícones do app gerados")
