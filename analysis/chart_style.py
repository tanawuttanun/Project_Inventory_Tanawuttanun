"""สไตล์กลางของกราฟทุกใบในโฟลเดอร์นี้

สีชุดนี้ผ่านการตรวจ contrast และการมองเห็นสีผิดปกติ (colorblind-safe)
มาแล้วเฉพาะ 3 สีแรก ถ้าใช้ k มากกว่า 3 กราฟจะแยกกลุ่มด้วย "รูปทรงจุด"
เพิ่มอีกชั้นหนึ่ง เพื่อไม่ให้ต้องอาศัยสีอย่างเดียว
"""

from __future__ import annotations

import matplotlib
import matplotlib.pyplot as plt
from matplotlib import font_manager

# สีประจำคลัสเตอร์ (เรียงลำดับตายตัว ห้ามสลับ)
PALETTE = [
    "#2a78d6",  # blue
    "#eb6834",  # orange
    "#1baf7a",  # aqua
    "#eda100",  # yellow
    "#e87ba4",  # magenta
    "#008300",  # green
    "#4a3aa7",  # violet
    "#e34948",  # red
]

# รูปทรงจุด ใช้คู่กับสีเมื่อมีคลัสเตอร์มากกว่า 3 กลุ่ม
MARKERS = ["o", "s", "^", "D", "v", "P", "X", "*"]

SURFACE = "#fcfcfb"        # พื้นหลังกราฟ
INK = "#0b0b0b"            # ตัวหนังสือหลัก
INK_SECONDARY = "#52514e"  # ตัวหนังสือรอง
MUTED = "#898781"          # แกน/ป้ายกำกับ
GRID = "#e1e0d9"           # เส้นตาราง
AXIS = "#c3c2b7"           # เส้นแกน

# ฟอนต์ที่รองรับภาษาไทย (ถ้าเครื่องมี) เผื่อชื่อสินค้าเป็นภาษาไทย
_FONT_CANDIDATES = ["Leelawadee UI", "Tahoma", "Noto Sans Thai", "Segoe UI", "DejaVu Sans"]


def _pick_font() -> str:
    available = {f.name for f in font_manager.fontManager.ttflist}
    for name in _FONT_CANDIDATES:
        if name in available:
            return name
    return "DejaVu Sans"


def color_of(index: int) -> str:
    return PALETTE[index % len(PALETTE)]


def marker_of(index: int) -> str:
    return MARKERS[index % len(MARKERS)]


def apply_style(headless: bool = False) -> None:
    """ตั้งค่า matplotlib ให้กราฟทุกใบหน้าตาเหมือนกัน"""
    if headless:
        matplotlib.use("Agg")

    plt.rcParams.update({
        "font.family": _pick_font(),
        "font.size": 10,
        "figure.facecolor": SURFACE,
        "figure.dpi": 110,
        "axes.facecolor": SURFACE,
        "axes.edgecolor": AXIS,
        "axes.labelcolor": INK_SECONDARY,
        "axes.titlecolor": INK,
        "axes.titlesize": 12,
        "axes.titleweight": "bold",
        "axes.titlelocation": "left",
        "axes.titlepad": 10,
        "axes.labelsize": 10,
        "axes.grid": True,
        "axes.axisbelow": True,
        "grid.color": GRID,
        "grid.linewidth": 0.8,
        "text.color": INK,
        "xtick.color": MUTED,
        "ytick.color": MUTED,
        "xtick.labelcolor": INK_SECONDARY,
        "ytick.labelcolor": INK_SECONDARY,
        "legend.frameon": False,
        "legend.fontsize": 9,
        "lines.linewidth": 2.0,
        "savefig.facecolor": SURFACE,
        "savefig.bbox": "tight",
    })


def style_axes(ax, grid_axis: str = "both") -> None:
    """เก็บรายละเอียดของแกน: ตัดกรอบบน/ขวาออก ให้เส้นตารางจางกว่าข้อมูลเสมอ"""
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(AXIS)
    ax.spines["bottom"].set_color(AXIS)
    ax.grid(True, axis=grid_axis, color=GRID, linewidth=0.8)
    ax.tick_params(length=0)
