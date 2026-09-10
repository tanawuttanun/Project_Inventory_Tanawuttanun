"""K-Means Clustering + กราฟผลลัพธ์ (Cluster Results)

ดึง Combined Dataset จาก Aggregation API -> ทำ Standardization -> จัดกลุ่มสินค้า
ด้วย K-Means -> สรุปเป็นตาราง + กราฟ 4 ใบ

ตัวอย่างการรัน
    python clustering.py                                  # เลือก k อัตโนมัติ (Silhouette)
    python clustering.py --k 3                            # กำหนดจำนวนกลุ่มเอง
    python clustering.py --days 90                        # นับยอดขายเฉพาะ 90 วันล่าสุด
    python clustering.py --features price stock           # เลือกฟีเจอร์เอง
    python clustering.py --url http://localhost:3021/api/products
    python clustering.py --file sample_products.json      # ใช้ข้อมูลตัวอย่าง (ไม่ต้องต่อ DB)
    python clustering.py --no-show                        # บันทึกรูปอย่างเดียว ไม่เปิดหน้าต่าง
"""

from __future__ import annotations

import argparse
from typing import List

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score

import chart_style as cs
from data_source import (
    DEFAULT_FEATURES,
    DEFAULT_URL,
    DataSourceError,
    fetch_products,
    label_for,
    output_dir,
    scale_features,
    to_dataframe,
)

RANDOM_STATE = 42


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="จัดกลุ่มสินค้าด้วย K-Means แล้ววาดกราฟผลลัพธ์")
    p.add_argument("--url", default=DEFAULT_URL, help="URL ของ Aggregation API หรือ REST API ตรง ๆ")
    p.add_argument("--file", help="อ่านจากไฟล์ JSON แทนการเรียก API")
    p.add_argument("--days", type=int, help="นับยอดขายเฉพาะ N วันล่าสุด")
    p.add_argument("--features", nargs="+", default=DEFAULT_FEATURES, help="ฟีเจอร์ที่ใช้จัดกลุ่ม")
    p.add_argument("--k", type=int, help="จำนวนคลัสเตอร์ (ไม่ใส่ = เลือกอัตโนมัติ)")
    p.add_argument("--kmin", type=int, default=2, help="ค่า k ต่ำสุดที่ทดลอง")
    p.add_argument("--kmax", type=int, default=8, help="ค่า k สูงสุดที่ทดลอง")
    p.add_argument("--no-show", action="store_true", help="ไม่ต้องเปิดหน้าต่างกราฟ")
    return p.parse_args()


def sweep_k(scaled: np.ndarray, kmin: int, kmax: int) -> pd.DataFrame:
    """ทดลองทุกค่า k แล้วเก็บ Inertia (Elbow) กับ Silhouette ไว้เปรียบเทียบ"""
    rows = []
    for k in range(1, kmax + 1):
        km = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10).fit(scaled)
        sil = silhouette_score(scaled, km.labels_) if 2 <= k < len(scaled) else np.nan
        rows.append({"k": k, "inertia": km.inertia_, "silhouette": sil})

    df = pd.DataFrame(rows)
    df.loc[df["k"] < kmin, "silhouette"] = np.nan  # ไม่พิจารณา k ที่ต่ำกว่าที่ผู้ใช้กำหนด
    return df


THAI_TIER = {
    "Budget": "ราคาประหยัด",
    "Mid-range": "ระดับกลาง",
    "Premium": "พรีเมียม",
    "All products": "ทั้งหมด",
}

THAI_SUFFIX = {
    "high sales": "ขายดี",
    "medium sales": "ขายปานกลาง",
    "low sales": "ขายช้า",
}

SALES_SUFFIX = {
    2: ["high sales", "low sales"],
    3: ["high sales", "medium sales", "low sales"],
}


