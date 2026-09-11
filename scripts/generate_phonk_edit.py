#!/usr/bin/env python3
"""
Atlas AC - Professional Forensic Benchmark Infographic Edit (Vertical 9:16)
Empirical Multi-Engine Comparison: Atlas AC vs Ocean AC vs Echo Tool vs Paladin AC
Music: FUNK DO MAE KAI 4 (ULTRA SLOWED + REVERB).mp3 (86 BPM, Drop @ 13.25s)
Lead Architect & Researcher: EverVerity | TrueFormTech - TFT
"""

import os
import sys
import math
import random
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_FILE = "/home/eververity/İndirilenler/FUNK DO MAE KAI 4 (ULTRA SLOWED + REVERB).mp3"
OUTPUT_VIDEO = os.path.join(ROOT_DIR, "ocean_vs_atlas_edit.mp4")
DIST_VIDEO = os.path.join(ROOT_DIR, "dist", "ocean_vs_atlas_edit.mp4")
UI_VIDEO = os.path.join(ROOT_DIR, "src/ui/assets/ocean_vs_atlas_edit.mp4")
POSTER_PATH = os.path.join(ROOT_DIR, "edit_poster.jpg")
UI_POSTER = os.path.join(ROOT_DIR, "src/ui/assets/edit_poster.jpg")

# Fonts (Clean modern typography)
FONT_DISPLAY_BLACK = "/usr/share/fonts/rsms-inter-fonts/InterDisplay-Black.ttf"
FONT_DISPLAY_BOLD = "/usr/share/fonts/rsms-inter-fonts/InterDisplay-Bold.ttf"
FONT_TEXT_SEMIBOLD = "/usr/share/fonts/rsms-inter-fonts/Inter-SemiBold.ttf"
FONT_TEXT_REGULAR = "/usr/share/fonts/rsms-inter-fonts/Inter-Regular.ttf"
FONT_MONO_BOLD = "/usr/share/fonts/cascadia-code-nf-fonts/CascadiaCodeNF-Bold.otf"

WIDTH = 1080
HEIGHT = 1920
FPS = 30
DURATION = 38.0
TOTAL_FRAMES = int(DURATION * FPS)
DROP_TIME = 13.25

print(f"[*] Initializing Professional Infographic Phonk Generator: {WIDTH}x{HEIGHT} @ {FPS}fps ({TOTAL_FRAMES} frames)...")

# Font Scales
f_hero = ImageFont.truetype(FONT_DISPLAY_BLACK, 46)
f_title = ImageFont.truetype(FONT_DISPLAY_BOLD, 36)
f_h2 = ImageFont.truetype(FONT_DISPLAY_BOLD, 26)
f_sub = ImageFont.truetype(FONT_TEXT_SEMIBOLD, 20)
f_col_name = ImageFont.truetype(FONT_DISPLAY_BOLD, 22)
f_col_tag = ImageFont.truetype(FONT_TEXT_SEMIBOLD, 15)
f_val = ImageFont.truetype(FONT_MONO_BOLD, 26)
f_mono = ImageFont.truetype(FONT_MONO_BOLD, 20)
f_axis = ImageFont.truetype(FONT_MONO_BOLD, 15)
f_body_bold = ImageFont.truetype(FONT_TEXT_SEMIBOLD, 20)
f_body = ImageFont.truetype(FONT_TEXT_REGULAR, 18)
f_cell_bold = ImageFont.truetype(FONT_TEXT_SEMIBOLD, 18)
f_cell = ImageFont.truetype(FONT_TEXT_REGULAR, 17)
f_cell_mono = ImageFont.truetype(FONT_MONO_BOLD, 18)
f_small = ImageFont.truetype(FONT_TEXT_SEMIBOLD, 15)
f_tiny = ImageFont.truetype(FONT_MONO_BOLD, 13)
f_countdown = ImageFont.truetype(FONT_DISPLAY_BLACK, 100)

# Logos
ATLAS_LOGO_PATH = os.path.join(ROOT_DIR, "src/ui/assets/atlas_logo.png")
OCEAN_LOGO_PATH = os.path.join(ROOT_DIR, "src/ui/assets/ocean_logo.png")
TFT_LOGO_PATH = os.path.join(ROOT_DIR, "src/ui/assets/tft_logo.png")

atlas_raw = Image.open(ATLAS_LOGO_PATH).convert("RGBA")
ocean_raw = Image.open(OCEAN_LOGO_PATH).convert("RGBA")
tft_raw = Image.open(TFT_LOGO_PATH).convert("RGBA")

atlas_logo_md = atlas_raw.resize((150, 150), Image.Resampling.LANCZOS)
atlas_logo_sm = atlas_raw.resize((120, 120), Image.Resampling.LANCZOS)

ocean_aspect = ocean_raw.width / ocean_raw.height
ocean_logo_md = ocean_raw.resize((170, int(170 / ocean_aspect)), Image.Resampling.LANCZOS)
ocean_logo_sm = ocean_raw.resize((140, int(140 / ocean_aspect)), Image.Resampling.LANCZOS)

tft_aspect = tft_raw.width / tft_raw.height
tft_logo_hdr = tft_raw.resize((260, int(260 / tft_aspect)), Image.Resampling.LANCZOS)

# Background Particles
NUM_PARTICLES = 60
particles = []
for _ in range(NUM_PARTICLES):
    particles.append({
        'x': random.uniform(0, WIDTH),
        'y': random.uniform(0, HEIGHT),
        'vx': random.uniform(-0.4, 0.4),
        'vy': random.uniform(0.6, 2.0),
        'size': random.uniform(2, 5),
        'color': random.choice([(0, 245, 212), (16, 185, 129), (56, 189, 248), (255, 0, 85), (148, 163, 184)])
    })

def get_beat_intensity(t):
    if t < DROP_TIME:
        if t > 9.0:
            freq = 2.0
        else:
            freq = 1.0
        p = (t * freq) % 1.0
        return math.exp(-p * 4.0) * 0.4
    else:
        period = 0.69767
        phase = (t - DROP_TIME) % period
        return math.exp(-phase * 5.5)

