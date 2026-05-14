"""水平翻转 PNG（与 Valorant displayIcon 配套生成 *_mirror.png）。"""
from pathlib import Path

from PIL import Image


def mirror_png_file(src: Path, dst: Path) -> None:
    img = Image.open(src)
    mirror_img = img.transpose(Image.FLIP_LEFT_RIGHT)
    dst.parent.mkdir(parents=True, exist_ok=True)
    mirror_img.save(dst)


if __name__ == "__main__":
    root = Path(__file__).resolve().parent
    inp = root / "displayicon.png"
    out = root / "displayicon_mirror.png"
    mirror_png_file(inp, out)