def profile_names(centers_df: pd.DataFrame, features: List[str]) -> List[str]:
    """ตั้งชื่อกลุ่มจากคุณลักษณะจริงของจุดศูนย์กลาง

    ขั้นแรกแบ่งระดับราคาตาม "ลำดับ" ของ centroid (centers_df เรียงราคาจากน้อยไปมากแล้ว)
    เป็น Budget / Mid-range / Premium — ใช้ลำดับแทนค่าราคาดิบ เพราะถ้าสินค้าชิ้นเดียว
    แพงลิ่ว จะดันให้กลุ่มที่เหลือกลายเป็น Budget ทั้งหมด
    ถ้ามีหลายกลุ่มตกอยู่ในระดับราคาเดียวกัน จะแยกด้วยยอดขาย
    เช่น "Mid-range · high sales" กับ "Mid-range · low sales"
    """
    k = len(centers_df)
    if k == 1:
        return ["All products"]

    sales_col = next((c for c in ("units_sold", "revenue", "order_count") if c in features), None)

    def tier_of(rank: int) -> str:
        ratio = (rank + 0.5) / k
        if ratio < 1 / 3:
            return "Budget"
        return "Mid-range" if ratio < 2 / 3 else "Premium"

    tiers = [tier_of(rank) for rank in range(k)]
    names = list(tiers)

    for tier in set(tiers):
        same = [i for i, t in enumerate(tiers) if t == tier]
        if len(same) < 2:
            continue
        if sales_col:
            same.sort(key=lambda i: -float(centers_df.loc[i, sales_col]))
        suffixes = SALES_SUFFIX.get(len(same)) or [f"group {n + 1}" for n in range(len(same))]
        for position, index in enumerate(same):
            names[index] = f"{tier} · {suffixes[position]}"

    return names


def thai_name(name: str) -> str:
    """แปลงชื่อกลุ่มเป็นภาษาไทยสำหรับตารางสรุป"""
    tier, _, suffix = name.partition(" · ")
    thai = THAI_TIER.get(tier, tier)
    return f"{thai} · {THAI_SUFFIX.get(suffix, suffix)}" if suffix else thai


def fit_kmeans(df: pd.DataFrame, scaled: np.ndarray, scaler, features: List[str], k: int):
    """จัดกลุ่มจริง แล้วเรียงหมายเลขคลัสเตอร์ใหม่ตามราคาเฉลี่ยจากน้อยไปมาก

    การเรียงใหม่ทำให้ผลลัพธ์อ่านง่ายและคงที่ทุกครั้งที่รัน
    (ปกติ K-Means ตั้งเลขกลุ่มแบบสุ่ม รันสองครั้งเลขอาจสลับกัน)
    """
    km = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10).fit(scaled)
    centers = scaler.inverse_transform(km.cluster_centers_)

    order = np.argsort(centers[:, 0])            # เรียงตามฟีเจอร์แรก (ค่าเริ่มต้นคือราคา)
    remap = {old: new for new, old in enumerate(order)}

    df = df.copy()
    df["cluster"] = [remap[label] for label in km.labels_]

    centers = centers[order]
    centers_df = pd.DataFrame(centers, columns=features)
    centers_df.insert(0, "cluster", range(k))
    return df, centers_df, km


def summarize(df: pd.DataFrame, features: List[str], names: List[str]) -> pd.DataFrame:
    """สรุปคุณลักษณะของแต่ละคลัสเตอร์ไว้อธิบายในสไลด์"""
    rows = []
    for c in sorted(df["cluster"].unique()):
        part = df[df["cluster"] == c]
        row = {
            "cluster": c,
            "profile": names[c],
            "profile_th": thai_name(names[c]),
            "products": len(part),
        }
        for f in features:
            row[f"avg_{f}"] = round(part[f].mean(), 2)
        row["price_min"] = round(part[features[0]].min(), 2)
        row["price_max"] = round(part[features[0]].max(), 2)
        row["example"] = ", ".join(part["name"].astype(str).head(3))
        rows.append(row)
    return pd.DataFrame(rows)


# ---------------------------------------------------------
# กราฟ
# ---------------------------------------------------------

