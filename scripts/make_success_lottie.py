"""Generates assets/lottie/success.json: a checkmark that draws itself plus a burst ring.
Colors match brand.ts (checkmark = onAccent, ring = accent). Re-run after changing them."""
import json

def rgba(h, a=1):
    h = h.lstrip('#')
    return [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)] + [a]

ACCENT, ON_ACCENT = rgba('#FFC857'), rgba('#1A1405')
EASE_I, EASE_O = {"x": [0.2], "y": [1]}, {"x": [0.4], "y": [0]}
EASE3_I, EASE3_O = {"x": [0.2] * 3, "y": [1] * 3}, {"x": [0.4] * 3, "y": [0] * 3}

def static(v): return {"a": 0, "k": v}
def tr(**k):
    base = dict(ty="tr", p=static([0, 0]), a=static([0, 0]), s=static([100, 100]), r=static(0), o=static(100), sk=static(0), sa=static(0))
    base.update(k); return base

def layer(ind, name, shapes, ks_extra=None):
    ks = {"o": static(100), "r": static(0), "p": static([100, 100, 0]), "a": static([0, 0, 0]), "s": static([100, 100, 100])}
    if ks_extra: ks.update(ks_extra)
    return {"ddd": 0, "ind": ind, "ty": 4, "nm": name, "sr": 1, "ks": ks, "ao": 0, "shapes": shapes, "ip": 0, "op": 60, "st": 0, "bm": 0}

check = layer(1, "check", [{
    "ty": "gr", "nm": "check", "it": [
        {"ty": "sh", "ks": static({"i": [[0, 0]] * 3, "o": [[0, 0]] * 3, "v": [[-15, 1], [-4, 12], [16, -10]], "c": False})},
        {"ty": "st", "c": static(ON_ACCENT), "o": static(100), "w": static(6), "lc": 2, "lj": 2},
        {"ty": "tm", "s": static(0), "o": static(0), "m": 1,
         "e": {"a": 1, "k": [{"t": 6, "s": [0], "i": EASE_I, "o": EASE_O}, {"t": 22, "s": [100]}]}},
        tr(),
    ]}],
    {"s": {"a": 1, "k": [
        {"t": 18, "s": [100, 100, 100], "i": EASE3_I, "o": EASE3_O},
        {"t": 26, "s": [118, 118, 100], "i": EASE3_I, "o": EASE3_O},
        {"t": 34, "s": [100, 100, 100]}]}})

ring = layer(2, "burst", [{
    "ty": "gr", "nm": "ring", "it": [
        {"ty": "el", "p": static([0, 0]), "s": static([64, 64])},
        {"ty": "st", "c": static(ACCENT), "o": static(100), "w": static(3), "lc": 2, "lj": 2},
        tr(),
    ]}],
    {"s": {"a": 1, "k": [{"t": 14, "s": [100, 100, 100], "i": EASE3_I, "o": EASE3_O}, {"t": 50, "s": [260, 260, 100]}]},
     "o": {"a": 1, "k": [{"t": 14, "s": [85], "i": EASE_I, "o": EASE_O}, {"t": 50, "s": [0]}]}})

doc = {"v": "5.7.0", "fr": 30, "ip": 0, "op": 60, "w": 200, "h": 200, "nm": "success", "ddd": 0, "assets": [], "layers": [check, ring]}
with open("assets/lottie/success.json", "w") as f:
    json.dump(doc, f, separators=(",", ":"))
print("ok")
