"""Optional maintainer tool. Generated PNGs are committed; Pillow is not needed to build."""
from pathlib import Path
from PIL import Image, ImageDraw
root = Path(__file__).resolve().parents[1] / 'public/assets'
for size, name in [(180, 'icon-180.png'), (192, 'icon-192.png'), (512, 'icon-512.png'), (512, 'icon-maskable-512.png')]:
    scale = 4
    im = Image.new('RGB', (512*scale, 512*scale), '#173e32')
    draw = ImageDraw.Draw(im)
    ink = '#dec898'
    draw.arc((146*scale, 138*scale, 366*scale, 358*scale), 180, 360, fill=ink, width=9*scale)
    draw.line([(146*scale, 248*scale), (146*scale, 385*scale), (366*scale, 385*scale), (366*scale, 248*scale)], fill=ink, width=9*scale)
    draw.line([(256*scale, 211*scale), (256*scale, 330*scale)], fill=ink, width=9*scale)
    draw.line([(213*scale, 253*scale), (299*scale, 253*scale)], fill=ink, width=9*scale)
    im.resize((size, size), Image.Resampling.LANCZOS).save(root / name)
print('Generated four install icons from the CORE arch and cross motif.')