def thousands(x, _pos) -> str:
    return f"{x:,.0f}"


def plot_scatter(ax, df: pd.DataFrame, centers_df: pd.DataFrame, x: str, y: str, names: List[str]):
    """กราฟหลัก: กระจายสินค้าตามฟีเจอร์ 2 แกน ระบายสีตามคลัสเตอร์"""
    for c in sorted(df["cluster"].unique()):
        part = df[df["cluster"] == c]
        ax.scatter(
            part[x], part[y],
            s=70,
            color=cs.color_of(c),
            marker=cs.marker_of(c),          # แยกด้วยรูปทรงอีกชั้น ไม่พึ่งสีอย่างเดียว
            edgecolor=cs.SURFACE, linewidth=1.6,
            label=f"Cluster {c} · {names[c]} (n={len(part)})",
            zorder=3,
        )

    # จุดศูนย์กลางคลัสเตอร์ + ป้ายกำกับติดจุด
    for _, row in centers_df.iterrows():
        c = int(row["cluster"])
        ax.scatter(row[x], row[y], s=190, marker="X", color=cs.color_of(c),
                   edgecolor=cs.SURFACE, linewidth=2.0, zorder=4)
        ax.annotate(
            names[c],
            (row[x], row[y]),
            textcoords="offset points", xytext=(10, 8),
            fontsize=9, fontweight="bold", color=cs.INK, zorder=5,
            bbox=dict(boxstyle="round,pad=0.25", facecolor=cs.SURFACE, edgecolor="none", alpha=0.85),
        )

    ax.set_title("Cluster results")
    ax.set_xlabel(label_for(x))
    ax.set_ylabel(label_for(y))
    ax.xaxis.set_major_formatter(thousands)
    ax.yaxis.set_major_formatter(thousands)
    cs.style_axes(ax)


def plot_pca(ax, df: pd.DataFrame, scaled: np.ndarray, features: List[str]):
    """ฉายฟีเจอร์ทั้งหมดลง 2 มิติด้วย PCA เพื่อดูว่ากลุ่มแยกกันจริงไหม"""
    pca = PCA(n_components=2, random_state=RANDOM_STATE)
    coords = pca.fit_transform(scaled)
    ratio = pca.explained_variance_ratio_.sum() * 100

    for c in sorted(df["cluster"].unique()):
        mask = (df["cluster"] == c).to_numpy()
        ax.scatter(coords[mask, 0], coords[mask, 1], s=70,
                   color=cs.color_of(c), marker=cs.marker_of(c),
                   edgecolor=cs.SURFACE, linewidth=1.6, zorder=3)

    ax.set_title(f"PCA view of {len(features)} features")
    ax.set_xlabel(f"PC1 · {pca.explained_variance_ratio_[0] * 100:.0f}% of variance")
    ax.set_ylabel(f"PC2 · {pca.explained_variance_ratio_[1] * 100:.0f}% of variance")
    ax.text(0.99, 0.02, f"PC1+PC2 = {ratio:.0f}% of total variance",
            transform=ax.transAxes, ha="right", va="bottom",
            fontsize=9, color=cs.INK_SECONDARY)
    cs.style_axes(ax)


def plot_sizes(ax, df: pd.DataFrame, names: List[str]):
    """ใช้แทนกราฟ PCA เมื่อเลือกฟีเจอร์เดียว"""
    counts = df["cluster"].value_counts().sort_index()
    for c, n in counts.items():
        ax.bar(c, n, color=cs.color_of(int(c)), width=0.62, zorder=3)
        ax.text(c, n, f"{n}", ha="center", va="bottom", fontsize=10,
                color=cs.INK, fontweight="bold")

    ax.set_title("Products per cluster")
    ax.set_xticks(list(counts.index))
    ax.set_xticklabels([names[int(c)] for c in counts.index])
    ax.set_ylabel("Products")
    cs.style_axes(ax, grid_axis="y")


