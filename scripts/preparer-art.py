"""Prépare les illustrations : détourage des personnages (fond crème
retiré), recadrage et conversion en WebP dans public/art/.
Usage : python3 scripts/preparer-art.py"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC, DST = 'art/src', 'public/art'
os.makedirs(DST, exist_ok=True)

def detourer(img, seuil=34):
    a = np.asarray(img.convert('RGB')).astype(np.int16)
    h, w, _ = a.shape
    coins = np.concatenate([a[:6, :6].reshape(-1, 3), a[:6, -6:].reshape(-1, 3)])
    fond = np.median(coins, axis=0)
    dist = np.sqrt(((a - fond) ** 2).sum(axis=2))
    proche = dist < seuil
    # Ne garder que le fond relié aux bords (pas les zones claires du perso)
    lab, _ = ndimage.label(proche)
    bords = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    masque_fond = np.isin(lab, list(bords))
    alpha = np.where(masque_fond, 0, 255).astype(np.uint8)
    # Adoucir le contour : légère érosion puis flou
    alpha_img = Image.fromarray(alpha).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.1))
    rgba = img.convert('RGBA')
    rgba.putalpha(alpha_img)
    bbox = alpha_img.point(lambda v: 255 if v > 20 else 0).getbbox()
    if bbox:
        m = 8
        bbox = (max(0, bbox[0] - m), max(0, bbox[1] - m), min(w, bbox[2] + m), min(h, bbox[3] + m))
        rgba = rgba.crop(bbox)
    return rgba

for f in sorted(os.listdir(SRC)):
    if not f.endswith('.png'):
        continue
    nom = f[:-4]
    img = Image.open(os.path.join(SRC, f))
    if nom.startswith(('hero-', 'm-', 'b-', 'p-')):
        out = detourer(img, 18 if nom in ('p-miche', 'p-roi') else 34)
        taille = 640 if nom.startswith('b-') else 512
        out.thumbnail((taille, taille), Image.LANCZOS)
        out.save(os.path.join(DST, nom + '.webp'), 'WEBP', quality=82, method=6)
    else:
        out = img.convert('RGB').resize((720, 1280), Image.LANCZOS)
        out.save(os.path.join(DST, nom + '.webp'), 'WEBP', quality=76, method=6)
    print(nom, out.size, os.path.getsize(os.path.join(DST, nom + '.webp')) // 1024, 'Ko')
