"""Builds 1920x1080 Microsoft Store screenshots from raw window captures in store-assets/src."""
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(os.path.dirname(HERE), "docs", "screenshots")
OUT = os.path.join(HERE, "store-assets")
W, H = 1920, 1080
FONTS = r"C:\Windows\Fonts"


def font(bold, size):
    return ImageFont.truetype(os.path.join(FONTS, "segoeuib.ttf" if bold else "segoeui.ttf"), size)


def background(top=(74, 20, 140), bottom=(33, 15, 70)):
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3)))
    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).ellipse([1100, -350, 2400, 800], fill=80)
    img.paste(Image.new("RGB", (W, H), (190, 120, 255)), (0, 0), glow.filter(ImageFilter.GaussianBlur(170)))
    return img.convert("RGBA")


def rounded(im, r):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1], radius=r, fill=255)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(im.convert("RGBA"), (0, 0), mask)
    return out


def shadow_paste(canvas, im, xy, blur=40, opacity=120):
    sh = Image.new("RGBA", (im.size[0] + blur * 4, im.size[1] + blur * 4), (0, 0, 0, 0))
    sh.paste((0, 0, 0, 255), (blur * 2, blur * 2), im.split()[-1].point(lambda a: opacity if a else 0))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)), (xy[0] - blur * 2, xy[1] - blur * 2 + 24))
    canvas.alpha_composite(im, xy)


def window(name, width):
    im = Image.open(os.path.join(SRC, name)).convert("RGB")
    h = int(im.size[1] * width / im.size[0])
    return rounded(im.resize((width, h), Image.LANCZOS), 12)


def text_block(c, title, sub, bullets, x=100, y=250):
    d = ImageDraw.Draw(c)
    d.text((x, y - 70), "InkNote", font=font(True, 34), fill=(225, 200, 255))
    for line in title.split("\n"):
        d.text((x, y), line, font=font(True, 70), fill="white"); y += 86
    y += 16
    for line in sub.split("\n"):
        d.text((x, y), line, font=font(False, 33), fill=(232, 222, 255)); y += 46
    y += 26
    for b in bullets:
        d.ellipse([x, y + 15, x + 13, y + 28], fill=(255, 214, 0))
        d.text((x + 30, y), b, font=font(False, 30), fill="white"); y += 50


def save(c, name):
    c.convert("RGB").save(os.path.join(OUT, name), optimize=True)
    print("wrote", name)


def main():
    c = background()
    text_block(c, "Write like it's\npaper", "A pen-first notebook for\nWindows pens and touch.",
               ["Smooth, pressure-sensitive ink", "Highlighters, shapes & text", "Subjects and pages, auto-saved"])
    shadow_paste(c, window("1-notes.png", 1080), (760, 200))
    save(c, "1-write.png")

    c = background((20, 20, 30), (55, 25, 90))
    text_block(c, "Easy on the\neyes at night", "Dark theme with chalkboard\npaper. Ink adapts itself.",
               ["Ruled, grid, dotted or plain paper", "11 paper colours", "Full-screen focus mode"])
    shadow_paste(c, window("2-dark.png", 1080), (760, 200))
    save(c, "2-dark.png")

    c = background()
    text_block(c, "Select, move,\nrecolour", "Lasso anything you wrote\nand rearrange your page.",
               ["Your own pens and colours", "Copy, paste, duplicate", "Hold to straighten a line"])
    shadow_paste(c, window("3-lasso-pens.png", 1080), (760, 200))
    save(c, "3-lasso.png")

    c = background()
    text_block(c, "Export to\nsharp PDFs", "Vector ink and real text:\nperfect on any screen.",
               ["A4, Letter or one long page", "Daily automatic backups", "Works offline, no account"])
    shadow_paste(c, window("4-export.png", 1080), (760, 200))
    save(c, "4-export.png")


if __name__ == "__main__":
    main()
