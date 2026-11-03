"""Generates the Tallyo mark as SVG and the native icon PNGs.
Geometry mirrors src/components/LogoMark.tsx (one static frame of the animation)."""
import io, os
import cairosvg
from PIL import Image, ImageDraw

INK = '#070D22'
BARS, BAR_W, BAR_GAP, BASE_Y = [0.24, 0.36, 0.5], 0.13, 0.07, 0.72

def mark_group(S=512):
    bars = ''
    for i, h in enumerate(BARS):
        w = S * BAR_W
        x = S * (0.235 + i * (BAR_W + BAR_GAP))
        hh = S * h
        y = S * BASE_Y - hh
        fill = '#FFC857' if i == 2 else '#FFFFFF'
        op = 1 if i == 2 else 0.94
        bars += f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{hh:.1f}" rx="{w*0.4:.1f}" fill="{fill}" fill-opacity="{op}"/>'
    return f'''
<defs>
  <radialGradient id="base" gradientUnits="userSpaceOnUse" cx="{S*.38}" cy="{S*.3}" r="{S*.9}">
    <stop offset="0" stop-color="#7D86FF"/><stop offset=".45" stop-color="#4F5BFF"/><stop offset="1" stop-color="#1A1F66"/>
  </radialGradient>
  <radialGradient id="coral" gradientUnits="userSpaceOnUse" cx="{S*.7}" cy="{S*.72}" r="{S*.37}">
    <stop offset="0" stop-color="#FF6B9A" stop-opacity=".9"/><stop offset="1" stop-color="#FF6B9A" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="gold" gradientUnits="userSpaceOnUse" cx="{S*.22}" cy="{S*.76}" r="{S*.29}">
    <stop offset="0" stop-color="#FFC857" stop-opacity=".75"/><stop offset="1" stop-color="#FFC857" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="light" gradientUnits="userSpaceOnUse" cx="{S*.7}" cy="{S*.24}" r="{S*.33}">
    <stop offset="0" stop-color="#9AA4FF" stop-opacity=".7"/><stop offset="1" stop-color="#9AA4FF" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="hl" gradientUnits="userSpaceOnUse" x1="0" y1="{S*.08}" x2="0" y2="{S*.38}">
    <stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <clipPath id="orb"><circle cx="{S/2}" cy="{S/2}" r="{S/2}"/></clipPath>
</defs>
<g clip-path="url(#orb)">
  <circle cx="{S/2}" cy="{S/2}" r="{S/2}" fill="url(#base)"/>
  <circle cx="{S/2}" cy="{S/2}" r="{S}" fill="url(#coral)"/>
  <circle cx="{S/2}" cy="{S/2}" r="{S}" fill="url(#gold)"/>
  <circle cx="{S/2}" cy="{S/2}" r="{S}" fill="url(#light)"/>
  <ellipse cx="{S*.43}" cy="{S*.23}" rx="{S*.26}" ry="{S*.15}" fill="url(#hl)" opacity=".5"/>
  {bars}
</g>
<circle cx="{S/2}" cy="{S/2}" r="{S/2 - S*.01}" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="{S*.02}"/>
'''

def svg(canvas, mark_px, bg=None):
    off = (canvas - mark_px) / 2
    k = mark_px / 512
    bgr = f'<rect width="{canvas}" height="{canvas}" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{canvas}" height="{canvas}" viewBox="0 0 {canvas} {canvas}">{bgr}<g transform="translate({off} {off}) scale({k})">{mark_group()}</g></svg>'

def png(s, out, px):
    cairosvg.svg2png(bytestring=s.encode(), write_to=out, output_width=px, output_height=px)

os.makedirs('assets/logo', exist_ok=True)
open('assets/logo/tallyo-mark.svg', 'w').write(svg(512, 512))
png(svg(1024, 700, INK), 'assets/images/icon.png', 1024)                 # app icon (full-bleed ink)
png(svg(1024, 660), 'assets/images/android-icon-foreground.png', 1024)   # inside adaptive safe zone
Image.new('RGBA', (1024, 1024), INK).save('assets/images/android-icon-background.png')
png(svg(96, 88), 'assets/images/favicon.png', 96)
# Native splash is deliberately just the ink color: the animated logo in JS takes over without a jump.
Image.new('RGBA', (512, 512), (0, 0, 0, 0)).save('assets/images/splash-icon.png')

# Monochrome (Android themed icons): white orb with the bars cut out.
S = 1024
mono = Image.new('RGBA', (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(mono)
m = 660; off = (S - m) / 2
d.ellipse([off, off, off + m, off + m], fill=(255, 255, 255, 255))
for i, h in enumerate(BARS):
    w = m * BAR_W; x = off + m * (0.235 + i * (BAR_W + BAR_GAP)); hh = m * h; y = off + m * BASE_Y - hh
    d.rounded_rectangle([x, y, x + w, y + hh], radius=w * 0.4, fill=(0, 0, 0, 0))
mono.save('assets/images/android-icon-monochrome.png')
print('assets written')