def plot_elbow(ax, sweep: pd.DataFrame, chosen_k: int):
    """Elbow Method: จุดที่กราฟเริ่มหักศอก คือ k ที่คุ้มค่าที่สุด"""
    ax.plot(sweep["k"], sweep["inertia"], marker="o", markersize=7,
            color=cs.PALETTE[0], markeredgecolor=cs.SURFACE, markeredgewidth=1.6, zorder=3)

    row = sweep[sweep["k"] == chosen_k].iloc[0]
    ax.scatter([chosen_k], [row["inertia"]], s=190, marker="X", color=cs.PALETTE[1],
               edgecolor=cs.SURFACE, linewidth=2.0, zorder=4)
    ax.annotate(f"k = {chosen_k}", (chosen_k, row["inertia"]),
                textcoords="offset points", xytext=(10, 10),
                fontsize=10, fontweight="bold", color=cs.INK)

    ax.set_title("Elbow method")
    ax.set_xlabel("Number of clusters (k)")
    ax.set_ylabel("Inertia (within-cluster sum of squares)")
    ax.set_xticks(sweep["k"].tolist())
    ax.yaxis.set_major_formatter(thousands)
    cs.style_axes(ax)


def plot_silhouette(ax, sweep: pd.DataFrame, chosen_k: int):
    """Silhouette: ยิ่งเข้าใกล้ 1 แปลว่ากลุ่มยิ่งแยกจากกันชัด"""
    data = sweep.dropna(subset=["silhouette"])
    ax.plot(data["k"], data["silhouette"], marker="o", markersize=7,
            color=cs.PALETTE[2], markeredgecolor=cs.SURFACE, markeredgewidth=1.6, zorder=3)

    row = sweep[sweep["k"] == chosen_k]
    if not row.empty and not pd.isna(row.iloc[0]["silhouette"]):
        score = row.iloc[0]["silhouette"]
        ax.scatter([chosen_k], [score], s=190, marker="X", color=cs.PALETTE[1],
                   edgecolor=cs.SURFACE, linewidth=2.0, zorder=4)
        ax.annotate(f"k = {chosen_k} · {score:.3f}", (chosen_k, score),
                    textcoords="offset points", xytext=(10, 10),
                    fontsize=10, fontweight="bold", color=cs.INK)

    ax.set_title("Silhouette score")
    ax.set_xlabel("Number of clusters (k)")
    ax.set_ylabel("Silhouette (higher is better)")
    ax.set_xticks(data["k"].tolist())
    cs.style_axes(ax)


def build_figure(df, scaled, centers_df, sweep, features, names, chosen_k, source_label):
    import matplotlib.pyplot as plt

    fig, axes = plt.subplots(2, 2, figsize=(13.5, 9.5))
    fig.subplots_adjust(hspace=0.42, wspace=0.26, top=0.86, bottom=0.13)

    x = features[0]
    y = features[-1] if len(features) > 1 else features[0]

    if len(features) > 1:
        plot_scatter(axes[0][0], df, centers_df, x, y, names)
        plot_pca(axes[0][1], df, scaled, features)
    else:
        # ฟีเจอร์เดียววาดกราฟ 2 แกนไม่ได้ จึงเรียงเป็นแถวละคลัสเตอร์ (strip plot)
        rng = np.random.default_rng(RANDOM_STATE)
        df_plot = df.copy()
        df_plot["_row"] = df_plot["cluster"] + rng.uniform(-0.16, 0.16, len(df_plot))
        centers_plot = centers_df.copy()
        centers_plot["_row"] = centers_plot["cluster"]

        plot_scatter(axes[0][0], df_plot, centers_plot, x, "_row", names)
        axes[0][0].set_ylabel("Cluster")
        axes[0][0].set_yticks(range(chosen_k))
        axes[0][0].set_yticklabels(names)
        plot_sizes(axes[0][1], df, names)

    plot_elbow(axes[1][0], sweep, chosen_k)
    plot_silhouette(axes[1][1], sweep, chosen_k)

    fig.suptitle("K-Means clustering of stock data", x=0.02, ha="left",
                 fontsize=17, fontweight="bold", color=cs.INK, y=0.975)
    fig.text(0.02, 0.925,
             f"{len(df)} products · features: {', '.join(features)} · k = {chosen_k} · source: {source_label}",
             ha="left", fontsize=10, color=cs.INK_SECONDARY)

    handles, labels = axes[0][0].get_legend_handles_labels()
    # ชื่อกลุ่มยาวขึ้นเมื่อมีคำต่อท้ายยอดขาย จึงลดจำนวนคอลัมน์ไม่ให้ตัวหนังสือชนกัน
    per_row = 2 if any(len(text) > 34 for text in labels) else min(len(labels), 4)
    fig.legend(handles, labels, loc="lower center", ncol=max(per_row, 1),
               bbox_to_anchor=(0.5, 0.015), frameon=False)
    return fig


