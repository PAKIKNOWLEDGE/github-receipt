#!/usr/bin/env python3
"""GitHub Receipt Generator - Generate receipt-style summaries of GitHub profiles."""

import argparse
import os
import sys
import random
from datetime import datetime, timedelta
from pathlib import Path

try:
    import requests
except ImportError:
    print("需要安装 requests: pip install requests")
    sys.exit(1)

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("需要安装 Pillow: pip install Pillow")
    sys.exit(1)

# GitHub API
GITHUB_API = os.environ.get("GITHUB_API_URL", "https://api.github.com")

# Receipt styles
STYLES = {
    "classic": {"name": "经典收据", "bg": "#fefefe", "fg": "#000000", "accent": "#333333"},
    "vintage": {"name": "复古泛黄", "bg": "#f5e6c8", "fg": "#2c1810", "accent": "#8b4513"},
    "minimal": {"name": "极简黑白", "bg": "#ffffff", "fg": "#000000", "accent": "#666666"},
    "neon": {"name": "霓虹暗色", "bg": "#0a0a0a", "fg": "#00ff88", "accent": "#ff00ff"},
    "terminal": {"name": "终端风格", "bg": "#1e1e1e", "fg": "#00ff00", "accent": "#33ff33"},
}

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def hex_to_rgb(hex_color: str) -> tuple:
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Try to load a monospace font, fallback to default."""
    font_paths = [
        "C:/Windows/Fonts/consola.ttf",
        "C:/Windows/Fonts/cour.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/usr/share/fonts/TTF/DejaVuSansMono.ttf",
        "/System/Library/Fonts/Menlo.ttc",
    ]
    for fp in font_paths:
        if Path(fp).exists():
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                continue
    return ImageFont.load_default()


def get_bold_font(size: int) -> ImageFont.FreeTypeFont:
    bold_paths = [
        "C:/Windows/Fonts/consolab.ttf",
        "C:/Windows/Fonts/courbd.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
        "/System/Library/Fonts/Menlo.ttc",
    ]
    for fp in bold_paths:
        if Path(fp).exists():
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                continue
    return get_font(size)


def fetch_github_data(username: str, token: str = None) -> dict:
    """Fetch GitHub user data, repos, and recent commits."""
    headers = {"Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"token {token}"

    # Fetch user
    user_res = requests.get(f"{GITHUB_API}/users/{username}", headers=headers)
    if user_res.status_code == 404:
        print(f"错误: 用户 '{username}' 不存在")
        sys.exit(1)
    if user_res.status_code == 403:
        print("错误: API 速率限制。请设置 GITHUB_TOKEN 环境变量。")
        sys.exit(1)
    user_res.raise_for_status()
    user_data = user_res.json()

    # Fetch repos
    repos_res = requests.get(f"{GITHUB_API}/users/{username}/repos?per_page=100", headers=headers)
    repos_res.raise_for_status()
    repos = repos_res.json()

    # Fetch recent commits for mostActiveDay
    thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    commits_res = requests.get(
        f"{GITHUB_API}/search/commits?q=author:{username}+committer-date:>={thirty_days_ago}",
        headers={**headers, "Accept": "application/vnd.github.cloak-preview+json"},
    )
    most_active_day = "N/A"
    if commits_res.ok:
        commits = commits_res.json().get("items", [])
        if commits:
            day_counts = {}
            for c in commits:
                date_str = c.get("commit", {}).get("author", {}).get("date", "")
                if date_str:
                    try:
                        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                        day = DAYS[dt.weekday()]
                        day_counts[day] = day_counts.get(day, 0) + 1
                    except (ValueError, IndexError):
                        pass
            if day_counts:
                most_active_day = max(day_counts, key=day_counts.get)

    # Compute stats
    languages = {}
    stars = 0
    forks = 0
    for repo in repos:
        lang = repo.get("language")
        if lang:
            languages[lang] = languages.get(lang, 0) + 1
        stars += repo.get("stargazers_count", 0)
        forks += repo.get("forks_count", 0)

    top_langs = sorted(languages.items(), key=lambda x: x[1], reverse=True)[:3]

    return {
        "name": user_data.get("name") or username,
        "login": user_data["login"],
        "repos": user_data.get("public_repos", 0),
        "followers": user_data.get("followers", 0),
        "following": user_data.get("following", 0),
        "stars": stars,
        "forks": forks,
        "languages": ", ".join([l[0] for l in top_langs]) or "N/A",
        "commits_30d": commits_res.json().get("total_count", 0) if commits_res.ok else 0,
        "most_active_day": most_active_day,
        "score": user_data.get("public_repos", 0) + stars + user_data.get("followers", 0),
        "card_last4": f"****{random.randint(0, 9999):04d}",
        "auth_code": f"{random.randint(100000, 999999)}",
        "order": f"#{random.randint(10000, 99999)}",
    }


def draw_receipt(data: dict, style: str = "classic") -> Image.Image:
    """Draw receipt image with specified style."""
    s = STYLES[style]
    bg = hex_to_rgb(s["bg"])
    fg = hex_to_rgb(s["fg"])
    accent = hex_to_rgb(s["accent"])

    W, H = 420, 680
    img = Image.new("RGB", (W, H), bg)
    draw = ImageDraw.Draw(img)

    font = get_font(14)
    font_sm = get_font(11)
    font_lg = get_bold_font(18)
    font_title = get_bold_font(22)

    y = 20

    def line(text, f=None, fill=None, align="left", spacing=6):
        nonlocal y
        f = f or font
        fill = fill or fg
        bbox = draw.textbbox((0, 0), text, font=f)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        if align == "center":
            x = (W - tw) // 2
        elif align == "right":
            x = W - 20 - tw
        else:
            x = 20
        draw.text((x, y), text, font=f, fill=fill)
        y += th + spacing

    def dashed_line():
        nonlocal y
        for x in range(20, W - 20, 8):
            draw.line([(x, y), (x + 4, y)], fill=accent, width=1)
        y += 10

    def row(label, value):
        nonlocal y
        draw.text((20, y), label, font=font, fill=fg)
        bbox = draw.textbbox((0, 0), str(value), font=font)
        vw = bbox[2] - bbox[0]
        draw.text((W - 20 - vw, y), str(value), font=font, fill=fg)
        y += 22

    # Top tear effect
    for x in range(0, W, 10):
        draw.polygon([(x, 0), (x + 5, 8), (x + 10, 0)], fill=bg)

    # Title
    line("GITHUB RECEIPT", font_title, accent, "center", 12)
    line(datetime.now().strftime("%Y-%m-%d %H:%M:%S"), font_sm, accent, "center", 16)

    dashed_line()

    # User info
    line(f"CUSTOMER: {data['name']}", font_lg, fg, "left", 8)
    line(f"@{data['login']}", font_sm, accent, "left", 16)

    dashed_line()

    # Stats
    line("STATS", font, accent, "left", 8)
    row("Repositories", data["repos"])
    row("Stars Earned", f"{data['stars']:,}")
    row("Forks", f"{data['forks']:,}")
    row("Followers", f"{data['followers']:,}")
    row("Following", f"{data['following']:,}")

    dashed_line()

    # Languages
    line("TOP LANGUAGES", font, accent, "left", 8)
    line(data["languages"], font, fg, "left", 16)

    dashed_line()

    # Activity
    line("ACTIVITY", font, accent, "left", 8)
    row("Commits (30d)", f"{data['commits_30d']:,}")
    row("Most Active Day", data["most_active_day"])
    row("Profile Score", f"{data['score']:,}")

    dashed_line()

    # Payment info
    line("PAYMENT", font, accent, "left", 8)
    row("Card #", data["card_last4"])
    row("Auth Code", data["auth_code"])
    row("Order", data["order"])

    dashed_line()

    # Footer
    line("THANK YOU FOR CODING!", font, accent, "center", 8)
    line(f"github.com/{data['login']}", font_sm, accent, "center", 4)

    # Bottom tear effect
    for x in range(0, W, 10):
        draw.polygon([(x, H), (x + 5, H - 8), (x + 10, H)], fill=bg)

    return img


def main():
    parser = argparse.ArgumentParser(
        description="GitHub Receipt Generator - 生成 GitHub 个人资料收据",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s torvalds
  %(prog)s torvalds -s neon -o linus.png
  %(prog)s torvalds --style vintage
        """,
    )
    parser.add_argument("username", help="GitHub 用户名")
    parser.add_argument("-s", "--style", choices=STYLES.keys(), default="classic", help="收据风格 (默认: classic)")
    parser.add_argument("-o", "--output", help="输出文件路径 (默认: {username}_receipt.png)")
    parser.add_argument("-t", "--token", help="GitHub Token (也可通过 GITHUB_TOKEN 环境变量设置)")

    args = parser.parse_args()

    token = args.token or os.environ.get("GITHUB_TOKEN")
    output = args.output or f"{args.username}_receipt.png"

    print(f"正在获取 {args.username} 的 GitHub 数据...")
    data = fetch_github_data(args.username, token)

    print(f"正在生成 {STYLES[args.style]['name']} 风格收据...")
    img = draw_receipt(data, args.style)
    img.save(output, "PNG")

    print(f"已保存: {output}")


if __name__ == "__main__":
    main()