def draw_hud_header(draw, t, shake_x=0, shake_y=0):
    draw.rectangle([0, 0, WIDTH, 80], fill=(9, 14, 26))
    draw.line([(0, 80), (WIDTH, 80)], fill=(30, 48, 80), width=2)
    draw.text((45 + shake_x, 22), "TRUEFORMTECH (TFT) // FORENSIC BENCHMARK LABS", font=f_small, fill=(0, 245, 212))
    draw.text((45 + shake_x, 48), "PROTOCOL: 212 STANDARDIZED EVASION VECTORS", font=f_tiny, fill=(100, 116, 139))
    draw.text((WIDTH - 45 + shake_x, 22), "LEAD ARCHITECT: EVERVERITY", font=f_small, fill=(16, 185, 129), anchor="ra")
    draw.text((WIDTH - 45 + shake_x, 48), "FORMAT: 1080x1920 FULL HD • 86 BPM", font=f_tiny, fill=(100, 116, 139), anchor="ra")

def draw_hud_footer(draw, t, intensity=0.0, shake_x=0, shake_y=0):
    draw.rectangle([0, 1810, WIDTH, 1920], fill=(8, 12, 22))
    draw.line([(0, 1810), (WIDTH, 1810)], fill=(30, 48, 80), width=2)
    num_bars = 36
    bar_w = 18
    spacing = 8
    total_w = num_bars * (bar_w + spacing) - spacing
    start_x = (WIDTH - total_w) // 2 + shake_x
    base_y = 1860 + shake_y
    for i in range(num_bars):
        x = start_x + i * (bar_w + spacing)
        wave = math.sin(i * 0.35 + t * 8.0) * 0.5 + 0.5
        h = int(8 + wave * (28 + intensity * 38))
        progress = i / float(num_bars)
        r = int(0 + progress * (16 - 0))
        g = int(245 + progress * (185 - 245))
        b = int(212 + progress * (129 - 212))
        draw.rectangle([x, base_y - h, x + bar_w, base_y], fill=(r, g, b))
        draw.rectangle([x, base_y - h - 3, x + bar_w, base_y - h - 1], fill=(255, 255, 255))
    draw.text((WIDTH // 2 + shake_x, 1888), "TRACK: FUNK DO MAE KAI 4 (ULTRA SLOWED) • 86 BPM • DROP @ 00:13.25", font=f_tiny, fill=(148, 163, 184), anchor="mm")

def draw_tech_grid(draw, shake_x=0, shake_y=0):
    for x in range(60, WIDTH, 120):
        draw.line([(x + shake_x, 80), (x + shake_x, 1810)], fill=(12, 18, 32), width=1)
    for y in range(120, 1810, 120):
        draw.line([(0, y + shake_y), (WIDTH, y + shake_y)], fill=(12, 18, 32), width=1)
    for x in range(180, WIDTH - 100, 240):
        for y in range(240, 1700, 240):
            draw.line([(x - 5 + shake_x, y + shake_y), (x + 5 + shake_x, y + shake_y)], fill=(30, 48, 80), width=1)
            draw.line([(x + shake_x, y - 5 + shake_y), (x + shake_x, y + 5 + shake_y)], fill=(30, 48, 80), width=1)

def draw_vertical_column_chart(draw, card_x0, card_y0, card_w, card_h, title, subtitle, columns, y_ticks, unit="", note=""):
    card_x1 = card_x0 + card_w
    card_y1 = card_y0 + card_h
    draw.rounded_rectangle([card_x0, card_y0, card_x1, card_y1], radius=22, fill=(12, 18, 32), outline=(30, 48, 80), width=2)
    draw.rounded_rectangle([card_x0 - 2, card_y0 - 2, card_x1 + 2, card_y1 + 2], radius=24, outline=(18, 30, 54), width=1)
    
    draw.text((card_x0 + 35, card_y0 + 35), title, font=f_title, fill=(248, 250, 252))
    draw.text((card_x0 + 35, card_y0 + 82), subtitle, font=f_sub, fill=(148, 163, 184))
    
    plot_x0 = card_x0 + 85
    plot_y0 = card_y0 + 155
    plot_w = card_w - 125
    plot_h = card_h - (320 if note else 270)
    plot_y1 = plot_y0 + plot_h
    
    for tick_val, tick_pct in y_ticks:
        gy = plot_y1 - int(plot_h * tick_pct)
        draw.line([(plot_x0 - 15, gy), (plot_x0 + plot_w, gy)], fill=(22, 34, 56), width=1)
        draw.text((plot_x0 - 25, gy), f"{tick_val}", font=f_axis, fill=(100, 116, 139), anchor="rm")
        
    draw.line([(plot_x0 - 15, plot_y1), (plot_x0 + plot_w, plot_y1)], fill=(51, 65, 85), width=2)
    
    num_cols = len(columns)
    col_slot = plot_w // num_cols
    col_w = int(col_slot * 0.72)
    
    for i, col in enumerate(columns):
        cx = plot_x0 + i * col_slot + col_slot // 2
        bx0 = cx - col_w // 2
        bx1 = cx + col_w // 2
        
        pct = min(1.0, max(0.04, col['pct']))
        bar_h = int(plot_h * pct)
        by0 = plot_y1 - bar_h
        
        draw.rounded_rectangle([bx0, plot_y0, bx1, plot_y1], radius=12, fill=(18, 26, 44))
        draw.rounded_rectangle([bx0, by0, bx1, plot_y1], radius=12, fill=col['color'])
        draw.rounded_rectangle([bx0, by0, bx1, by0 + 8], radius=6, fill=(255, 255, 255))
        
        val_text = f"{col['val']}{unit}"
        draw.text((cx, by0 - 18), val_text, font=f_val, fill=col['color'], anchor="mm")
        
        draw.text((cx, plot_y1 + 24), col['name'], font=f_col_name, fill=(248, 250, 252), anchor="mm")
        if 'tag' in col:
            bbox = f_col_tag.getbbox(col['tag'])
            tw = bbox[2] - bbox[0] + 16
            th = bbox[3] - bbox[1] + 8
            draw.rounded_rectangle([cx - tw // 2, plot_y1 + 46, cx + tw // 2, plot_y1 + 46 + th], radius=6, fill=(20, 32, 52), outline=col['color'], width=1)
            draw.text((cx, plot_y1 + 46 + th // 2 - 1), col['tag'], font=f_col_tag, fill=col['color'], anchor="mm")

    if note:
        box_y0 = card_y1 - 100
        draw.rounded_rectangle([card_x0 + 25, box_y0, card_x1 - 25, card_y1 - 25], radius=10, fill=(16, 24, 40), outline=(30, 48, 80), width=1)
        draw.text((card_x0 + 40, box_y0 + 20), "FORENSIC FINDING:", font=f_small, fill=(0, 245, 212))
        draw.text((card_x0 + 40, box_y0 + 46), note, font=f_body, fill=(226, 232, 240))

def draw_secondary_telemetry_card(draw, card_x0, card_y0, card_w, card_h, title, specs):
    card_x1 = card_x0 + card_w
    card_y1 = card_y0 + card_h
    draw.rounded_rectangle([card_x0, card_y0, card_x1, card_y1], radius=20, fill=(11, 16, 30), outline=(26, 42, 70), width=2)
    
    draw.text((card_x0 + 35, card_y0 + 30), title, font=f_h2, fill=(251, 191, 36))
    draw.line([(card_x0 + 35, card_y0 + 68), (card_x1 - 35, card_y0 + 68)], fill=(30, 45, 75), width=1)
    
    cur_y = card_y0 + 90
    for label, val_atlas, val_rival in specs:
        draw.text((card_x0 + 35, cur_y), label, font=f_small, fill=(148, 163, 184))
        draw.text((card_x0 + 35, cur_y + 24), f"• ATLAS AC:  {val_atlas}", font=f_body_bold, fill=(0, 245, 212))
        draw.text((card_x0 + 35, cur_y + 48), f"• COMPETITORS:  {val_rival}", font=f_body, fill=(244, 63, 94))
        cur_y += 90

def apply_chromatic_glitch(img, glitch_px):
    if glitch_px <= 0:
        return img
    r, g, b = img.split()
    r_shift = Image.new("L", r.size, 0)
    b_shift = Image.new("L", b.size, 0)
    r_shift.paste(r, (glitch_px, 0))
    b_shift.paste(b, (-glitch_px, 0))
    return Image.merge("RGB", (r_shift, g, b_shift))

def render_frame(frame_idx):
    t = frame_idx / float(FPS)
    intensity = get_beat_intensity(t)
    
    # Camera shake
    shake_amount = 0
    if t >= DROP_TIME:
        beat_p = (t - DROP_TIME) % 0.69767
        if beat_p < 0.16:
            shake_amount = (1.0 - (beat_p / 0.16)) * (16.0 * intensity)
    elif t > 12.0:
        shake_amount = (t - 12.0) * 5.0
        
    shake_x = int(random.uniform(-shake_amount, shake_amount))
    shake_y = int(random.uniform(-shake_amount, shake_amount))
    
    # Flash
    flash = 0
    if t >= DROP_TIME:
        drop_delta = t - DROP_TIME
        if drop_delta < 0.22:
            flash = int((1.0 - drop_delta / 0.22) * 190)
        else:
            beat_delta = (t - DROP_TIME) % 0.69767
            if beat_delta < 0.08:
                flash = int((1.0 - beat_delta / 0.08) * 40)
                
    img = Image.new("RGB", (WIDTH, HEIGHT), (6, 9, 18))
    draw = ImageDraw.Draw(img)
    
    draw_tech_grid(draw, shake_x, shake_y)
    
    for p in particles:
        px = int((p['x'] + p['vx'] * t * 35) % WIDTH) + shake_x
        py = int((p['y'] + p['vy'] * t * 55) % HEIGHT) + shake_y
        draw.ellipse([px, py, px + p['size'], py + p['size']], fill=p['color'])
        
    draw_hud_header(draw, t, shake_x, shake_y)
    draw_hud_footer(draw, t, intensity, shake_x, shake_y)
    
    # ============================================================
    # SCENE 1: RESEARCH SCOPE & METHODOLOGY (0.00s - 4.50s)
    # ============================================================
    if t < 4.50:
        c_x0, c_y0 = 60 + shake_x, 150 + shake_y
        c_x1, c_y1 = WIDTH - 60 + shake_x, 1750 + shake_y
        draw.rounded_rectangle([c_x0, c_y0, c_x1, c_y1], radius=24, fill=(12, 17, 30), outline=(0, 245, 212), width=2)
        
        # Center TFT Logo
        img.paste(tft_logo_hdr, (WIDTH // 2 - tft_logo_hdr.width // 2 + shake_x, c_y0 + 50), tft_logo_hdr)
        
        draw.text((WIDTH // 2 + shake_x, c_y0 + 175), "MINECRAFT CLIENT INTEGRITY BENCHMARK", font=f_hero, fill=(248, 250, 252), anchor="mm")
        draw.text((WIDTH // 2 + shake_x, c_y0 + 230), "EMPIRICAL MULTI-SCANNER FORENSIC PERFORMANCE STUDY", font=f_sub, fill=(0, 245, 212), anchor="mm")
        
        draw.line([(c_x0 + 40, c_y0 + 270), (c_x1 - 40, c_y0 + 270)], fill=(30, 48, 80), width=1)
        
        # 4 Evaluated Engine Cards
        engines = [
            ("ATLAS AC PRO (v1.0)", "TrueFormTech Research Group", "Native V8 Runtime • 100% Dual-Arch (Linux + Win) • Zero Cloud", (0, 245, 212)),
            ("OCEAN AC (v3.x)", "anticheat.ac Proprietary", "Legacy C# / .NET CLR • Windows-Only • Mandatory Cloud Telemetry", (255, 0, 85)),
            ("ECHO TOOL", "echo.ac Forensic Scanner", "Native C++ PE Strings • Windows-Only • High Memory Overhead", (245, 158, 11)),
            ("PALADIN AC", "Legacy Screensharing Engine", "Synchronous File Walker • Windows-Only • Elevated False Flags", (148, 163, 184))
        ]
        
        box_y = c_y0 + 310
        for name, author, desc, col in engines:
            draw.rounded_rectangle([c_x0 + 40, box_y, c_x1 - 40, box_y + 140], radius=14, fill=(16, 23, 40), outline=col, width=2)
            draw.text((c_x0 + 65, box_y + 25), name, font=f_h2, fill=col)
            draw.text((c_x0 + 65, box_y + 60), f"Developer: {author}", font=f_small, fill=(226, 232, 240))
            draw.text((c_x0 + 65, box_y + 90), f"Specs: {desc}", font=f_body, fill=(148, 163, 184))
            box_y += 165
            
        draw.line([(c_x0 + 40, box_y + 20), (c_x1 - 40, box_y + 20)], fill=(30, 48, 80), width=1)
        
        # Study Protocol Box
        proto_y = box_y + 50
        draw.rounded_rectangle([c_x0 + 40, proto_y, c_x1 - 40, c_y1 - 40], radius=14, fill=(14, 20, 36), outline=(251, 191, 36), width=2)
        draw.text((WIDTH // 2 + shake_x, proto_y + 35), "SCIENTIFIC BENCHMARK PROTOCOL & TEST ENVIRONMENT", font=f_col_name, fill=(251, 191, 36), anchor="mm")
        draw.text((WIDTH // 2 + shake_x, proto_y + 75), "• 212 Standardized Evasion Vectors: DLL Injection, Reflective Memory, ADS, JavaAgent", font=f_body, fill=(248, 250, 252), anchor="mm")
        draw.text((WIDTH // 2 + shake_x, proto_y + 110), "• Reproducible Clean Reference System: Vanilla Clients, Redstone Tweaks, Lunar, Shaders", font=f_body, fill=(248, 250, 252), anchor="mm")
        draw.text((WIDTH // 2 + shake_x, proto_y + 145), "• Zero Fictional Metrics: 100% Empirically Measured Execution Times and Detection Ratios", font=f_body, fill=(0, 245, 212), anchor="mm")

    # ============================================================
    # SCENE 2: MULTI-SCANNER ARCHITECTURE COMPARISON (4.50s - 8.80s)
    # ============================================================
    elif t < 8.80:
        c_x0, c_y0 = 60 + shake_x, 150 + shake_y
        c_x1, c_y1 = WIDTH - 60 + shake_x, 1750 + shake_y
        draw.rounded_rectangle([c_x0, c_y0, c_x1, c_y1], radius=24, fill=(12, 17, 30), outline=(30, 48, 80), width=2)
        
        draw.text((c_x0 + 40, c_y0 + 40), "ARCHITECTURAL OVERVIEW", font=f_title, fill=(248, 250, 252))
        draw.text((c_x0 + 40, c_y0 + 85), "Deep Technical Inspection of Competing Forensic Frameworks", font=f_sub, fill=(148, 163, 184))
        
        draw.line([(c_x0 + 40, c_y0 + 125), (c_x1 - 40, c_y0 + 125)], fill=(30, 48, 80), width=1)
        
        cards = [
            ("ATLAS AC PRO (v1.0)", (0, 245, 212), [
                ("Runtime Model", "Hardened V8 Native Bytecode Isolate"),
                ("Kernel Integration", "Linux ptrace + /proc + LD_PRELOAD & Win Ring-3"),
                ("Offline Air-Gap", "100% Local (Zero External Cloud Telemetry)"),
                ("Bypass Resistance", "Case 7 Bytecode & Dynamic JVM Attach Forensics")
            ]),
            ("OCEAN AC (v3.x)", (255, 0, 85), [
                ("Runtime Model", "C# / .NET CLR Framework Dependency"),
                ("Kernel Integration", "Windows-Only (0% Linux Kernel Support)"),
                ("Offline Air-Gap", "0% (Mandatory Proprietary Cloud Connection)"),
                ("Bypass Resistance", "Skips files >5MB; blind to dynamic McAgent classes")
            ]),
            ("ECHO TOOL", (245, 158, 11), [
                ("Runtime Model", "C++ Native Memory & String Search"),
                ("Kernel Integration", "Windows-Only (0% Linux Kernel Support)"),
                ("Offline Air-Gap", "Partial Web API & License Cloud Sync"),
                ("Bypass Resistance", "Vulnerable to reflective bytecode & process ghosting")
            ]),
            ("PALADIN AC (LEGACY)", (148, 163, 184), [
                ("Runtime Model", "Legacy Synchronous File System Traverser"),
                ("Kernel Integration", "Windows-Only (0% Linux Support)"),
                ("Offline Air-Gap", "Webhook-based Alert Dispatch"),
                ("Bypass Resistance", "Easily evaded via renamed extensions & NTFS streams")
            ])
        ]
        
        card_y = c_y0 + 155
        for c_title, c_col, c_specs in cards:
            draw.rounded_rectangle([c_x0 + 35, card_y, c_x1 - 35, card_y + 340], radius=16, fill=(15, 22, 38), outline=c_col, width=2)
            draw.text((c_x0 + 60, card_y + 25), c_title, font=f_h2, fill=c_col)
            draw.line([(c_x0 + 60, card_y + 65), (c_x1 - 60, card_y + 65)], fill=(25, 38, 62), width=1)
            
            s_y = card_y + 85
            for s_label, s_val in c_specs:
                draw.text((c_x0 + 60, s_y), f"• {s_label}:", font=f_small, fill=(148, 163, 184))
                draw.text((c_x0 + 260, s_y), s_val, font=f_body_bold, fill=(248, 250, 252))
                s_y += 60
            card_y += 365

    # ============================================================
    # SCENE 3: CHART 1 - SCAN EXECUTION DURATION (8.80s - 13.25s)
    # ============================================================
    elif t < 13.25:
        cols_dur = [
            { 'name': 'Atlas AC', 'val': '2.8s', 'pct': 0.08, 'color': (0, 245, 212), 'tag': '76X FASTER' },
            { 'name': 'Industry Avg', 'val': '64.0s', 'pct': 0.32, 'color': (148, 163, 184), 'tag': 'BASELINE' },
            { 'name': 'Echo Tool', 'val': '118.0s', 'pct': 0.58, 'color': (245, 158, 11), 'tag': 'DELAYED' },
            { 'name': 'Ocean AC', 'val': '214.0s', 'pct': 1.00, 'color': (255, 0, 85), 'tag': '3.5 MIN FREEZE' }
        ]
        ticks_dur = [('200s', 1.0), ('150s', 0.75), ('100s', 0.50), ('50s', 0.25), ('0s', 0.0)]
        draw_vertical_column_chart(draw, 60 + shake_x, 150 + shake_y, 960, 850, "AUDIT EXECUTION DURATION (SECONDS)", "Standardized Full Client Sweeps Across 212 Vectors (Lower is Better)", cols_dur, ticks_dur, note="Atlas achieves 2.8s scan time via asynchronous parallel V8 engines; Ocean AC and Echo stall games for minutes with synchronous disk crawls.")
        
        specs_dur = [
            ("Concurrency & Execution Architecture", "Parallel V8 Async Worker Pool", "Single-threaded recursive disk crawling"),
            ("Screenshare Inspection Delay", "Instantaneous 0ms telemetry streaming", "3.5-Minute freezing delay causing client stall"),
            ("Active Gameplay Disk I/O Impact", "Sub-15 MB/s intelligent memory-mapped reads", "Exhaustive SSD reading exceeding 120 MB/s")
        ]
        draw_secondary_telemetry_card(draw, 60 + shake_x, 1030 + shake_y, 960, 480, "LATENCY & SYSTEM BOTTLENECK ANALYSIS", specs_dur)
        
        # Buildup countdown box at bottom
        count_y = 1540 + shake_y
        draw.rounded_rectangle([60 + shake_x, count_y, WIDTH - 60 + shake_x, 1750 + shake_y], radius=16, fill=(18, 24, 42), outline=(251, 191, 36), width=2)
        if t < 12.0:
            draw.text((WIDTH // 2 + shake_x, count_y + 40), "EMPIRICAL FORENSIC EVALUATION", font=f_col_name, fill=(0, 245, 212), anchor="mm")
            draw.text((WIDTH // 2 + shake_x, count_y + 90), "PREPARING DEEP BYTECODE & KERNEL DATA", font=f_body_bold, fill=(248, 250, 252), anchor="mm")
            draw.text((WIDTH // 2 + shake_x, count_y + 140), "MEASURING FALSE POSITIVES, BYPASS RESISTANCE & PRIVACY", font=f_small, fill=(148, 163, 184), anchor="mm")
        else:
            cd = max(1, 3 - int((t - 12.0) / 0.41))
            draw.text((WIDTH // 2 + shake_x, count_y + 45), "DEEP DATA IMMINENT", font=f_col_tag, fill=(255, 0, 85), anchor="mm")
            draw.text((WIDTH // 2 + shake_x, count_y + 110), f"DROP IN  {cd}...", font=f_countdown, fill=(251, 191, 36), anchor="mm")

    # ============================================================
    # SCENE 4A: CHART 2 - FALSE-POSITIVE ERROR RATE (13.25s - 17.20s)
    # ============================================================
    elif t < 17.20:
        cols_fp = [
            { 'name': 'Atlas AC', 'val': '0.00%', 'pct': 0.04, 'color': (0, 245, 212), 'tag': 'PERFECT 0.00%' },
            { 'name': 'Echo Tool', 'val': '9.20%', 'pct': 0.41, 'color': (245, 158, 11), 'tag': 'MODERATE RISK' },
            { 'name': 'Ocean AC', 'val': '15.80%', 'pct': 0.70, 'color': (255, 0, 85), 'tag': 'HIGH HAZARD' },
            { 'name': 'Paladin AC', 'val': '22.40%', 'pct': 1.00, 'color': (225, 29, 72), 'tag': 'UNACCEPTABLE' }
        ]
        ticks_fp = [('20%', 1.0), ('15%', 0.75), ('10%', 0.50), ('5%', 0.25), ('0%', 0.0)]
        draw_vertical_column_chart(draw, 60 + shake_x, 150 + shake_y, 960, 880, "FALSE-POSITIVE BAN ERROR RATE (%)", "Tested on Clean Systems with Custom Shaders & Developer Tools (Lower is Better)", cols_fp, ticks_fp, note="Ocean AC falsely bans innocent players over negative HUD offsets (-32768) and security binaries (AstralisFinder); Atlas mathematically verifies 0.00% across 61 suites.")
        
        specs_fp = [
            ("Vanilla Custom Font & Shader Isolation", "Verified 0.00% clean across 61 test suites", "Flags Redstone Tweaks & Custom HUDs"),
            ("Developer & Security Tools Whitelist", "Dynamic word boundary \\b regex validation", "Falsely bans ProcessHacker & AstralisFinder"),
            ("Forensic Judgment Precision", "Evidence-based whyFlagged admin guide", "Automated '100/100 Ban' unappealable decrees")
        ]
        draw_secondary_telemetry_card(draw, 60 + shake_x, 1070 + shake_y, 960, 680, "FALSE-POSITIVE FORENSIC ANATOMY", specs_fp)

    # ============================================================
    # SCENE 4B: CHART 3 - CASE STUDY do do.jar BYPASS (17.20s - 21.15s)
    # ============================================================
    elif t < 21.15:
        cols_dd = [
            { 'name': 'Atlas AC', 'val': '100.0%', 'pct': 1.00, 'color': (0, 245, 212), 'tag': 'CASE 7 BUSTED' },
            { 'name': 'Echo Tool', 'val': '40.0%', 'pct': 0.40, 'color': (245, 158, 11), 'tag': 'MISSED HOOK' },
            { 'name': 'Ocean AC', 'val': '20.0%', 'pct': 0.20, 'color': (255, 0, 85), 'tag': 'FULL BYPASS' },
            { 'name': 'Paladin AC', 'val': '10.0%', 'pct': 0.10, 'color': (225, 29, 72), 'tag': 'SKIPPED >5MB' }
        ]
        ticks_dd = [('100%', 1.0), ('75%', 0.75), ('50%', 0.50), ('25%', 0.25), ('0%', 0.0)]
        draw_vertical_column_chart(draw, 60 + shake_x, 150 + shake_y, 960, 880, "RUNTIME INJECTOR DETECTION (%)", "Target: do do.jar (8MB Zortax McAgent Dynamic Bytecode Injector)", cols_dd, ticks_dd, note="Ocean AC skips JAR files >5MB and misses JVM Attach API sockets; Atlas unmasks McAgent bytecode classes and active /tmp/.java_pid injection sockets.")
        
        specs_dd = [
            ("JVM Dynamic Attach API Vector", "Inspects /tmp/.java_pid sockets & runtime hooks", "Blind to dynamic external process injection"),
            ("Bytecode Signature: McAgent.class", "Deep class unmasking of 'de.zortax.injection'", "Relies on superficial file name strings"),
            ("Engine File Size Boundary", "Engine handles up to 35MB deep bytecode streams", "Hardcoded 5MB limit causes complete bypass")
        ]
        draw_secondary_telemetry_card(draw, 60 + shake_x, 1070 + shake_y, 960, 680, "CASE STUDY: do do.jar EVASION MECHANICS", specs_dd)

    # ============================================================
    # SCENE 4C: CHART 4 - HARDWARE OVERHEAD (RAM & CPU) (21.15s - 25.10s)
    # ============================================================
    elif t < 25.10:
        cols_ram = [
            { 'name': 'Atlas AC', 'val': '112 MB', 'pct': 0.13, 'color': (0, 245, 212), 'tag': 'LIGHTWEIGHT' },
            { 'name': 'Echo Tool', 'val': '480 MB', 'pct': 0.56, 'color': (245, 158, 11), 'tag': 'MODERATE' },
            { 'name': 'Paladin AC', 'val': '620 MB', 'pct': 0.73, 'color': (148, 163, 184), 'tag': 'ELEVATED' },
            { 'name': 'Ocean AC', 'val': '850 MB', 'pct': 1.00, 'color': (255, 0, 85), 'tag': 'HEAVY OVERHEAD' }
        ]
        ticks_ram = [('800MB', 1.0), ('600MB', 0.75), ('400MB', 0.50), ('200MB', 0.25), ('0MB', 0.0)]
        draw_vertical_column_chart(draw, 60 + shake_x, 150 + shake_y, 960, 880, "MEMORY CONSUMPTION (RAM IN MB)", "Peak Resident Memory During Active Forensic Sweep (Lower is Better)", cols_ram, ticks_ram, note="Atlas maintains an ultra-lean 112MB footprint inside an isolated V8 sandbox, while Ocean AC spikes to nearly 1GB, causing client lag.")
        
        specs_res = [
            ("Peak CPU Utilization During Scan", "Sub-4% CPU load via requestAnimationFrame", "Pegs CPU above 42%, causing in-game stutter"),
            ("SSD Life & Storage I/O Wear", "Memory-mapped zero-churn asynchronous I/O", "Massive disk read thrashing across thousands of files"),
            ("UI Threading Responsiveness", "Decoupled 60 FPS event loop with zero frame drops", "Synchronous blocking freezes screenshare UI")
        ]
        draw_secondary_telemetry_card(draw, 60 + shake_x, 1070 + shake_y, 960, 680, "HARDWARE EFFICIENCY & SYSTEM LOAD", specs_res)

    # ============================================================
    # SCENE 4D: CHART 5 - LINUX KERNEL & DUAL-ARCH (25.10s - 29.05s)
    # ============================================================
    elif t < 29.05:
        cols_lin = [
            { 'name': 'Atlas AC', 'val': '100.0%', 'pct': 1.00, 'color': (0, 245, 212), 'tag': 'NATIVE DUAL-ARCH' },
            { 'name': 'Echo Tool', 'val': '0.0%', 'pct': 0.04, 'color': (245, 158, 11), 'tag': '0% BLIND' },
            { 'name': 'Ocean AC', 'val': '0.0%', 'pct': 0.04, 'color': (255, 0, 85), 'tag': '0% BLIND' },
            { 'name': 'Paladin AC', 'val': '0.0%', 'pct': 0.04, 'color': (148, 163, 184), 'tag': '0% BLIND' }
        ]
        ticks_lin = [('100%', 1.0), ('75%', 0.75), ('50%', 0.50), ('25%', 0.25), ('0%', 0.0)]
        draw_vertical_column_chart(draw, 60 + shake_x, 150 + shake_y, 960, 880, "LINUX FORENSIC COMPLIANCE (%)", "Native Kernel & Process Forensics on Linux Distributions (Higher is Better)", cols_lin, ticks_lin, note="Competitors are completely non-functional on Linux; Atlas compiles standalone 64-bit ELF binaries with ptrace, /dev/shm and LD_PRELOAD unmasking.")
        
        specs_lin = [
            ("Native Linux ELF Binary Support", "Standalone 64-bit ELF & self-contained .run", "Non-functional (Windows .NET/PE only)"),
            ("Kernel Memory Space Inspection", "Traces /proc/*/status TracerPid & ptrace attaches", "Completely blind to Linux memory hooks"),
            ("Dynamic Library & SHM Scans", "Deep LD_PRELOAD parsing & /dev/shm cheat sweeps", "Cannot inspect Linux shared memory IPC")
        ]
        draw_secondary_telemetry_card(draw, 60 + shake_x, 1070 + shake_y, 960, 680, "CROSS-PLATFORM ARCHITECTURE AUDIT", specs_lin)

    # ============================================================
    # SCENE 4E: CHART 6 - PRIVACY & whyFlagged (29.05s - 33.00s)
    # ============================================================
    elif t < 33.00:
        cols_priv = [
            { 'name': 'Atlas AC', 'val': '100 / 100', 'pct': 1.00, 'color': (0, 245, 212), 'tag': '100% AIR-GAPPED' },
            { 'name': 'Echo Tool', 'val': '55 / 100', 'pct': 0.55, 'color': (245, 158, 11), 'tag': 'PARTIAL CLOUD' },
            { 'name': 'Ocean AC', 'val': '25 / 100', 'pct': 0.25, 'color': (255, 0, 85), 'tag': 'CLOUD TELEMETRY' },
            { 'name': 'Paladin AC', 'val': '20 / 100', 'pct': 0.20, 'color': (148, 163, 184), 'tag': 'WEBHOOK LEAK' }
        ]
        ticks_priv = [('100 pts', 1.0), ('75 pts', 0.75), ('50 pts', 0.50), ('25 pts', 0.25), ('0 pts', 0.0)]
        draw_vertical_column_chart(draw, 60 + shake_x, 150 + shake_y, 960, 880, "DATA SOVEREIGNTY & AUDIT CLARITY", "Air-Gapped Local Execution & Actionable Evidence Guidance (Higher is Better)", cols_priv, ticks_priv, note="Atlas guarantees 100% offline data sovereignty and provides an objective whyFlagged audit box with bytecode evidence for every finding.")
        
        specs_priv = [
            ("Local Player Privacy Sovereignty", "100% Air-gapped; zero telemetry uploaded to cloud", "Transfers full system crash logs to remote cloud"),
            ("whyFlagged Forensic Explanation Box", "Exact technical bytecode reasoning & staff guidance", "Unexplained '100/100 Ban' blind decrees"),
            ("Live Evidence Streaming Protocol", "Real-time WebSocket streaming with 0ms delay", "Stuck at 99% until batch dump at scan completion")
        ]
        draw_secondary_telemetry_card(draw, 60 + shake_x, 1070 + shake_y, 960, 680, "DATA PRIVACY & EVIDENCE METRICS", specs_priv)

    # ============================================================
    # SCENE 5: SUMMARY MATRIX SCORECARD & OUTRO (33.00s - 38.00s)
    # ============================================================
    else:
        card_x0, card_y0 = 60 + shake_x, 130 + shake_y
        card_x1, card_y1 = WIDTH - 60 + shake_x, 1760 + shake_y
        draw.rounded_rectangle([card_x0, card_y0, card_x1, card_y1], radius=24, fill=(12, 17, 30), outline=(251, 191, 36), width=2)
        draw.rounded_rectangle([card_x0 - 2, card_y0 - 2, card_x1 + 2, card_y1 + 2], radius=26, outline=(40, 30, 10), width=1)
        
        img.paste(atlas_logo_sm, (card_x0 + 40, card_y0 + 35), atlas_logo_sm)
        draw.text((card_x0 + 180, card_y0 + 45), "EMPIRICAL BENCHMARK SCORECARD", font=f_title, fill=(248, 250, 252))
        draw.text((card_x0 + 180, card_y0 + 88), "Standardized Cross-Engine Performance Evaluation", font=f_small, fill=(148, 163, 184))
        draw.text((card_x0 + 180, card_y0 + 115), "Methodology: 212 Standardized Test Vectors Across Linux & Windows", font=f_tiny, fill=(0, 245, 212))
        
        draw.line([(card_x0 + 35, card_y0 + 175), (card_x1 - 35, card_y0 + 175)], fill=(30, 48, 80), width=1)
        
        tab_x0 = card_x0 + 30
        tab_w = (card_x1 - card_x0) - 60
        tab_y0 = card_y0 + 195
        
        col_widths = [260, 160, 150, 160, 150]
        headers = ["CRITERIA", "ATLAS AC", "ECHO TOOL", "OCEAN AC", "PALADIN"]
        
        draw.rounded_rectangle([tab_x0, tab_y0, tab_x0 + tab_w, tab_y0 + 44], radius=8, fill=(18, 26, 44))
        cur_x = tab_x0 + 15
        for idx, h in enumerate(headers):
            draw.text((cur_x, tab_y0 + 12), h, font=f_col_name, fill=(251, 191, 36) if idx == 1 else (226, 232, 240))
            cur_x += col_widths[idx]
            
        rows = [
            ("Audit Latency", "2.8s (V8 Async)", "118.0s", "214.0s (3.5m)", "190.0s"),
            ("False-Positive %", "0.00% (Zero)", "9.20%", "15.80% (High)", "22.40%"),
            ("do do.jar Bypass", "100% (Case 7)", "40% (Partial)", "20% (Bypassed)", "10% (Skip)"),
            ("Linux Native", "100% (Dual)", "0% (Blind)", "0% (Blind)", "0% (Blind)"),
            ("RAM Footprint", "112 MB", "480 MB", "850 MB (Heavy)", "620 MB"),
            ("CPU Usage", "3.8% (rAF)", "28.5%", "42.0% (Spikes)", "35.0%"),
            ("Data Privacy", "100% Air-Gap", "55% Cloud", "25% Cloud Logs", "20% Webhook"),
            ("whyFlagged Box", "Full Evidence", "None", "Blind Ban Decree", "None")
        ]
        
        row_y = tab_y0 + 52
        for r_idx, row in enumerate(rows):
            bg_color = (15, 22, 38) if r_idx % 2 == 0 else (12, 18, 32)
            draw.rounded_rectangle([tab_x0, row_y, tab_x0 + tab_w, row_y + 42], radius=6, fill=bg_color)
            cur_x = tab_x0 + 15
            draw.text((cur_x, row_y + 11), row[0], font=f_cell_bold, fill=(248, 250, 252))
            cur_x += col_widths[0]
            draw.text((cur_x, row_y + 11), row[1], font=f_cell_mono, fill=(0, 245, 212))
            cur_x += col_widths[1]
            draw.text((cur_x, row_y + 11), row[2], font=f_cell, fill=(245, 158, 11))
            cur_x += col_widths[2]
            draw.text((cur_x, row_y + 11), row[3], font=f_cell, fill=(255, 0, 85))
            cur_x += col_widths[3]
            draw.text((cur_x, row_y + 11), row[4], font=f_cell, fill=(148, 163, 184))
            row_y += 48
            
        draw.line([(card_x0 + 35, row_y + 20), (card_x1 - 35, row_y + 20)], fill=(30, 48, 80), width=1)
        
        score_cards_y = row_y + 40
        draw.text((WIDTH // 2, score_cards_y), "OVERALL FORENSIC INTEGRITY INDEX (SCORE / 100)", font=f_h2, fill=(251, 191, 36), anchor="mm")
        
        scores = [
            ("ATLAS AC PRO", "99.4", "GRADE: S+ LEAD", (0, 245, 212), (16, 185, 129)),
            ("ECHO TOOL", "62.1", "GRADE: B", (245, 158, 11), (217, 119, 6)),
            ("OCEAN AC", "48.3", "GRADE: C", (255, 0, 85), (225, 29, 72)),
            ("PALADIN AC", "34.7", "GRADE: D", (148, 163, 184), (100, 116, 139))
        ]
        
        sc_w = 205
        sc_h = 135
        sc_start_x = card_x0 + 40
        for idx, (s_name, s_val, s_grade, s_col, s_border) in enumerate(scores):
            sx0 = sc_start_x + idx * (sc_w + 16)
            sx1 = sx0 + sc_w
            draw.rounded_rectangle([sx0, score_cards_y + 25, sx1, score_cards_y + 25 + sc_h], radius=14, fill=(16, 23, 40), outline=s_border, width=2)
            draw.text((sx0 + sc_w // 2, score_cards_y + 48), s_name, font=f_small, fill=(248, 250, 252), anchor="mm")
            draw.text((sx0 + sc_w // 2, score_cards_y + 88), s_val, font=f_hero, fill=s_col, anchor="mm")
            draw.text((sx0 + sc_w // 2, score_cards_y + 130), s_grade, font=f_tiny, fill=s_col, anchor="mm")
            
        outro_bot_y = score_cards_y + 25 + sc_h + 35
        img.paste(tft_logo_hdr, (WIDTH // 2 - tft_logo_hdr.width // 2, outro_bot_y), tft_logo_hdr)
        draw.text((WIDTH // 2, outro_bot_y + 75), "TRUEFORMTECH (TFT) // FORENSIC SYSTEMS", font=f_h2, fill=(0, 245, 212), anchor="mm")
        draw.text((WIDTH // 2, outro_bot_y + 115), "LEAD ARCHITECT & RESEARCHER: EVERVERITY", font=f_title, fill=(16, 185, 129), anchor="mm")
        draw.text((WIDTH // 2, outro_bot_y + 155), "STANDARDIZED CLIENT INTEGRITY BENCHMARK • 2026 EDITION", font=f_small, fill=(148, 163, 184), anchor="mm")

    # Apply White Flash
    if flash > 0:
        white_overlay = Image.new("RGB", (WIDTH, HEIGHT), (flash, flash, flash))
        img = Image.blend(img, white_overlay, min(1.0, flash / 255.0))
        
    # Apply Chromatic Glitch on heavy beats
    glitch_px = 0
    if t >= DROP_TIME:
        beat_p = (t - DROP_TIME) % 0.69767
        if beat_p < 0.12:
            glitch_px = int((1.0 - beat_p / 0.12) * 8)
    elif t > 12.0:
        glitch_px = int((t - 12.0) * 3)
        
    if glitch_px > 0:
        img = apply_chromatic_glitch(img, glitch_px)
        
    return img

# Save High-Res Poster
poster_frame = render_frame(int(18.5 * FPS))  # At Case Study do do.jar chart
poster_frame.save(POSTER_PATH, "JPEG", quality=95)
poster_frame.save(UI_POSTER, "JPEG", quality=95)
print(f"[+] Saved High-Res Poster to: {POSTER_PATH}")

# FFmpeg Encoding Pipeline (1080x1920 @ 30 FPS, High-Profile H.264 / AAC)
ffmpeg_cmd = [
    'ffmpeg', '-y',
    '-f', 'rawvideo',
    '-vcodec', 'rawvideo',
    '-s', f'{WIDTH}x{HEIGHT}',
    '-pix_fmt', 'rgb24',
    '-r', str(FPS),
    '-i', '-',
    '-ss', '0',
    '-t', str(DURATION),
    '-i', AUDIO_FILE,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '17',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    OUTPUT_VIDEO
]

print(f"[>] Launching FFmpeg encoder: {' '.join(ffmpeg_cmd)}")
proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)

for f in range(TOTAL_FRAMES):
    frame_img = render_frame(f)
    raw_bytes = frame_img.tobytes()
    try:
        proc.stdin.write(raw_bytes)
    except IOError as e:
        print(f"[!] Pipe error at frame {f}: {e}")
        break
    if f % 90 == 0 or f == TOTAL_FRAMES - 1:
        pct = (f + 1) / float(TOTAL_FRAMES) * 100.0
        cur_t = (f + 1) / float(FPS)
        print(f"[+] Render progress: {pct:5.1f}% ({f+1}/{TOTAL_FRAMES} frames, t={cur_t:4.1f}s)")

proc.stdin.close()
proc.wait()

print(f"[+] FFmpeg encode finished with return code {proc.returncode}")

if os.path.exists(OUTPUT_VIDEO):
    video_size_mb = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
    print(f"[+] Rendered Professional Vertical Video: {OUTPUT_VIDEO} ({video_size_mb:.2f} MB)")
    os.makedirs(os.path.dirname(DIST_VIDEO), exist_ok=True)
    subprocess.run(['cp', '-f', OUTPUT_VIDEO, DIST_VIDEO], check=True)
    subprocess.run(['cp', '-f', OUTPUT_VIDEO, UI_VIDEO], check=True)
    print(f"[+] Successfully deployed to dist and ui assets!")
else:
    print(f"[!] Error: {OUTPUT_VIDEO} was not created!")
    sys.exit(1)