# ---------------------------------------------------------

def main() -> int:
    args = parse_args()
    cs.apply_style(headless=args.no_show)

    try:
        rows = fetch_products(url=args.url, days=args.days, file=args.file)
        df = to_dataframe(rows, args.features)
    except DataSourceError as exc:
        print(f"[ERROR] {exc}")
        return 1

    if len(df) < 3:
        print(f"[ERROR] มีสินค้าเพียง {len(df)} รายการ ยังจัดกลุ่มไม่ได้ (ต้องมีอย่างน้อย 3)")
        return 1

    scaled, scaler = scale_features(df, args.features)

    kmax = max(args.kmin, min(args.kmax, len(df) - 1))
    sweep = sweep_k(scaled, args.kmin, kmax)

    if args.k:
        chosen_k = min(args.k, len(df) - 1)
        if chosen_k != args.k:
            print(f"[INFO] ลด k จาก {args.k} เหลือ {chosen_k} เพราะข้อมูลมีแค่ {len(df)} รายการ")
    else:
        chosen_k = int(sweep.loc[sweep["silhouette"].idxmax(), "k"])
        print(f"[INFO] เลือก k = {chosen_k} อัตโนมัติ จากคะแนน Silhouette สูงสุด")

    df, centers_df, _ = fit_kmeans(df, scaled, scaler, args.features, chosen_k)
    names = profile_names(centers_df, args.features)
    summary = summarize(df, args.features, names)

    # ---- ผลลัพธ์ที่พิมพ์ออกหน้าจอ ----
    print("\n=== สรุปคลัสเตอร์ (Cluster characteristics) ===")
    print(summary.to_string(index=False))

    print("\n=== ตัวอย่างสินค้าพร้อมกลุ่มที่ถูกจัด ===")
    preview_cols = ["name", *args.features, "cluster"]
    print(df[preview_cols].sort_values(["cluster", args.features[0]]).head(20).to_string(index=False))

    print("\n=== จุดศูนย์กลางของแต่ละกลุ่ม (Centroids, หน่วยจริง) ===")
    print(centers_df.round(2).to_string(index=False))

    # ---- บันทึกไฟล์ ----
    out = output_dir()
    df.to_csv(out / "clusters.csv", index=False, encoding="utf-8-sig")
    summary.to_csv(out / "cluster_summary.csv", index=False, encoding="utf-8-sig")
    sweep.to_csv(out / "k_selection.csv", index=False, encoding="utf-8-sig")

    source_label = args.file if args.file else args.url
    fig = build_figure(df, scaled, centers_df, sweep, args.features, names, chosen_k, source_label)

    png = out / "kmeans_clusters.png"
    fig.savefig(png, dpi=160)
    print(f"\n[SAVED] กราฟ:      {png}")
    print(f"[SAVED] รายสินค้า: {out / 'clusters.csv'}")
    print(f"[SAVED] สรุปกลุ่ม: {out / 'cluster_summary.csv'}")

    if not args.no_show:
        import matplotlib.pyplot as plt
        plt.show()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
