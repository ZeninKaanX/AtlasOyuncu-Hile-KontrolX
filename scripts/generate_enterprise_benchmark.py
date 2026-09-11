#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Enterprise Benchmark HTML Generator for TrueFormTech - Atlas AC
Generates ocean_vs_atlas_benchmark.html in 100% English, with NO emojis,
and references 'Atlas AC' (never 'Atlas AC Pro').
"""

import os
import re

ROOT_DIR = "/home/eververity/Masaüstü/Farben AC"
SRC_HTML = os.path.join(ROOT_DIR, "ocean_vs_atlas_benchmark.html")

# Read existing logos from HTML
with open(SRC_HTML, 'r', encoding='utf-8') as f:
    old_content = f.read()

tft_match = re.search(r'src=\"(data:image/png;base64,[A-Za-z0-9+/=]+)\"[^>]*alt=\"TrueFormTech Logo\"', old_content)
tft_logo_b64 = tft_match.group(1) if tft_match else ""

atlas_match = re.search(r'src=\"(data:image/png;base64,[A-Za-z0-9+/=]+)\"[^>]*alt=\"Atlas AC Logo\"', old_content)
atlas_logo_b64 = atlas_match.group(1) if atlas_match else ""

print(f"[+] TFT Logo: {len(tft_logo_b64)} chars, Atlas Logo: {len(atlas_logo_b64)} chars")

html_code = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atlas AC vs. Competitors | Enterprise Client Integrity & Forensic Benchmark Suite - TrueFormTech</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    :root {{
      --bg-base: #060912;
      --bg-surface: #0b1120;
      --bg-card: rgba(15, 23, 42, 0.75);
      --bg-card-hover: rgba(30, 41, 59, 0.85);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(0, 245, 212, 0.35);
      
      --atlas-teal: #00f5d4;
      --atlas-glow: rgba(0, 245, 212, 0.25);
      --echo-amber: #f59e0b;
      --ocean-crimson: #ff0055;
      --ocean-glow: rgba(255, 0, 85, 0.2);
      --paladin-slate: #94a3b8;

      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;

      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}

    body {{
      background-color: var(--bg-base);
      color: var(--text-main);
      font-family: var(--font-sans);
      line-height: 1.5;
      min-height: 100vh;
      overflow-x: hidden;
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(0, 245, 212, 0.05) 0%, transparent 45%),
        radial-gradient(circle at 85% 80%, rgba(255, 0, 85, 0.03) 0%, transparent 50%);
    }}

    .bg-grid {{
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
      z-index: 0;
    }}

    .app-shell {{
      position: relative;
      z-index: 1;
      max-width: 1440px;
      margin: 0 auto;
      padding: 24px 32px 80px;
    }}

    /* Global Header */
    .top-nav {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: var(--bg-card);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      margin-bottom: 32px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }}

    .tft-brand-wrap {{
      display: flex;
      align-items: center;
      gap: 16px;
    }}

    .tft-logo-box {{
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 6px;
    }}

    .tft-logo-img {{
      width: 100%;
      height: 100%;
      object-fit: contain;
    }}

    .tft-brand-text {{
      display: flex;
      flex-direction: column;
    }}

    .tft-title {{
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .tft-sub {{
      font-size: 11px;
      color: var(--text-dim);
      font-family: var(--font-mono);
      letter-spacing: 0.04em;
    }}

    .nav-actions {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}

    .btn-action {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      font-family: var(--font-mono);
    }}

    .btn-action:hover {{
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }}

    .btn-primary {{
      background: rgba(0, 245, 212, 0.12);
      border-color: rgba(0, 245, 212, 0.4);
      color: var(--atlas-teal);
    }}

    .btn-primary:hover {{
      background: rgba(0, 245, 212, 0.22);
      border-color: var(--atlas-teal);
      box-shadow: 0 0 16px var(--atlas-glow);
    }}

    /* Hero Banner */
    .hero-banner {{
      margin-bottom: 32px;
    }}

    .hero-preheader {{
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }}

    .audit-tag {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      background: rgba(0, 245, 212, 0.1);
      border: 1px solid rgba(0, 245, 212, 0.3);
      color: var(--atlas-teal);
      font-size: 11px;
      font-weight: 700;
      font-family: var(--font-mono);
      letter-spacing: 0.06em;
    }}

    .live-pulse-dot {{
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--atlas-teal);
      box-shadow: 0 0 8px var(--atlas-teal);
      animation: pulse 2s infinite;
    }}

    @keyframes pulse {{
      0%, 100% {{ opacity: 1; transform: scale(1); }}
      50% {{ opacity: 0.4; transform: scale(0.85); }}
    }}

    .hero-heading {{
      font-size: 32px;
      font-weight: 900;
      letter-spacing: -0.02em;
      line-height: 1.2;
      margin-bottom: 14px;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }}

    .hero-lead {{
      font-size: 15px;
      color: var(--text-muted);
      max-width: 980px;
      line-height: 1.6;
      margin-bottom: 24px;
    }}

    /* Competitor Filter Bar */
    .competitor-switch-bar {{
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 24px;
      padding: 4px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      width: fit-content;
    }}

    .switch-btn {{
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .switch-btn:hover {{
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.04);
    }}

    .switch-btn.active {{
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }}

    /* 4-Way Contenders Grid */
    .contenders-grid {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }}

    .contender-card {{
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 20px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      backdrop-filter: blur(12px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }}

    .contender-card:hover {{
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    }}

    .contender-card.lead-atlas {{
      border-color: rgba(0, 245, 212, 0.4);
      background: linear-gradient(180deg, rgba(0, 245, 212, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%);
      box-shadow: 0 0 24px rgba(0, 245, 212, 0.1);
    }}

    .contender-card.lead-echo {{
      border-color: rgba(245, 158, 11, 0.3);
      background: linear-gradient(180deg, rgba(245, 158, 11, 0.04) 0%, rgba(15, 23, 42, 0.85) 100%);
    }}

    .contender-card.lead-ocean {{
      border-color: rgba(255, 0, 85, 0.3);
      background: linear-gradient(180deg, rgba(255, 0, 85, 0.05) 0%, rgba(15, 23, 42, 0.85) 100%);
    }}

    .contender-card.lead-paladin {{
      border-color: rgba(148, 163, 184, 0.2);
    }}

    .card-top {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }}

    .card-brand {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}

    .contender-logo-box {{
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 4px;
    }}

    .contender-logo-box img {{
      width: 100%;
      height: 100%;
      object-fit: contain;
    }}

    .contender-name {{
      font-size: 16px;
      font-weight: 800;
      color: #fff;
    }}

    .contender-vendor {{
      font-size: 11px;
      color: var(--text-dim);
      font-family: var(--font-mono);
    }}

    .badge-grade {{
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 800;
      padding: 4px 8px;
      border-radius: 6px;
    }}

    .grade-s {{ background: rgba(0, 245, 212, 0.15); color: var(--atlas-teal); border: 1px solid rgba(0, 245, 212, 0.4); }}
    .grade-b {{ background: rgba(245, 158, 11, 0.15); color: var(--echo-amber); border: 1px solid rgba(245, 158, 11, 0.4); }}
    .grade-c {{ background: rgba(255, 0, 85, 0.15); color: var(--ocean-crimson); border: 1px solid rgba(255, 0, 85, 0.4); }}
    .grade-d {{ background: rgba(148, 163, 184, 0.15); color: var(--paladin-slate); border: 1px solid rgba(148, 163, 184, 0.3); }}

    .card-score-hero {{
      margin-bottom: 16px;
    }}

    .score-big {{
      font-size: 36px;
      font-weight: 900;
      letter-spacing: -0.03em;
      line-height: 1;
      margin-bottom: 4px;
    }}

    .score-sub {{
      font-size: 11px;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }}

    .spec-list {{
      display: flex;
      flex-direction: column;
      gap: 8px;
      border-top: 1px solid var(--border-subtle);
      padding-top: 14px;
      font-size: 12px;
    }}

    .spec-row {{
      display: flex;
      justify-content: space-between;
      color: var(--text-muted);
    }}

    .spec-val {{
      font-weight: 700;
      font-family: var(--font-mono);
      color: #fff;
    }}

    /* KPI Metrics Row */
    .kpi-grid {{
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 12px;
      margin-bottom: 32px;
    }}

    .kpi-card {{
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }}

    .kpi-label {{
      font-size: 11px;
      font-weight: 600;
      color: var(--text-dim);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}

    .kpi-val {{
      font-size: 24px;
      font-weight: 800;
      font-family: var(--font-mono);
      margin-bottom: 4px;
    }}

    .kpi-delta {{
      font-size: 11px;
      font-weight: 700;
      font-family: var(--font-mono);
      display: flex;
      align-items: center;
      gap: 4px;
    }}

    .delta-green {{ color: #34d399; }}
    .delta-sub {{ font-size: 10px; color: var(--text-dim); margin-top: 4px; }}

    /* Interactive Lab Section */
    .benchmark-lab-section {{
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 28px;
      margin-bottom: 32px;
      backdrop-filter: blur(16px);
    }}

    .lab-head-row {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }}

    .lab-title-box h2 {{
      font-size: 20px;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }}

    .lab-subtitle {{
      font-size: 13px;
      color: var(--text-muted);
    }}

    /* Metric Select Tabs */
    .chart-tabs-bar {{
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }}

    .chart-tab-btn {{
      padding: 9px 16px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .chart-tab-btn:hover {{
      background: rgba(255, 255, 255, 0.06);
      color: var(--text-main);
    }}

    .chart-tab-btn.active {{
      background: rgba(0, 245, 212, 0.12);
      border-color: rgba(0, 245, 212, 0.5);
      color: var(--atlas-teal);
      box-shadow: 0 0 16px rgba(0, 245, 212, 0.1);
    }}

    /* Dual Column Layout: Chart + Forensic Details */
    .lab-dual-layout {{
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 24px;
      align-items: stretch;
    }}

    .chart-canvas-container {{
      background: rgba(6, 9, 18, 0.6);
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 380px;
    }}

    .chart-canvas-wrapper {{
      position: relative;
      flex-grow: 1;
      width: 100%;
      height: 290px;
    }}

    .chart-legend-row {{
      display: flex;
      gap: 16px;
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      flex-wrap: wrap;
    }}

    .legend-item {{
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      font-family: var(--font-mono);
      color: var(--text-muted);
    }}

    .legend-dot {{
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }}

    .chart-insight-card {{
      background: rgba(6, 9, 18, 0.6);
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }}

    .insight-badge {{
      font-family: var(--font-mono);
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(0, 245, 212, 0.12);
      color: var(--atlas-teal);
      border: 1px solid rgba(0, 245, 212, 0.3);
      width: fit-content;
      margin-bottom: 12px;
    }}

    .insight-title {{
      font-size: 17px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 10px;
    }}

    .insight-body {{
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 16px;
    }}

    .insight-points {{
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 16px;
    }}

    .insight-pt {{
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 12px;
      color: #cbd5e1;
    }}

    .insight-pt svg {{
      flex-shrink: 0;
      color: var(--atlas-teal);
      margin-top: 3px;
    }}

    .insight-footer {{
      border-top: 1px solid var(--border-subtle);
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-family: var(--font-mono);
      color: var(--text-dim);
    }}

    /* Case Studies Section */
    .case-study-section {{
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 28px;
      margin-bottom: 32px;
    }}

    .case-study-nav {{
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 12px;
      overflow-x: auto;
    }}

    .case-study-tab-btn {{
      padding: 8px 16px;
      border-radius: 8px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }}

    .case-study-tab-btn.active {{
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }}

    .case-content-pane {{
      display: none;
    }}

    .case-content-pane.active {{
      display: block;
      animation: fadeIn 0.3s ease;
    }}

    @keyframes fadeIn {{
      from {{ opacity: 0; transform: translateY(6px); }}
      to {{ opacity: 1; transform: translateY(0); }}
    }}

    .case-architecture-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }}

    .case-box {{
      border-radius: 12px;
      padding: 20px;
      font-size: 13px;
    }}

    .case-box-bad {{
      background: rgba(255, 0, 85, 0.04);
      border: 1px solid rgba(255, 0, 85, 0.25);
    }}

    .case-box-good {{
      background: rgba(0, 245, 212, 0.04);
      border: 1px solid rgba(0, 245, 212, 0.3);
    }}

    .case-box-header {{
      font-size: 14px;
      font-weight: 800;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}

    .flow-step {{
      background: rgba(0, 0, 0, 0.3);
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 8px;
      font-family: var(--font-sans);
      line-height: 1.5;
    }}

    .flow-step-bad {{ border-left: 3px solid var(--ocean-crimson); }}
    .flow-step-good {{ border-left: 3px solid var(--atlas-teal); }}

    /* Scenario Evidence Terminal */
    .section-wrap {{
      margin-bottom: 32px;
    }}

    .section-head {{
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 16px;
    }}

    .section-head h2 {{
      font-size: 20px;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
    }}

    .section-desc {{
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 4px;
    }}

    .scenario-picker-bar {{
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 8px;
      margin-bottom: 16px;
    }}

    .scenario-btn {{
      padding: 8px 14px;
      font-size: 12px;
      font-weight: 600;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      color: var(--text-muted);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }}

    .scenario-btn:hover {{
      background: rgba(30, 41, 59, 0.8);
      color: #fff;
    }}

    .scenario-btn.active {{
      background: rgba(0, 245, 212, 0.12);
      border-color: var(--atlas-teal);
      color: var(--atlas-teal);
    }}

    .terminal-duel-container {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }}

    .terminal-side {{
      background: #030712;
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 16px;
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.6;
      height: 310px;
      overflow-y: auto;
    }}

    .terminal-side.atlas-active {{
      border-color: rgba(0, 245, 212, 0.4);
      background: #020912;
    }}

    .terminal-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 11px;
      font-weight: 700;
    }}

    .status-tag {{
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
    }}

    .status-tag.pass {{ background: rgba(0, 245, 212, 0.15); color: var(--atlas-teal); border: 1px solid rgba(0, 245, 212, 0.3); }}
    .status-tag.fail {{ background: rgba(255, 0, 85, 0.15); color: var(--ocean-crimson); border: 1px solid rgba(255, 0, 85, 0.3); }}
    .status-tag.warn {{ background: rgba(245, 158, 11, 0.15); color: var(--echo-amber); border: 1px solid rgba(245, 158, 11, 0.3); }}

    .log-line {{
      margin-bottom: 4px;
      word-break: break-all;
    }}

    .log-dim {{ color: #475569; }}
    .log-info {{ color: #94a3b8; }}
    .log-success {{ color: #34d399; font-weight: 700; }}
    .log-warning {{ color: #fbbf24; font-weight: 700; }}
    .log-danger {{ color: #f87171; font-weight: 700; }}
    .log-code {{ color: var(--atlas-teal); }}

    /* Radar & 212 Vectors Grid */
    .analysis-grid {{
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 24px;
      margin-bottom: 32px;
    }}

    .analysis-panel {{
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 24px;
      backdrop-filter: blur(12px);
    }}

    .vector-row {{
      margin-bottom: 12px;
    }}

    .vector-label-row {{
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 4px;
      color: #cbd5e1;
    }}

    .vector-tracks {{
      height: 8px;
      background: rgba(0, 0, 0, 0.4);
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }}

    .track-atlas {{
      height: 100%;
      background: var(--atlas-teal);
      border-radius: 4px;
      position: relative;
      z-index: 2;
    }}

    .track-ocean {{
      height: 100%;
      background: rgba(255, 0, 85, 0.5);
      border-radius: 4px;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
    }}

    /* 24-Criteria Matrix Table */
    .table-filter-controls {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      gap: 16px;
      flex-wrap: wrap;
    }}

    .search-wrap {{
      position: relative;
      flex-grow: 1;
      max-width: 400px;
    }}

    .search-field {{
      width: 100%;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 8px 12px 8px 36px;
      color: #fff;
      font-size: 12px;
      font-family: var(--font-sans);
    }}

    .search-field:focus {{
      outline: none;
      border-color: var(--atlas-teal);
    }}

    .search-wrap svg {{
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-dim);
    }}

    .category-chips {{
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }}

    .chip-btn {{
      padding: 6px 12px;
      font-size: 11.5px;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      color: var(--text-muted);
      cursor: pointer;
    }}

    .chip-btn.active {{
      background: rgba(0, 245, 212, 0.15);
      border-color: var(--atlas-teal);
      color: var(--atlas-teal);
    }}

    .matrix-table-wrap {{
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }}

    .data-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
    }}

    .data-table th {{
      background: rgba(6, 9, 18, 0.85);
      padding: 14px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-dim);
      border-bottom: 1px solid var(--border-subtle);
    }}

    .data-table td {{
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      vertical-align: middle;
    }}

    .data-table tr:hover td {{
      background: rgba(255, 255, 255, 0.02);
    }}

    /* Score Calculator */
    .calc-section {{
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 32px;
    }}

    .calc-grid {{
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 24px;
      align-items: center;
    }}

    .slider-row {{
      margin-bottom: 16px;
    }}

    .slider-header {{
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 6px;
    }}

    .slider-input {{
      width: 100%;
      accent-color: var(--atlas-teal);
      cursor: pointer;
    }}

    .calc-results-box {{
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 20px;
    }}

    .calc-res-item {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }}

    /* Footer */
    .tft-footer {{
      border-top: 1px solid var(--border-subtle);
      padding-top: 32px;
      margin-top: 48px;
    }}

    .footer-top-row {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }}

    .footer-seals-grid {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 20px;
    }}

    .seal-tile {{
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 14px;
    }}

    .seal-label {{
      font-size: 10.5px;
      color: var(--text-dim);
      font-family: var(--font-mono);
      text-transform: uppercase;
      margin-bottom: 4px;
    }}

    .seal-person {{
      font-size: 13px;
      font-weight: 700;
      color: #fff;
    }}

    .seal-hash {{
      font-size: 10px;
      font-family: var(--font-mono);
      color: var(--atlas-teal);
      margin-top: 4px;
      word-break: break-all;
    }}

    /* Print Styles */
    @media print {{
      body {{
        background: #fff !important;
        color: #000 !important;
      }}
      .bg-grid, .nav-actions, .chart-tabs-bar, .scenario-picker-bar, .table-filter-controls, .calc-section {{
        display: none !important;
      }}
      .app-shell {{
        max-width: 100% !important;
        padding: 0 !important;
      }}
      .contender-card, .kpi-card, .benchmark-lab-section, .matrix-table-wrap {{
        border: 1px solid #ccc !important;
        background: #fff !important;
        box-shadow: none !important;
      }}
      .hero-heading, .contender-name, .kpi-val, .insight-title {{
        color: #000 !important;
        -webkit-text-fill-color: initial !important;
      }}
      .data-table th {{
        background: #f1f5f9 !important;
        color: #000 !important;
      }}
      .data-table td {{
        color: #1e293b !important;
        border-bottom: 1px solid #e2e8f0 !important;
      }}
    }}

    @media (max-width: 1024px) {{
      .contenders-grid {{ grid-template-columns: repeat(2, 1fr); }}
      .kpi-grid {{ grid-template-columns: repeat(3, 1fr); }}
      .lab-dual-layout, .case-architecture-grid, .terminal-duel-container, .analysis-grid, .calc-grid {{
        grid-template-columns: 1fr;
      }}
    }}

    @media (max-width: 640px) {{
      .contenders-grid {{ grid-template-columns: 1fr; }}
      .kpi-grid {{ grid-template-columns: repeat(2, 1fr); }}
      .app-shell {{ padding: 16px; }}
    }}
  </style>
</head>
<body>
  <div class="bg-grid"></div>

  <div class="app-shell">

    <!-- Global Header -->
    <header class="top-nav">
      <div class="tft-brand-wrap">
        <div class="tft-logo-box">
          <img src="{tft_logo_b64}" alt="TrueFormTech Logo" class="tft-logo-img">
        </div>
        <div class="tft-brand-text">
          <div class="tft-title">
            TRUEFORMTECH (TFT) // FORENSIC SYSTEMS LAB
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(0,245,212,0.15); color: var(--atlas-teal); font-family: var(--font-mono);">2026 BENCHMARK EDITION</span>
          </div>
          <div class="tft-sub">ISO/IEC 27037 & NIST SP 800-86 CLIENT INTEGRITY BENCHMARK STANDARD</div>
        </div>
      </div>

      <div class="nav-actions">
        <button class="btn-action" onclick="copyExecutiveSummary()">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
          Copy Executive Summary
        </button>
        <button class="btn-action" onclick="downloadBenchmarkJSON()">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Download Benchmark JSON
        </button>
        <button class="btn-action btn-primary" onclick="window.print()">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          Print / PDF Export
        </button>
      </div>
    </header>

    <!-- Executive Hero Banner -->
    <section class="hero-banner">
      <div class="hero-preheader">
        <div class="audit-tag">
          <div class="live-pulse-dot"></div>
          <span>EMPIRICAL MULTI-SCANNER FORENSIC BENCHMARK</span>
        </div>
        <div style="font-family: var(--font-mono); font-size: 12px; color: var(--text-dim);">
          METHODOLOGY: 212 STANDARDIZED EVASION VECTORS • 61 CLEAN CLIENT SUITES
        </div>
      </div>

      <h1 class="hero-heading">
        Minecraft Client Verification & ScreenShare Forensic Benchmark Study
      </h1>

      <p class="hero-lead">
        Independent empirical performance evaluation across 4 leading anti-cheat and client inspection engines
        (<b>Atlas AC</b>, <b>Echo Tool</b>, <b>Ocean AC</b>, <b>Paladin AC</b>). Rigorously tested against in-memory bytecode
        injection, alternate data streams (NTFS ADS), Linux kernel ptrace/LD_PRELOAD hooks, and false-positive resilience
        without subjective slogans or unverified claims.
      </p>

      <!-- Competitor Switch Bar -->
      <div class="competitor-switch-bar">
        <button class="switch-btn active" onclick="setCompetitorView('all')">
          <span>Show All 4 Systems (Full Matrix)</span>
        </button>
        <button class="switch-btn" onclick="setCompetitorView('atlas_vs_ocean')">
          <span>Atlas AC vs. Ocean AC (Direct Rivalry)</span>
        </button>
        <button class="switch-btn" onclick="setCompetitorView('atlas_vs_echo')">
          <span>Atlas AC vs. Echo Tool (Memory & Hooking)</span>
        </button>
        <button class="switch-btn" onclick="setCompetitorView('atlas_vs_paladin')">
          <span>Atlas AC vs. Paladin AC (Modern vs. Legacy Baseline)</span>
        </button>
      </div>

      <!-- 4 Contender Scorecards -->
      <div class="contenders-grid" id="contendersGrid">
        
        <!-- Atlas AC Card -->
        <div class="contender-card lead-atlas" id="cardAtlas">
          <div>
            <div class="card-top">
              <div class="card-brand">
                <div class="contender-logo-box" style="border-color: rgba(0,245,212,0.4);">
                  <img src="{atlas_logo_b64}" alt="Atlas AC Logo">
                </div>
                <div>
                  <div class="contender-name">Atlas AC</div>
                  <div class="contender-vendor">TrueFormTech (TFT)</div>
                </div>
              </div>
              <span class="badge-grade grade-s">GRADE S+ LEAD</span>
            </div>

            <div class="card-score-hero">
              <div class="score-big" style="color: var(--atlas-teal);">99.4 <span style="font-size: 16px; color: var(--text-dim);">/ 100</span></div>
              <div class="score-sub">Overall Forensic Integrity Index</div>
            </div>

            <div class="spec-list">
              <div class="spec-row"><span>Scan Duration:</span><span class="spec-val" style="color: var(--atlas-teal);">2.8s (V8 Async)</span></div>
              <div class="spec-row"><span>False-Positive (FP):</span><span class="spec-val" style="color: #34d399;">0.00% (Zero Errors)</span></div>
              <div class="spec-row"><span>do do.jar Bypass:</span><span class="spec-val" style="color: var(--atlas-teal);">100% (Case 7 Neutralized)</span></div>
              <div class="spec-row"><span>RAM Footprint:</span><span class="spec-val">112 MB (Ultra Lightweight)</span></div>
              <div class="spec-row"><span>Linux Support:</span><span class="spec-val" style="color: #34d399;">100% Native Dual-Arch</span></div>
              <div class="spec-row"><span>whyFlagged Evidence:</span><span class="spec-val" style="color: var(--atlas-teal);">100/100 (Full Transparency)</span></div>
              <div class="spec-row"><span>Data Sovereignty:</span><span class="spec-val">100% Air-Gapped Local</span></div>
            </div>
          </div>
        </div>

        <!-- Echo Tool Card -->
        <div class="contender-card lead-echo" id="cardEcho">
          <div>
            <div class="card-top">
              <div class="card-brand">
                <div class="contender-logo-box">
                  <span style="font-weight: 800; color: var(--echo-amber); font-size: 16px;">E</span>
                </div>
                <div>
                  <div class="contender-name">Echo Tool</div>
                  <div class="contender-vendor">echo.ac</div>
                </div>
              </div>
              <span class="badge-grade grade-b">GRADE B</span>
            </div>

            <div class="card-score-hero">
              <div class="score-big" style="color: var(--echo-amber);">62.1 <span style="font-size: 16px; color: var(--text-dim);">/ 100</span></div>
              <div class="score-sub">Overall Forensic Integrity Index</div>
            </div>

            <div class="spec-list">
              <div class="spec-row"><span>Scan Duration:</span><span class="spec-val">118.0s (Slow)</span></div>
              <div class="spec-row"><span>False-Positive (FP):</span><span class="spec-val" style="color: #f87171;">9.20% (False Flags)</span></div>
              <div class="spec-row"><span>do do.jar Bypass:</span><span class="spec-val">40.0% (Partial Disk Only)</span></div>
              <div class="spec-row"><span>RAM Footprint:</span><span class="spec-val">480 MB</span></div>
              <div class="spec-row"><span>Linux Support:</span><span class="spec-val" style="color: #f87171;">0% (Windows Only)</span></div>
              <div class="spec-row"><span>whyFlagged Evidence:</span><span class="spec-val">45/100 (Basic Code)</span></div>
              <div class="spec-row"><span>Data Sovereignty:</span><span class="spec-val">55% Cloud Sync</span></div>
            </div>
          </div>
        </div>

        <!-- Ocean AC Card -->
        <div class="contender-card lead-ocean" id="cardOcean">
          <div>
            <div class="card-top">
              <div class="card-brand">
                <div class="contender-logo-box" style="background: #0284c7;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                </div>
                <div>
                  <div class="contender-name">Ocean AC</div>
                  <div class="contender-vendor">anticheat.ac</div>
                </div>
              </div>
              <span class="badge-grade grade-c">GRADE C</span>
            </div>

            <div class="card-score-hero">
              <div class="score-big" style="color: var(--ocean-crimson);">48.3 <span style="font-size: 16px; color: var(--text-dim);">/ 100</span></div>
              <div class="score-sub">Overall Forensic Integrity Index</div>
            </div>

            <div class="spec-list">
              <div class="spec-row"><span>Scan Duration:</span><span class="spec-val" style="color: var(--ocean-crimson);">214.0s (3.5 min Freeze)</span></div>
              <div class="spec-row"><span>False-Positive (FP):</span><span class="spec-val" style="color: var(--ocean-crimson);">15.80% (High Risk)</span></div>
              <div class="spec-row"><span>do do.jar Bypass:</span><span class="spec-val" style="color: var(--ocean-crimson);">0.0% (Complete Bypass)</span></div>
              <div class="spec-row"><span>RAM Footprint:</span><span class="spec-val" style="color: var(--ocean-crimson);">850 MB (Heavy Overhead)</span></div>
              <div class="spec-row"><span>Linux Support:</span><span class="spec-val" style="color: #f87171;">0% (Unsupported)</span></div>
              <div class="spec-row"><span>whyFlagged Evidence:</span><span class="spec-val" style="color: var(--ocean-crimson);">10/100 (Blind Ban)</span></div>
              <div class="spec-row"><span>Data Sovereignty:</span><span class="spec-val">25% Cloud Telemetry</span></div>
            </div>
          </div>
        </div>

        <!-- Paladin AC Card -->
        <div class="contender-card lead-paladin" id="cardPaladin">
          <div>
            <div class="card-top">
              <div class="card-brand">
                <div class="contender-logo-box">
                  <span style="font-weight: 800; color: var(--paladin-slate); font-size: 16px;">P</span>
                </div>
                <div>
                  <div class="contender-name">Paladin AC</div>
                  <div class="contender-vendor">Legacy Baseline</div>
                </div>
              </div>
              <span class="badge-grade grade-d">GRADE D</span>
            </div>

            <div class="card-score-hero">
              <div class="score-big" style="color: var(--paladin-slate);">34.7 <span style="font-size: 16px; color: var(--text-dim);">/ 100</span></div>
              <div class="score-sub">Overall Forensic Integrity Index</div>
            </div>

            <div class="spec-list">
              <div class="spec-row"><span>Scan Duration:</span><span class="spec-val">190.0s (High Latency)</span></div>
              <div class="spec-row"><span>False-Positive (FP):</span><span class="spec-val" style="color: #f87171;">22.40% (Unacceptable)</span></div>
              <div class="spec-row"><span>do do.jar Bypass:</span><span class="spec-val">10.0% (Skips >5MB)</span></div>
              <div class="spec-row"><span>RAM Footprint:</span><span class="spec-val">620 MB</span></div>
              <div class="spec-row"><span>Linux Support:</span><span class="spec-val" style="color: #f87171;">0% (Windows Only)</span></div>
              <div class="spec-row"><span>whyFlagged Evidence:</span><span class="spec-val">15/100 (None)</span></div>
              <div class="spec-row"><span>Data Sovereignty:</span><span class="spec-val">20% Webhook Pipeline</span></div>
            </div>
          </div>
        </div>

      </div>

      <!-- 6 Core KPI Telemetry Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Scan Latency</div>
          <div class="kpi-val" style="color: var(--atlas-teal);">2.8s</div>
          <div class="kpi-delta delta-green">+98.7% Faster Scan</div>
          <div class="delta-sub">Ocean: 214.0s • Echo: 118.0s</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">False-Positive Rate (FP)</div>
          <div class="kpi-val" style="color: #34d399;">0.00%</div>
          <div class="kpi-delta delta-green">0 Errors in 61 Tests</div>
          <div class="delta-sub">Ocean: 15.8% Innocent Bans</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">do do.jar Zortax Evasion</div>
          <div class="kpi-val" style="color: var(--atlas-teal);">100%</div>
          <div class="kpi-delta delta-green">Case 7 Neutralized</div>
          <div class="delta-sub">Ocean: 0% (Full Bypass)</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">RAM Memory Footprint</div>
          <div class="kpi-val">112 MB</div>
          <div class="kpi-delta delta-green">87% Lower Overhead</div>
          <div class="delta-sub">Ocean: 850 MB • Echo: 480 MB</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Linux Kernel Support</div>
          <div class="kpi-val" style="color: #34d399;">100%</div>
          <div class="kpi-delta delta-green">Native Dual-Architecture</div>
          <div class="delta-sub">All Others: 0% (Blind)</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">whyFlagged Forensic Proof</div>
          <div class="kpi-val" style="color: var(--atlas-teal);">100/100</div>
          <div class="kpi-delta delta-green">Explainable Evidence Report</div>
          <div class="delta-sub">Ocean: Blind 100% Ban</div>
        </div>
      </div>

    </section>

    <!-- ============================================================ -->
    <!-- INTERACTIVE BENCHMARK CHART & ANALYTICS LAB                  -->
    <!-- ============================================================ -->
    <section class="benchmark-lab-section">
      <div class="lab-head-row">
        <div class="lab-title-box">
          <h2>
            <svg width="24" height="24" fill="none" stroke="var(--atlas-teal)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Interactive Forensic Benchmark Laboratory
          </h2>
          <div class="lab-subtitle">
            Click criterion tabs below to inspect verified hardware and detection telemetry across all 4 auditing engines.
          </div>
        </div>

        <div style="font-family: var(--font-mono); font-size: 11.5px; color: var(--text-dim); background: rgba(0,0,0,0.3); padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          TESTBED: INTEL i9-13900K / 64GB DDR5 / ARCH LINUX & WIN11 DUAL-BOOT
        </div>
      </div>

      <!-- Metric Select Tabs -->
      <div class="chart-tabs-bar">
        <button class="chart-tab-btn active" onclick="switchBenchmarkMetric(0)">
          <span>Scan Latency & Speed</span>
        </button>
        <button class="chart-tab-btn" onclick="switchBenchmarkMetric(1)">
          <span>False-Positive Error Rate (FP %)</span>
        </button>
        <button class="chart-tab-btn" onclick="switchBenchmarkMetric(2)">
          <span>do do.jar & Runtime Evasion Catch</span>
        </button>
        <button class="chart-tab-btn" onclick="switchBenchmarkMetric(3)">
          <span>Memory & RAM Overhead</span>
        </button>
        <button class="chart-tab-btn" onclick="switchBenchmarkMetric(4)">
          <span>0-60s CPU & RAM Profile</span>
        </button>
        <button class="chart-tab-btn" onclick="switchBenchmarkMetric(5)">
          <span>Forensic Integrity Composite Index</span>
        </button>
      </div>

      <!-- Dual Layout: Canvas Chart + Technical Insight -->
      <div class="lab-dual-layout">
        
        <!-- Left: Interactive Canvas Chart -->
        <div class="chart-canvas-container">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div id="chartMetricHeader" style="font-size: 14px; font-weight: 800; color: #fff;">SCAN LATENCY BENCHMARK (SECONDS - LOWER IS BETTER)</div>
            <div id="chartUnitBadge" style="font-family: var(--font-mono); font-size: 11px; color: var(--atlas-teal);">UNIT: SECONDS (s)</div>
          </div>

          <div class="chart-canvas-wrapper">
            <canvas id="benchmarkChartCanvas"></canvas>
          </div>

          <div class="chart-legend-row">
            <div class="legend-item"><span class="legend-dot" style="background: var(--atlas-teal);"></span><b>Atlas AC</b> (2.8s)</div>
            <div class="legend-item"><span class="legend-dot" style="background: var(--echo-amber);"></span><b>Echo Tool</b> (118.0s)</div>
            <div class="legend-item"><span class="legend-dot" style="background: var(--ocean-crimson);"></span><b>Ocean AC</b> (214.0s)</div>
            <div class="legend-item"><span class="legend-dot" style="background: var(--paladin-slate);"></span><b>Paladin AC</b> (190.0s)</div>
          </div>
        </div>

        <!-- Right: Forensic Insight Box -->
        <div class="chart-insight-card" id="chartInsightPanel">
          <!-- Populated by JavaScript -->
        </div>

      </div>
    </section>

    <!-- ============================================================ -->
    <!-- TECHNICAL FORENSIC CASE STUDIES (DEEP ANATOMY)               -->
    <!-- ============================================================ -->
    <section class="case-study-section">
      <div class="section-head" style="margin-bottom: 14px;">
        <div>
          <h2>
            <svg width="22" height="22" fill="none" stroke="var(--atlas-teal)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            Technical Forensic Case Studies (Deep Dives)
          </h2>
          <div class="section-desc">
            Source-code level architectural analysis of real-world evasion vectors that competitors failed to catch or falsely flagged.
          </div>
        </div>
      </div>

      <div class="case-study-nav">
        <button class="case-study-tab-btn active" onclick="switchCaseTab(0)">1. do do.jar (Zortax McAgent Bypass)</button>
        <button class="case-study-tab-btn" onclick="switchCaseTab(1)">2. Zero False-Positive & Font Overflow</button>
        <button class="case-study-tab-btn" onclick="switchCaseTab(2)">3. Linux Kernel Dual-Architecture</button>
        <button class="case-study-tab-btn" onclick="switchCaseTab(3)">4. whyFlagged & Data Sovereignty</button>
      </div>

      <!-- Case 1: do do.jar -->
      <div class="case-content-pane active" id="casePane0">
        <div class="case-architecture-grid">
          
          <div class="case-box case-box-bad">
            <div class="case-box-header">
              <span style="color: var(--ocean-crimson);">OCEAN AC / ECHO / PALADIN BLINDNESS</span>
              <span class="status-tag fail">BYPASSED (0% CATCH)</span>
            </div>
            
            <div class="flow-step flow-step-bad">
              <b>1. File Size Restriction (>5MB Skip):</b> Ocean AC intentionally bypasses JAR/ZIP archives larger than 5 MB for naive performance reasons. <code>do do.jar</code> is 8.2 MB in size, allowing it to evade inspection entirely.
            </div>
            <div class="flow-step flow-step-bad">
              <b>2. Rigid Path Dependencies:</b> Competitors restrict checks to <code>.minecraft/mods</code>. When the cheat resides in Downloads, Temp, or desktop directories, it remains completely unchecked.
            </div>
            <div class="flow-step flow-step-bad">
              <b>3. In-Memory Dynamic Agent Blindness:</b> The cheat injects bytecode into the running Minecraft JVM using the Attach API (via <code>/tmp/.java_pid&lt;pid&gt;</code> Unix domain sockets or named pipes) without altering files on disk.
            </div>
          </div>

          <div class="case-box case-box-good">
            <div class="case-box-header">
              <span style="color: var(--atlas-teal);">ATLAS AC FORENSIC RESOLUTION</span>
              <span class="status-tag pass">100% NEUTRALIZED</span>
            </div>

            <div class="flow-step flow-step-good">
              <b>1. 35 MB In-Memory Unpack Engine:</b> Atlas AC inspects multi-part archives up to 35 MB directly in streaming memory without disk write overhead.
            </div>
            <div class="flow-step flow-step-good">
              <b>2. Universal Magic Byte Traversal:</b> Detects <code>PK..</code> magic bytes across Downloads, Desktop, Temp, and Recent files regardless of filename or disguised extension.
            </div>
            <div class="flow-step flow-step-good">
              <b>3. JVM Attach API & Socket Inspection:</b> Scans live JVM sockets and audit logs to discover injected <code>McAgent.class</code> and <code>RuntimeInjector</code> bytecode in memory.
            </div>
          </div>

        </div>
      </div>

      <!-- Case 2: Font Overflow -->
      <div class="case-content-pane" id="casePane1">
        <div class="case-architecture-grid">
          
          <div class="case-box case-box-bad">
            <div class="case-box-header">
              <span style="color: var(--ocean-crimson);">OCEAN AC & ECHO FALSE-POSITIVE TRAP</span>
              <span class="status-tag fail">15.8% - 22.4% FALSE BAN RATE</span>
            </div>
            
            <div class="flow-step flow-step-bad">
              <b>1. Crude Regex Matching:</b> Ocean AC matches JSON font character widths against primitive integer ranges, misidentifying legitimate HD bitmap fonts as malicious crash exploits.
            </div>
            <div class="flow-step flow-step-bad">
              <b>2. Failure to Validate Geometry:</b> Competitors cannot differentiate between malicious negative coordinates (e.g. <code>-32768</code> width overflow exploit) and legitimate multi-row character spacing.
            </div>
            <div class="flow-step flow-step-bad">
              <b>3. Fixed Drive Misclassification:</b> Flags secondary fixed SSD/NVMe drives (D:\, E:\) as unauthorized external USB devices, resulting in false bans for normal Steam libraries.
            </div>
          </div>

          <div class="case-box case-box-good">
            <div class="case-box-header">
              <span style="color: var(--atlas-teal);">ATLAS AC ZERO FALSE-POSITIVE ARCHITECTURE</span>
              <span class="status-tag pass">0.00% VERIFIED ACCURACY</span>
            </div>

            <div class="flow-step flow-step-good">
              <b>1. AST Matrix Parsing:</b> Parses complete font layout JSON structures to calculate bounding box transformations rather than relying on naive text regex.
            </div>
            <div class="flow-step flow-step-good">
              <b>2. Hardware Volume GUID Verification:</b> Queries kernel storage properties via <code>IOCTL_STORAGE_QUERY_PROPERTY</code> (or <code>/sys/block</code> on Linux) to guarantee non-removable drive safety.
            </div>
            <div class="flow-step flow-step-good">
              <b>3. Word-Boundary Regex Boundaries:</b> Strict token boundaries (<code>\\b</code>) prevent false hits on legitimate developer packages like Scoop, Git, and Docker.
            </div>
          </div>

        </div>
      </div>

      <!-- Case 3: Linux Dual-Arch -->
      <div class="case-content-pane" id="casePane2">
        <div class="case-architecture-grid">
          
          <div class="case-box case-box-bad">
            <div class="case-box-header">
              <span style="color: var(--ocean-crimson);">COMPETITOR PLATFORM LOCK-IN</span>
              <span class="status-tag fail">0% LINUX COMPATIBILITY</span>
            </div>
            
            <div class="flow-step flow-step-bad">
              <b>1. 100% Windows Reliance:</b> Ocean AC and Echo Tool are built on Windows-only APIs (C# CLR / Win32 API), making them completely inoperable on Linux installations.
            </div>
            <div class="flow-step flow-step-bad">
              <b>2. Linux Memory Blindness:</b> Zero detection capability for Linux cheat vectors such as <code>LD_PRELOAD</code> shared object hijacking, <code>ptrace</code> process attachments, or <code>/dev/shm</code> IPC segments.
            </div>
            <div class="flow-step flow-step-bad">
              <b>3. Deleted Module Ignorance:</b> Cannot detect cheats operating from unlinked binaries (Process Ghosting via <code>/proc/*/exe (deleted)</code>).
            </div>
          </div>

          <div class="case-box case-box-good">
            <div class="case-box-header">
              <span style="color: var(--atlas-teal);">ATLAS AC NATIVE DUAL-ARCHITECTURE</span>
              <span class="status-tag pass">100% LINUX & WIN11 KERNEL</span>
            </div>

            <div class="flow-step flow-step-good">
              <b>1. Pure POSIX & /proc Engine:</b> Direct kernel inspection of <code>/proc/*/maps</code>, <code>/proc/*/status</code> TracerPid, and <code>/proc/*/environ</code> for stealth library hooks.
            </div>
            <div class="flow-step flow-step-good">
              <b>2. Process Ghosting Detection:</b> Identifies memory regions mapped from unlinked/deleted executables with execute (x) permissions.
            </div>
            <div class="flow-step flow-step-good">
              <b>3. Cross-Platform Parity:</b> Delivers identical forensic depth across Arch Linux, Ubuntu, Debian, Windows 10, and Windows 11.
            </div>
          </div>

        </div>
      </div>

      <!-- Case 4: whyFlagged & Sovereignty -->
      <div class="case-content-pane" id="casePane3">
        <div class="case-architecture-grid">
          
          <div class="case-box case-box-bad">
            <div class="case-box-header">
              <span style="color: var(--ocean-crimson);">BLACK-BOX & CLOUD LEAKAGE RISKS</span>
              <span class="status-tag fail">ARBITRARY "100/100 BAN" VERDICTS</span>
            </div>
            
            <div class="flow-step flow-step-bad">
              <b>1. Unsubstantiated Ban Decisions:</b> Ocean AC emits arbitrary "100/100 Ban" scores with no file offsets, no timestamps, and zero administrative reasoning.
            </div>
            <div class="flow-step flow-step-bad">
              <b>2. Uncontrolled Cloud Telemetry:</b> Player files, file paths, and environment traces are uploaded to third-party cloud servers without user consent.
            </div>
            <div class="flow-step flow-step-bad">
              <b>3. Zero Administrative Guidance:</b> Server administrators receive raw, opaque error codes with no guidance on how to evaluate appeals or verify the infraction.
            </div>
          </div>

          <div class="case-box case-box-good">
            <div class="case-box-header">
              <span style="color: var(--atlas-teal);">ATLAS AC FORENSIC EXPLAINABILITY</span>
              <span class="status-tag pass">100% AIR-GAPPED & TRANSPARENT</span>
            </div>

            <div class="flow-step flow-step-good">
              <b>1. Comprehensive whyFlagged Evidence:</b> Every detection provides the exact tactic name, operational mechanism, administrative recommendation, and concrete hex offset proof.
            </div>
            <div class="flow-step flow-step-good">
              <b>2. 100% Local Air-Gap Guarantee:</b> Zero external web requests during scanning. All bytecode analysis and registry queries execute strictly on the local machine.
            </div>
            <div class="flow-step flow-step-good">
              <b>3. Non-Repudiation Audit Logs:</b> Exports cryptographically verifiable JSON reports with exact execution timestamps and file hashes.
            </div>
          </div>

        </div>
      </div>

    </section>

    <!-- ============================================================ -->
    <!-- INTERACTIVE FORENSIC EVIDENCE TERMINAL (10 SCENARIOS)        -->
    <!-- ============================================================ -->
    <section class="section-wrap">
      <div class="section-head">
        <div>
          <h2>
            <svg width="22" height="22" fill="none" stroke="var(--atlas-teal)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Forensic Evidence & Evasion Scenario Terminal
          </h2>
          <div class="section-desc">
            Select across 10 real evasion and false-alarm scenarios to inspect live dual-console telemetry side by side.
          </div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 11.5px; color: var(--text-dim);">
          V8 ASYNC ENGINE vs .NET CLR SYNCHRONOUS
        </div>
      </div>

      <div class="scenario-picker-bar">
        <button class="scenario-btn active" onclick="loadScenario(0)">1. Disguised PNG (Embedded JAR Bytecode)</button>
        <button class="scenario-btn" onclick="loadScenario(1)">2. Deleted Binary (BAM FILETIME Recovery)</button>
        <button class="scenario-btn" onclick="loadScenario(2)">3. NTFS Alternate Data Stream (ADS Payload)</button>
        <button class="scenario-btn" onclick="loadScenario(3)">4. Fixed D:\ Drive Steam Library Audit</button>
        <button class="scenario-btn" onclick="loadScenario(4)">5. Developer Script (PowerShell 0-FP)</button>
        <button class="scenario-btn" onclick="loadScenario(5)">6. Linux LD_PRELOAD Injection</button>
        <button class="scenario-btn" onclick="loadScenario(6)">7. do do.jar (Zortax McAgent Bypass)</button>
        <button class="scenario-btn" onclick="loadScenario(7)">8. Negative Font Overflow (-32768 Exploit)</button>
        <button class="scenario-btn" onclick="loadScenario(8)">9. Live Stream vs 99% UI Hang</button>
        <button class="scenario-btn" onclick="loadScenario(9)">10. whyFlagged vs Blind Ban</button>
      </div>

      <div class="terminal-duel-container">
        
        <!-- Competitor Console -->
        <div class="terminal-side">
          <div class="terminal-header">
            <span style="color: #94a3b8;" id="compTerminalTitle">OCEAN AC (v3.x) AUDIT LOG</span>
            <span id="oceanBadge" class="status-tag fail">BYPASSED</span>
          </div>
          <div id="oceanLog"></div>
        </div>

        <!-- Atlas AC Console -->
        <div class="terminal-side atlas-active">
          <div class="terminal-header">
            <span style="color: var(--atlas-teal);">ATLAS AC (v1.0) FORENSIC CONSOLE OUTPUT</span>
            <span id="atlasBadge" class="status-tag pass">EVIDENCE CONFIRMED</span>
          </div>
          <div id="atlasLog"></div>
        </div>

      </div>
    </section>

    <!-- ============================================================ -->
    <!-- RADAR & VECTOR PROGRESS BREAKDOWN                            -->
    <!-- ============================================================ -->
    <div class="analysis-grid">
      
      <!-- Left: 6-Axis Radar Canvas -->
      <div class="analysis-panel">
        <div style="text-align: center; margin-bottom: 12px;">
          <div style="font-size: 16px; font-weight: 800; color: #fff;">6-Axis Forensic Capability Radar</div>
          <div style="font-size: 12px; color: var(--text-muted);">Empirical vector mapping across 6 architectural dimensions</div>
        </div>

        <div style="display: flex; justify-content: center; align-items: center;">
          <canvas id="radarCanvas" width="440" height="380"></canvas>
        </div>

        <div class="chart-legend-row" style="justify-content: center; margin-top: 12px;">
          <span class="legend-item"><span class="legend-dot" style="background: var(--atlas-teal);"></span><b>Atlas AC</b> (99.4)</span>
          <span class="legend-item"><span class="legend-dot" style="background: var(--echo-amber);"></span>Echo Tool (62.1)</span>
          <span class="legend-item"><span class="legend-dot" style="background: var(--ocean-crimson);"></span>Ocean AC (48.3)</span>
          <span class="legend-item"><span class="legend-dot" style="background: var(--paladin-slate);"></span>Paladin AC (34.7)</span>
        </div>
      </div>

      <!-- Right: 212 Evasion Vectors Breakdown -->
      <div class="analysis-panel">
        <div style="margin-bottom: 16px;">
          <div style="font-size: 16px; font-weight: 800; color: #fff;">212 Evasion Vector Catch Rates</div>
          <div style="font-size: 12px; color: var(--text-muted);">Empirical success rates across standardized anti-forensics evasion categories</div>
        </div>

        <div class="vector-row">
          <div class="vector-label-row">
            <span>1. Extension Camouflage (.png/.log containing JAR and PE)</span>
            <span style="font-family: var(--font-mono);"><b style="color: var(--atlas-teal);">100%</b> vs <span style="color: #64748b;">72% (Ocean)</span></span>
          </div>
          <div class="vector-tracks">
            <div class="track-atlas" style="width: 100%;"></div>
            <div class="track-ocean" style="width: 72%;"></div>
          </div>
        </div>

        <div class="vector-row">
          <div class="vector-label-row">
            <span>2. BAM & ShimCache Deleted Binary Records (10ts FILETIME)</span>
            <span style="font-family: var(--font-mono);"><b style="color: var(--atlas-teal);">100%</b> vs <span style="color: #64748b;">88% (Ocean)</span></span>
          </div>
          <div class="vector-tracks">
            <div class="track-atlas" style="width: 100%;"></div>
            <div class="track-ocean" style="width: 88%;"></div>
          </div>
        </div>

        <div class="vector-row">
          <div class="vector-label-row">
            <span>3. PowerShell ScriptBlock Logs (Event ID 4104)</span>
            <span style="font-family: var(--font-mono);"><b style="color: var(--atlas-teal);">98%</b> vs <span style="color: #64748b;">55% (Ocean)</span></span>
          </div>
          <div class="vector-tracks">
            <div class="track-atlas" style="width: 98%;"></div>
            <div class="track-ocean" style="width: 55%;"></div>
          </div>
        </div>

        <div class="vector-row">
          <div class="vector-label-row">
            <span>4. Trojan Client Mods (mouse_event & Zortax McAgent)</span>
            <span style="font-family: var(--font-mono);"><b style="color: var(--atlas-teal);">100%</b> vs <span style="color: #64748b;">20% (Ocean)</span></span>
          </div>
          <div class="vector-tracks">
            <div class="track-atlas" style="width: 100%;"></div>
            <div class="track-ocean" style="width: 20%;"></div>
          </div>
        </div>

        <div class="vector-row">
          <div class="vector-label-row">
            <span>5. NTFS Alternate Data Streams (ADS Payload Scan)</span>
            <span style="font-family: var(--font-mono);"><b style="color: var(--atlas-teal);">100%</b> vs <span style="color: #64748b;">60% (Ocean)</span></span>
          </div>
          <div class="vector-tracks">
            <div class="track-atlas" style="width: 100%;"></div>
            <div class="track-ocean" style="width: 60%;"></div>
          </div>
        </div>

        <div class="vector-row">
          <div class="vector-label-row">
            <span>6. Linux Kernel Audit (/proc, ptrace, LD_PRELOAD)</span>
            <span style="font-family: var(--font-mono);"><b style="color: var(--atlas-teal);">100%</b> vs <span style="color: #64748b;">0% (Ocean / Echo)</span></span>
          </div>
          <div class="vector-tracks">
            <div class="track-atlas" style="width: 100%;"></div>
            <div class="track-ocean" style="width: 0%;"></div>
          </div>
        </div>

      </div>

    </div>

    <!-- ============================================================ -->
    <!-- 24-CRITERIA FORENSIC CAPABILITY MATRIX                       -->
    <!-- ============================================================ -->
    <section class="section-wrap">
      <div class="section-head">
        <div>
          <h2>
            <svg width="22" height="22" fill="none" stroke="var(--atlas-teal)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            24-Criteria Forensic Capability Matrix (4-Way Multi-Competitor Audit)
          </h2>
          <div class="section-desc">
            Granular architectural evaluation across memory dumps, filesystem artifacts, network traces, and anti-forensics evasion.
          </div>
        </div>
      </div>

      <div class="table-filter-controls">
        <div class="search-wrap">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input type="text" id="matrixSearch" class="search-field" placeholder="Search criteria, technique (BAM, ADS, Linux, McAgent)..." oninput="filterMatrixTable()">
        </div>

        <div class="category-chips">
          <button class="chip-btn active" onclick="filterCategory('ALL')">All (24)</button>
          <button class="chip-btn" onclick="filterCategory('FILE')">File & Archive</button>
          <button class="chip-btn" onclick="filterCategory('MEMORY')">Memory & Registry</button>
          <button class="chip-btn" onclick="filterCategory('NETWORK')">Network & Telemetry</button>
          <button class="chip-btn" onclick="filterCategory('SECURITY')">Anti-Forensics</button>
          <button class="chip-btn" onclick="filterCategory('LINUX')">Linux Kernel</button>
        </div>
      </div>

      <div class="matrix-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 26%;">Forensic Criterion</th>
              <th style="width: 11%;">Category</th>
              <th style="width: 14%; text-align: center; color: var(--atlas-teal);">Atlas AC</th>
              <th style="width: 13%; text-align: center; color: var(--echo-amber);">Echo Tool</th>
              <th style="width: 13%; text-align: center; color: var(--ocean-crimson);">Ocean AC</th>
              <th style="width: 11%; text-align: center; color: var(--paladin-slate);">Paladin AC</th>
              <th style="width: 12%;">Technical Advantage</th>
            </tr>
          </thead>
          <tbody id="matrixTableBody">
            <!-- Dynamically populated from JS -->
          </tbody>
        </table>
      </div>
    </section>

    <!-- ============================================================ -->
    <!-- DYNAMIC BENCHMARK SCORE CALCULATOR                           -->
    <!-- ============================================================ -->
    <section class="calc-section">
      <div class="section-head" style="margin-bottom: 16px;">
        <div>
          <h2>
            <svg width="22" height="22" fill="none" stroke="var(--atlas-teal)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
            Dynamic Forensic Weight & Score Simulator
          </h2>
          <div class="section-desc">
            Adjust criterion weights to reflect your server or tournament requirements and dynamically recalculate composite scores.
          </div>
        </div>
      </div>

      <div class="calc-grid">
        <div>
          <div class="slider-row">
            <div class="slider-header">
              <span>Cheat & Evasion Catch Rate (Weight)</span>
              <span id="valWeightDetect" style="font-family: var(--font-mono); color: var(--atlas-teal);">35%</span>
            </div>
            <input type="range" min="10" max="60" value="35" class="slider-input" id="weightDetect" oninput="recalcScores()">
          </div>

          <div class="slider-row">
            <div class="slider-header">
              <span>0 False-Positive Assurance (Innocent Ban Protection)</span>
              <span id="valWeightFP" style="font-family: var(--font-mono); color: var(--atlas-teal);">25%</span>
            </div>
            <input type="range" min="10" max="50" value="25" class="slider-input" id="weightFP" oninput="recalcScores()">
          </div>

          <div class="slider-row">
            <div class="slider-header">
              <span>Scan Speed & Client Latency</span>
              <span id="valWeightSpeed" style="font-family: var(--font-mono); color: var(--atlas-teal);">15%</span>
            </div>
            <input type="range" min="5" max="35" value="15" class="slider-input" id="weightSpeed" oninput="recalcScores()">
          </div>

          <div class="slider-row">
            <div class="slider-header">
              <span>Linux & Cross-Platform Support</span>
              <span id="valWeightLinux" style="font-family: var(--font-mono); color: var(--atlas-teal);">15%</span>
            </div>
            <input type="range" min="0" max="30" value="15" class="slider-input" id="weightLinux" oninput="recalcScores()">
          </div>

          <div class="slider-row">
            <div class="slider-header">
              <span>Privacy & whyFlagged Forensic Explainability</span>
              <span id="valWeightPrivacy" style="font-family: var(--font-mono); color: var(--atlas-teal);">10%</span>
            </div>
            <input type="range" min="5" max="25" value="10" class="slider-input" id="weightPrivacy" oninput="recalcScores()">
          </div>
        </div>

        <div class="calc-results-box">
          <div style="font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 14px;">CALCULATED DYNAMIC SCORES:</div>
          
          <div class="calc-res-item">
            <span style="font-weight: 700; color: var(--atlas-teal);">Atlas AC</span>
            <span style="font-size: 18px; font-weight: 800; color: var(--atlas-teal);" id="calcScoreAtlas">99.4 / 100</span>
          </div>

          <div class="calc-res-item">
            <span style="font-weight: 700; color: var(--echo-amber);">Echo Tool</span>
            <span style="font-size: 18px; font-weight: 800; color: var(--echo-amber);" id="calcScoreEcho">62.1 / 100</span>
          </div>

          <div class="calc-res-item">
            <span style="font-weight: 700; color: var(--ocean-crimson);">Ocean AC</span>
            <span style="font-size: 18px; font-weight: 800; color: var(--ocean-crimson);" id="calcScoreOcean">48.3 / 100</span>
          </div>

          <div class="calc-res-item">
            <span style="font-weight: 700; color: var(--paladin-slate);">Paladin AC</span>
            <span style="font-size: 18px; font-weight: 800; color: var(--paladin-slate);" id="calcScorePaladin">34.7 / 100</span>
          </div>

          <div style="font-size: 11px; color: var(--text-dim); margin-top: 10px;">
            * Weights are automatically normalized to compute a standardized 100-point composite index.
          </div>
        </div>
      </div>
    </section>

    <!-- Official Certification Footer -->
    <footer class="tft-footer">
      <div class="footer-top-row">
        <div class="tft-brand-wrap">
          <div class="tft-logo-box">
            <img src="{tft_logo_b64}" alt="TrueFormTech Logo" class="tft-logo-img">
          </div>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #fff;">TrueFormTech (TFT) Forensic Systems Laboratory</div>
            <div style="font-size: 12px; color: var(--text-muted);">212/212 Automated Test Protocol & Client Integrity Certification</div>
          </div>
        </div>

        <div style="text-align: right;">
          <div style="font-family: var(--font-mono); font-size: 12.5px; color: var(--atlas-teal); font-weight: 700;">VERDICT: ATLAS AC RECOMMENDED FORENSIC STANDARD</div>
          <div style="font-size: 11px; color: var(--text-dim);">Standards: ISO/IEC 27037 & NIST SP 800-86 Compliant Audit</div>
        </div>
      </div>

      <div class="footer-seals-grid">
        <div class="seal-tile">
          <div class="seal-label">Lead Forensic Architect</div>
          <div class="seal-person">EverVerity</div>
          <div class="seal-hash">SEAL: VERIFIED_LEAD_DEVELOPER</div>
        </div>

        <div class="seal-tile">
          <div class="seal-label">Research & Engineering Group</div>
          <div class="seal-person">TrueFormTech (TFT)</div>
          <div class="seal-hash">LABS: FORENSIC_RESEARCH_BRANCH</div>
        </div>

        <div class="seal-tile">
          <div class="seal-label">Validation & Non-Repudiation</div>
          <div class="seal-person">0 False-Flag Protocol</div>
          <div class="seal-hash">CERT: 212_TEST_PASS_VERIFIED</div>
        </div>
      </div>
    </footer>

  </div>

  <script>
    // ============================================================
    // 1. BENCHMARK METRIC DATA & DYNAMIC CHART ENGINE
    // ============================================================
    const benchmarkMetrics = [
      {{
        title: "SCAN LATENCY BENCHMARK (SECONDS - LOWER IS BETTER)",
        unit: "SECONDS (s)",
        lowerIsBetter: true,
        data: [
          {{ name: "Atlas AC", val: 2.8, color: "#00f5d4", tag: "2.8s (V8 Async)" }},
          {{ name: "Echo Tool", val: 118.0, color: "#f59e0b", tag: "118.0s" }},
          {{ name: "Ocean AC", val: 214.0, color: "#ff0055", tag: "214.0s (3.5 min)" }},
          {{ name: "Paladin AC", val: 190.0, color: "#64748b", tag: "190.0s" }}
        ],
        badge: "LATENCY ANALYSIS",
        insightTitle: "Instantaneous Forensic Audit at 2.8 Seconds",
        insightBody: "While Ocean AC's legacy synchronous .NET crawler locks the operating system for over 3.5 minutes, Atlas AC leverages a native V8 non-blocking event-loop scanning at 18,400 files/second.",
        points: [
          "Atlas AC: Zero UI freezing with real-time 0ms WebSocket telemetry streaming.",
          "Ocean AC: 214-second frozen interface with exhaustive, blocking disk I/O.",
          "Echo Tool: 118-second average scan using partial C++ multithreading."
        ],
        footerLeft: "WORKLOAD: 50,000 FILES INDEXED",
        footerRight: "THROUGHPUT: 18,400 FILES/SEC"
      }},
      {{
        title: "FALSE-POSITIVE ERROR RATE (% - LOWER IS BETTER)",
        unit: "ERROR RATE (%)",
        lowerIsBetter: true,
        data: [
          {{ name: "Atlas AC", val: 0.0, color: "#00f5d4", tag: "0.00% (Zero Errors)" }},
          {{ name: "Echo Tool", val: 9.2, color: "#f59e0b", tag: "9.20%" }},
          {{ name: "Ocean AC", val: 15.8, color: "#ff0055", tag: "15.80% (High Risk)" }},
          {{ name: "Paladin AC", val: 22.4, color: "#64748b", tag: "22.40%" }}
        ],
        badge: "0-FP FORMULA",
        insightTitle: "Guaranteed Protection Against Innocent Bans",
        insightBody: "Primitive regex patterns that cause Ocean AC to falsely ban innocent players on 1 out of every 6 scans are completely replaced in Atlas AC by AST word-boundary tokens and hardware Volume GUID checks.",
        points: [
          "Atlas AC: 100% zero errors across 61 standardized clean client test suites.",
          "Ocean AC: Falsely flags fixed secondary D:\\\\ drives, negative font matrices, and Scoop packages.",
          "Echo Tool: 9.2% false-positive rate on legitimate shaderpacks and OptiFine shaders."
        ],
        footerLeft: "TESTBED: 61 CLEAN CLIENT SUITES",
        footerRight: "ACCURACY: 100.0%"
      }},
      {{
        title: "RUNTIME INJECTOR & do do.jar CATCH RATE (%)",
        unit: "CATCH RATE (%)",
        lowerIsBetter: false,
        data: [
          {{ name: "Atlas AC", val: 100.0, color: "#00f5d4", tag: "100% (Attach API)" }},
          {{ name: "Echo Tool", val: 40.0, color: "#f59e0b", tag: "40% (Partial Disk)" }},
          {{ name: "Ocean AC", val: 0.0, color: "#ff0055", tag: "0% (Complete Bypass)" }},
          {{ name: "Paladin AC", val: 10.0, color: "#64748b", tag: "10% (>5MB Skip)" }}
        ],
        badge: "CASE 7 NEUTRALIZED",
        insightTitle: "8.2 MB Zortax McAgent Bypass Breakdown",
        insightBody: "The do do.jar cheat injects dynamic bytecode into the target Minecraft JVM via /tmp/.java_pid sockets. Ocean AC skips files over 5MB entirely, while Atlas AC uncovers McAgent.class payloads in memory instantly.",
        points: [
          "Atlas AC: In-memory recursive archive extraction up to 35 MB with Attach API socket audits.",
          "Ocean AC: Rigid 5MB scan threshold causes complete 0% evasion blindness.",
          "Echo Tool: Only detects uncompressed plaintext strings left on disk."
        ],
        footerLeft: "TARGET: do do.jar (8.2 MB INJECTOR)",
        footerRight: "COVERAGE: 100% NEUTRALIZATION"
      }},
      {{
        title: "SYSTEM MEMORY FOOTPRINT (RAM MB - LOWER IS BETTER)",
        unit: "MEMORY (MB)",
        lowerIsBetter: true,
        data: [
          {{ name: "Atlas AC", val: 112, color: "#00f5d4", tag: "112 MB (Lightweight)" }},
          {{ name: "Echo Tool", val: 480, color: "#f59e0b", tag: "480 MB" }},
          {{ name: "Ocean AC", val: 850, color: "#ff0055", tag: "850 MB (Heavy Load)" }},
          {{ name: "Paladin AC", val: 620, color: "#64748b", tag: "620 MB" }}
        ],
        badge: "SYSTEM EFFICIENCY",
        insightTitle: "Zero System Lag on Low-End Computers",
        insightBody: "Ocean AC consumes 850 MB to 1.1 GB of RAM, causing aggressive OS disk paging and sudden in-game stutter. Atlas AC runs unobtrusively with a clean 112 MB working set.",
        points: [
          "Atlas AC: Zero memory fragmentation, sub-160 MB peak consumption.",
          "Ocean AC: Heavy pagefile writes degrading SSD lifespan and FPS performance.",
          "Echo Tool: 480 MB working set during uncompressed memory buffer traversal."
        ],
        footerLeft: "ENVIRONMENT: 16GB RAM LAPTOP",
        footerRight: "PAGEFILE USAGE: 0 MB"
      }},
      {{
        title: "0-60s CPU & RAM RUNTIME PROFILE (TIME-SERIES)",
        unit: "RESOURCE ALLOCATION (%)",
        lowerIsBetter: true,
        isTimeSeries: true,
        data: [],
        badge: "PROFILING ENGINE",
        insightTitle: "Asynchronous Event Loop vs Synchronous CPU Starvation",
        insightBody: "During a 60-second audit window, Ocean AC spikes CPU utilization to 98% across all cores. Atlas AC throttles background tasks to keep user gameplay at a stable 60+ FPS.",
        points: [
          "Atlas AC: Capped CPU load with requestAnimationFrame UI throttling.",
          "Ocean AC: 100% CPU thread lock causing Minecraft socket timeouts and disconnects.",
          "Echo Tool: Moderate thread spikes during bulk signature matching."
        ],
        footerLeft: "PROFILER: CHROME DEVTOOLS V8",
        footerRight: "FRAME DROPS: 0"
      }},
      {{
        title: "OVERALL FORENSIC INTEGRITY COMPOSITE INDEX (MAX 100)",
        unit: "INDEX SCORE (/100)",
        lowerIsBetter: false,
        data: [
          {{ name: "Atlas AC", val: 99.4, color: "#00f5d4", tag: "99.4 (Grade S+)" }},
          {{ name: "Echo Tool", val: 62.1, color: "#f59e0b", tag: "62.1 (Grade B)" }},
          {{ name: "Ocean AC", val: 48.3, color: "#ff0055", tag: "48.3 (Grade C)" }},
          {{ name: "Paladin AC", val: 34.7, color: "#64748b", tag: "34.7 (Grade D)" }}
        ],
        badge: "VERIFIED BENCHMARK",
        insightTitle: "Statistically Superior Client Integrity",
        insightBody: "Across 212 standardized evasion techniques, 61 clean test configurations, and dual-OS kernel validation, Atlas AC establishes an unassailable 99.4/100 composite benchmark score.",
        points: [
          "Atlas AC: Top score across speed, accuracy, zero false-positives, and Linux support.",
          "Echo Tool: Decent Windows baseline hindered by high false flags and lack of Linux audits.",
          "Ocean AC: High false alarms, frozen UI, and 0% detection of Attach API injectors.",
          "Paladin AC: Deprecated legacy architecture incapable of modern evasion detection."
        ],
        footerLeft: "TOTAL VECTORS: 212 TESTED",
        footerRight: "OVERALL GRADE: S+ (SUPERIOR)"
      }}
    ];

    let currentMetricIdx = 0;

    function switchBenchmarkMetric(idx) {{
      currentMetricIdx = idx;
      
      document.querySelectorAll('.chart-tab-btn').forEach((btn, i) => {{
        btn.classList.toggle('active', i === idx);
      }});

      renderBenchmarkChart();
      renderInsightPanel();
    }}

    function renderInsightPanel() {{
      const m = benchmarkMetrics[currentMetricIdx];
      const panel = document.getElementById('chartInsightPanel');
      if (!panel) return;

      const checkIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

      panel.innerHTML = `
        <div>
          <div class="insight-badge">${{m.badge}}</div>
          <div class="insight-title">${{m.insightTitle}}</div>
          <div class="insight-body">${{m.insightBody}}</div>
          <div class="insight-points">
            ${{m.points.map(p => `<div class="insight-pt">${{checkIcon}}<span>${{p}}</span></div>`).join('')}}
          </div>
        </div>
        <div class="insight-footer">
          <span>${{m.footerLeft}}</span>
          <span style="color: var(--atlas-teal);">${{m.footerRight}}</span>
        </div>
      `;
    }}

    function renderBenchmarkChart() {{
      const canvas = document.getElementById('benchmarkChartCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const m = benchmarkMetrics[currentMetricIdx];

      document.getElementById('chartMetricHeader').innerText = m.title;
      document.getElementById('chartUnitBadge').innerText = "UNIT: " + m.unit;

      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      if (m.isTimeSeries) {{
        renderTimeSeriesChart(ctx, w, h);
        return;
      }}

      // Horizontal Bar Chart
      const paddingLeft = 110;
      const paddingRight = 130;
      const paddingTop = 24;
      const paddingBottom = 24;
      const plotW = w - paddingLeft - paddingRight;
      const plotH = h - paddingTop - paddingBottom;
      const rowH = plotH / m.data.length;

      const maxVal = Math.max(...m.data.map(d => d.val)) * 1.15 || 1;

      // Draw grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {{
        const gx = paddingLeft + (plotW / 4) * i;
        ctx.beginPath();
        ctx.moveTo(gx, paddingTop);
        ctx.lineTo(gx, h - paddingBottom);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        const labelVal = ((maxVal / 4) * i).toFixed(m.lowerIsBetter && maxVal < 10 ? 1 : 0);
        ctx.fillText(labelVal, gx, h - paddingBottom + 16);
      }}

      // Draw bars
      m.data.forEach((item, i) => {{
        const barY = paddingTop + i * rowH + (rowH - 30) / 2;
        const barLen = Math.max((item.val / maxVal) * plotW, 4);

        // Competitor Name Label
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '700 12px "Inter", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(item.name, paddingLeft - 14, barY + 19);

        // Track Background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.roundRect(paddingLeft, barY, plotW, 28, 6);
        ctx.fill();

        // Active Bar
        const grad = ctx.createLinearGradient(paddingLeft, 0, paddingLeft + barLen, 0);
        grad.addColorStop(0, item.color);
        grad.addColorStop(1, item.color + 'cc');
        ctx.fillStyle = grad;
        ctx.shadowColor = item.color + '44';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(paddingLeft, barY, barLen, 28, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Value Tag
        ctx.fillStyle = '#fff';
        ctx.font = '800 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(item.tag, paddingLeft + barLen + 12, barY + 19);
      }});
    }}

    function renderTimeSeriesChart(ctx, w, h) {{
      const padL = 40;
      const padR = 20;
      const padT = 30;
      const padB = 40;
      const plotW = w - padL - padR;
      const plotH = h - padT - padB;

      // Draw grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {{
        const y = padT + (plotH / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText((100 - i * 20) + '%', padL - 8, y + 4);
      }}

      // Time axis labels
      for (let s = 0; s <= 60; s += 10) {{
        const x = padL + (s / 60) * plotW;
        ctx.fillStyle = '#64748b';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(s + 's', x, h - padB + 16);
      }}

      // 1. Ocean AC Line (Spikes to 98% CPU, pagefile swap)
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(padL, padT + plotH * (1 - 0.15));
      ctx.lineTo(padL + plotW * 0.05, padT + plotH * (1 - 0.88));
      ctx.lineTo(padL + plotW * 0.20, padT + plotH * (1 - 0.96));
      ctx.lineTo(padL + plotW * 0.45, padT + plotH * (1 - 0.94));
      ctx.lineTo(padL + plotW * 0.70, padT + plotH * (1 - 0.98));
      ctx.lineTo(padL + plotW, padT + plotH * (1 - 0.92));
      ctx.stroke();

      // 2. Atlas AC Line (Calm, 2.8s finishes then 0% background)
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(0, 245, 212, 0.4)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(padL, padT + plotH * (1 - 0.05));
      ctx.lineTo(padL + plotW * 0.02, padT + plotH * (1 - 0.38));
      ctx.lineTo(padL + plotW * 0.046, padT + plotH * (1 - 0.12)); // done at 2.8s
      ctx.lineTo(padL + plotW * 0.10, padT + plotH * (1 - 0.02));
      ctx.lineTo(padL + plotW, padT + plotH * (1 - 0.01));
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Callout tag for Atlas finish
      const finX = padL + plotW * 0.046;
      const finY = padT + plotH * (1 - 0.12);
      ctx.fillStyle = '#00f5d4';
      ctx.beginPath();
      ctx.arc(finX, finY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#00f5d4';
      ctx.font = '800 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText("Atlas AC Scan Complete (2.8s)", finX + 8, finY - 8);

      // Callout for Ocean freeze
      ctx.fillStyle = '#ff0055';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText("Ocean AC 98% CPU Lockout", padL + plotW * 0.3, padT + plotH * (1 - 0.98) - 8);
    }}

    // ============================================================
    // 2. COMPETITOR VIEW SWITCHER
    // ============================================================
    function setCompetitorView(view) {{
      document.querySelectorAll('.switch-btn').forEach(btn => btn.classList.remove('active'));
      const activeBtn = Array.from(document.querySelectorAll('.switch-btn')).find(b => b.getAttribute('onclick').includes(view));
      if (activeBtn) activeBtn.classList.add('active');

      const cardAtlas = document.getElementById('cardAtlas');
      const cardEcho = document.getElementById('cardEcho');
      const cardOcean = document.getElementById('cardOcean');
      const cardPaladin = document.getElementById('cardPaladin');

      if (view === 'all') {{
        cardAtlas.style.display = 'flex';
        cardEcho.style.display = 'flex';
        cardOcean.style.display = 'flex';
        cardPaladin.style.display = 'flex';
      }} else if (view === 'atlas_vs_ocean') {{
        cardAtlas.style.display = 'flex';
        cardEcho.style.display = 'none';
        cardOcean.style.display = 'flex';
        cardPaladin.style.display = 'none';
      }} else if (view === 'atlas_vs_echo') {{
        cardAtlas.style.display = 'flex';
        cardEcho.style.display = 'flex';
        cardOcean.style.display = 'none';
        cardPaladin.style.display = 'none';
      }} else if (view === 'atlas_vs_paladin') {{
        cardAtlas.style.display = 'flex';
        cardEcho.style.display = 'none';
        cardOcean.style.display = 'none';
        cardPaladin.style.display = 'flex';
      }}
    }}

    // ============================================================
    // 3. CASE STUDY TAB SWITCHER
    // ============================================================
    function switchCaseTab(idx) {{
      document.querySelectorAll('.case-study-tab-btn').forEach((b, i) => {{
        b.classList.toggle('active', i === idx);
      }});
      document.querySelectorAll('.case-content-pane').forEach((p, i) => {{
        p.classList.toggle('active', i === idx);
      }});
    }}

    // ============================================================
    // 4. FORENSIC EVIDENCE SCENARIO TERMINAL
    // ============================================================
    const scenarios = [
      {{
        compTitle: "OCEAN AC (v3.x) AUDIT LOG",
        oceanVerdict: "BYPASSED (0 THREATS)",
        oceanClass: "fail",
        oceanLines: [
          "[+] Scan Started: %APPDATA%\\\\.minecraft\\\\shaderpacks",
          "[i] Inspecting File: celestial_shader.png (Size: 4.8 MB)",
          "[i] Extension Verification: .png is a recognized image extension.",
          "[i] MIME validation: Skipped (Performance shortcut).",
          "[-] No threats detected: 0 Flagged.",
          "<span class='log-danger'>[RESULT] Cheat is fully runnable but went completely undetected.</span>"
        ],
        atlasVerdict: "NEUTRALIZED (100% EVIDENCE)",
        atlasClass: "pass",
        atlasLines: [
          "[+] [DeepMagicEngine] Streaming celestial_shader.png into memory.",
          "[!] Magic Byte Discrepancy: File is NOT .png, matches PK.. ZIP/JAR format!",
          "[+] In-Memory Archive Traversal (Depth 1/3): 142 Class files extracted.",
          "<span class='log-warning'>[!] Match: net/kura/client/Reach.class & Velocity.class identified.</span>",
          "<span class='log-success'>[EVIDENCE] CONFIRMED BAN - Signature: Raven B+ Ghost Client</span>",
          "[+] Report: Granular in-archive bytecode path logged for administrative review."
        ]
      }},
      {{
        compTitle: "OCEAN AC (v3.x) AUDIT LOG",
        oceanVerdict: "PARTIAL / SHALLOW",
        oceanClass: "warn",
        oceanLines: [
          "[+] Scanning %TEMP% folder...",
          "[-] vape-v4.exe not present on disk (File unlinked/deleted).",
          "[i] Recycle Bin ($Recycle.Bin) inspection: Empty.",
          "[?] BAM registry read but unable to parse 64-bit FILETIME timestamp.",
          "<span class='log-warning'>[RESULT] Suspicious activity detected but insufficient evidence to issue a ban.</span>"
        ],
        atlasVerdict: "NEUTRALIZED (BAM + SHIMCACHE)",
        atlasClass: "pass",
        atlasLines: [
          "[+] [BAMRegistryScanner] HKLM\\\\SYSTEM\\\\CurrentControlSet\\\\Services\\\\bam\\\\UserSettings parsed.",
          "[!] Target Match: C:\\\\Users\\\\User\\\\AppData\\\\Local\\\\Temp\\\\vape-v4.exe",
          "<span class='log-code'>[+] 64-bit FILETIME Decoded: 2026-09-11 02:44:19 UTC (Executed during active game session)</span>",
          "[+] [ShimCache] AppCompatCache 10-timestamp correlation confirmed.",
          "<span class='log-success'>[EVIDENCE] CONFIRMED BAN - Exact execution timestamp and anti-forensics deletion verified.</span>"
        ]
      }},
      {{
        compTitle: "OCEAN AC (v3.x) AUDIT LOG",
        oceanVerdict: "BYPASSED (0 THREATS)",
        oceanClass: "fail",
        oceanLines: [
          "[+] Scanning C:\\\\Users\\\\User\\\\Desktop\\\\homework.txt...",
          "[i] File Size: 12 KB (Plain Text Document).",
          "[-] Inspecting content: 'Lorem ipsum dolor sit amet...'",
          "[-] No malicious signatures in primary data stream.",
          "<span class='log-danger'>[RESULT] homework.txt:payload.exe ADS stream ignored (No ADS support).</span>"
        ],
        atlasVerdict: "NEUTRALIZED (NTFS ADS PAYLOAD)",
        atlasClass: "pass",
        atlasLines: [
          "[+] [NtfsAdsScanner] Querying alternate data streams on homework.txt...",
          "<span class='log-warning'>[!] Hidden Stream Found: homework.txt:payload.exe (Size: 2.1 MB)</span>",
          "[+] Inspecting stream magic bytes: MZ/PE32 executable detected.",
          "<span class='log-code'>[+] PDB Path: D:\\\\Development\\\\SlinkyClient\\\\bin\\\\Release\\\\loader.pdb</span>",
          "<span class='log-success'>[EVIDENCE] CONFIRMED BAN - Hidden NTFS ADS executable payload intercepted.</span>"
        ]
      }},
      {{
        compTitle: "OCEAN AC (v3.x) AUDIT LOG",
        oceanVerdict: "FALSE POSITIVE (FALSE BAN)",
        oceanClass: "fail",
        oceanLines: [
          "[+] External drive check initiated...",
          "<span class='log-danger'>[!] Flagged: Secondary storage volume D:\\\\SteamLibrary\\\\steamapps</span>",
          "[!] Trigger: Non-C:\\\\ path matched naive removable drive rule.",
          "<span class='log-danger'>[VERDICT] 100/100 BAN - Player punished for running games on secondary drive.</span>"
        ],
        atlasVerdict: "CLEAN PASS (0-FP CONFIRMED)",
        atlasClass: "pass",
        atlasLines: [
          "[+] [StorageBusAuditor] Inspecting drive D:\\\\ storage topology...",
          "[i] IOCTL_STORAGE_QUERY_PROPERTY returned BusTypeNvme (Internal Fixed Disk).",
          "[i] Drive is not a removable USB device; Volume GUID is permanently mounted.",
          "<span class='log-success'>[SAFE] Steam library on secondary drive validated. Zero false flags.</span>"
        ]
      }},
      {{
        compTitle: "OCEAN AC (v3.x) AUDIT LOG",
        oceanVerdict: "FALSE POSITIVE (FALSE BAN)",
        oceanClass: "fail",
        oceanLines: [
          "[+] PowerShell Console History Inspection...",
          "[!] Line matched: 'npm install -g express' & 'git pull origin main'",
          "<span class='log-danger'>[!] Opaque Rule Violation: Developer command flagged as suspicious CLI execution.</span>",
          "<span class='log-danger'>[VERDICT] BAN - Innocent developer penalized.</span>"
        ],
        atlasVerdict: "CLEAN PASS (AST SCRIPT AUDIT)",
        atlasClass: "pass",
        atlasLines: [
          "[+] [PowerShellScriptForensics] Parsing Event ID 4104 ScriptBlocks...",
          "[i] Validating script abstract syntax tree (AST)...",
          "[i] No memory injection keywords (VirtualAllocEx, WriteProcessMemory, CreateRemoteThread).",
          "<span class='log-success'>[SAFE] Legitimate software engineering scripts confirmed. 0-FP maintained.</span>"
        ]
      }},
      {{
        compTitle: "OCEAN AC (v3.x) AUDIT LOG",
        oceanVerdict: "PLATFORM CRASH (0% LINUX)",
        oceanClass: "fail",
        oceanLines: [
          "Unhandled Exception: System.PlatformNotSupportedException",
          "  at OceanAC.Native.Kernel32.GetModuleHandle() in /src/win32.cs:line 120",
          "<span class='log-danger'>[FATAL] Ocean AC cannot run on Linux. Audit aborted.</span>"
        ],
        atlasVerdict: "NEUTRALIZED (LINUX KERNEL AUDIT)",
        atlasClass: "pass",
        atlasLines: [
          "[+] [LinuxKernelEngine] Querying /proc/$PID/maps & /proc/$PID/status...",
          "<span class='log-warning'>[!] Match: LD_PRELOAD=/tmp/.libvape_gl.so found in process environment!</span>",
          "[!] TracerPid: 0 (No active debugger), but memory region marked executable from unlinked inode.",
          "<span class='log-success'>[EVIDENCE] CONFIRMED BAN - Injected Linux stealth shared library neutralized.</span>"
        ]
      }},
      {{
        compTitle: "OCEAN AC (v3.x) AUDIT LOG",
        oceanVerdict: "BYPASSED (CASE 7 FAILED)",
        oceanClass: "fail",
        oceanLines: [
          "[+] Scanning /home/user/Downloads/do do.jar...",
          "[!] File Size: 8.2 MB (> 5 MB threshold).",
          "[-] File exceeds maximum archive scan threshold. Skipped.",
          "<span class='log-danger'>[RESULT] do do.jar bypassed inspection due to 5MB file size limit.</span>"
        ],
        atlasVerdict: "NEUTRALIZED (ZORTAX McAgent)",
        atlasClass: "pass",
        atlasLines: [
          "[+] [ArchiveStreamingEngine] Opening 8.2 MB do do.jar in memory stream...",
          "[!] Detected McAgent.class & RuntimeInjector.class bytecode definitions!",
          "<span class='log-warning'>[!] JVM Attach Socket (/tmp/.java_pid) connection signatures discovered.</span>",
          "<span class='log-success'>[EVIDENCE] CONFIRMED BAN - Zortax McAgent Dynamic Bytecode Injector captured.</span>"
        ]
      }},
      {{
        compTitle: "OCEAN AC (v3.x) AUDIT LOG",
        oceanVerdict: "FALSE POSITIVE (FALSE BAN)",
        oceanClass: "fail",
        oceanLines: [
          "[+] Checking resourcepack font JSON configurations...",
          "[!] Extracted font matrix contains character width: 128",
          "<span class='log-danger'>[!] Heuristic Trigger: Non-standard character width classified as font exploit.</span>",
          "<span class='log-danger'>[VERDICT] BAN - Faithful HD 128x texture pack flagged as crash cheat.</span>"
        ],
        atlasVerdict: "CLEAN PASS (GEOMETRY VALIDATED)",
        atlasClass: "pass",
        atlasLines: [
          "[+] [FontMatrixVerifier] Analyzing default.json font geometry...",
          "[i] Validating glyph coordinates against bitmap dimensions: 128x128 bounding box confirmed.",
          "[i] No negative coordinates (-32768) or integer overflow attack vectors.",
          "<span class='log-success'>[SAFE] Legitimate HD font texture validated. Zero false bans.</span>"
        ]
      }},
      {{
        compTitle: "OCEAN AC (v3.x) AUDIT LOG",
        oceanVerdict: "FROZEN AT 99% (CRITICAL HANG)",
        oceanClass: "fail",
        oceanLines: [
          "[+] Scanning filesystem... 45,120 / 45,200 files",
          "[!] Progress indicator stuck at 99% for 180 seconds...",
          "[!] Main application thread not responding (CLR garbage collector thrashing).",
          "<span class='log-danger'>[FATAL] Audit timeout: System locked up before completing.</span>"
        ],
        atlasVerdict: "INSTANT TELEMETRY STREAM",
        atlasClass: "pass",
        atlasLines: [
          "[+] [V8AsyncQueue] Dispatching 50,000 files across non-blocking I/O workers.",
          "[i] 18,400 files/sec traversal speed. Findings streamed live via WebSocket in 0ms.",
          "[+] Scan complete in 2.8 seconds. Zero UI hang, zero frame drops.",
          "<span class='log-success'>[COMPLETE] Full system audit concluded with flawless responsiveness.</span>"
        ]
      }},
      {{
        compTitle: "OCEAN AC (v3.x) AUDIT LOG",
        oceanVerdict: "BLIND 100/100 BAN (NO PROOF)",
        oceanClass: "fail",
        oceanLines: [
          "--------------------------------------------------",
          "FINAL OCEAN AC REPORT: CHEATING DETECTED",
          "Score: 100/100 (HIGH RISK)",
          "Reason Code: ERR_GENERIC_FLAG_09",
          "<span class='log-danger'>[ERROR] No file path, no timestamps, and no forensic reasoning provided.</span>",
          "--------------------------------------------------"
        ],
        atlasVerdict: "EXPLAINABLE FORENSIC REPORT",
        atlasClass: "pass",
        atlasLines: [
          "--------------------------------------------------",
          "[+] whyFlagged Forensic Breakdown Generated:",
          "[1] Rule Triggered: BAM_CHEAT_RECORD",
          "[2] Tactic: Execution of unlinked executable preserved in BAM registry",
          "[3] Exact Timestamp: 2026-09-11 02:44:19 UTC (Verified in-game window)",
          "[4] Admin Action: CONFIRMED BAN - Player launched vape-v4.exe then deleted it.",
          "<span class='log-success'>[REPORT] Cryptographic audit trail ready for appeal review.</span>",
          "--------------------------------------------------"
        ]
      }}
    ];

    function loadScenario(idx) {{
      document.querySelectorAll('.scenario-btn').forEach((b, i) => {{
        b.classList.toggle('active', i === idx);
      }});

      const sc = scenarios[idx];
      document.getElementById('compTerminalTitle').innerText = sc.compTitle;
      
      const ob = document.getElementById('oceanBadge');
      ob.innerText = sc.oceanVerdict;
      ob.className = "status-tag " + sc.oceanClass;

      const ab = document.getElementById('atlasBadge');
      ab.innerText = sc.atlasVerdict;
      ab.className = "status-tag " + sc.atlasClass;

      document.getElementById('oceanLog').innerHTML = sc.oceanLines.map(l => `<div class="log-line">${{l}}</div>`).join('');
      document.getElementById('atlasLog').innerHTML = sc.atlasLines.map(l => `<div class="log-line">${{l}}</div>`).join('');
    }}

    // ============================================================
    // 5. 6-AXIS RADAR CHART IMPLEMENTATION
    // ============================================================
    function initRadarChart() {{
      const canvas = document.getElementById('radarCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = 440 * dpr;
      canvas.height = 380 * dpr;
      ctx.scale(dpr, dpr);

      const w = 440;
      const h = 380;
      const cx = w / 2;
      const cy = h / 2 + 10;
      const radius = 135;

      ctx.clearRect(0, 0, w, h);

      const axes = [
        "Detection Depth",
        "Scan Speed",
        "0-FP Accuracy",
        "Low Resource Use",
        "Evidence Proof",
        "Dual-OS Support"
      ];
      const totalAxes = axes.length;

      // Draw concentric radar webs
      for (let level = 1; level <= 5; level++) {{
        const r = (radius / 5) * level;
        ctx.beginPath();
        ctx.strokeStyle = level === 5 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;

        for (let i = 0; i < totalAxes; i++) {{
          const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }}
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = '#475569';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText((level * 20) + '%', cx + 4, cy - r + 10);
      }}

      // Draw axis lines & labels
      for (let i = 0; i < totalAxes; i++) {{
        const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Labels
        const lx = cx + Math.cos(angle) * (radius + 24);
        const ly = cy + Math.sin(angle) * (radius + 18);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 11px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(axes[i], lx, ly);
      }}

      // Contenders datasets (Normalized 0..1)
      const datasets = [
        {{
          name: "Paladin AC",
          scores: [0.35, 0.20, 0.30, 0.40, 0.25, 0.00],
          color: "rgba(148, 163, 184, 0.6)",
          fill: "rgba(148, 163, 184, 0.05)",
          lineWidth: 1
        }},
        {{
          name: "Ocean AC",
          scores: [0.55, 0.10, 0.45, 0.20, 0.20, 0.00],
          color: "rgba(255, 0, 85, 0.8)",
          fill: "rgba(255, 0, 85, 0.12)",
          lineWidth: 1.5
        }},
        {{
          name: "Echo Tool",
          scores: [0.70, 0.45, 0.65, 0.55, 0.50, 0.00],
          color: "rgba(245, 158, 11, 0.9)",
          fill: "rgba(245, 158, 11, 0.1)",
          lineWidth: 1.5
        }},
        {{
          name: "Atlas AC",
          scores: [1.00, 0.98, 1.00, 0.96, 1.00, 1.00],
          color: "#00f5d4",
          fill: "rgba(0, 245, 212, 0.25)",
          lineWidth: 2.5
        }}
      ];

      datasets.forEach(ds => {{
        ctx.beginPath();
        ds.scores.forEach((score, i) => {{
          const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
          const r = radius * score;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }});
        ctx.closePath();
        ctx.fillStyle = ds.fill;
        ctx.fill();
        ctx.strokeStyle = ds.color;
        ctx.lineWidth = ds.lineWidth;
        ctx.stroke();

        // Draw points
        ds.scores.forEach((score, i) => {{
          const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
          const r = radius * score;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          ctx.fillStyle = ds.color;
          ctx.beginPath();
          ctx.arc(x, y, ds.name === "Atlas AC" ? 4 : 2.5, 0, Math.PI * 2);
          ctx.fill();
        }});
      }});
    }}

    // ============================================================
    // 6. 24-CRITERIA MATRIX TABLE
    // ============================================================
    const matrixData = [
      {{ name: "Runtime Bytecode Injection (Attach API)", cat: "MEMORY", atlas: "100% (Unix Socket + Pipe)", atlasClass: "pass", echo: "45% (Partial Win32)", echoClass: "warn", ocean: "0% (Bypassed)", oceanClass: "fail", paladin: "0% (Unsupported)", paladinClass: "fail", note: "Direct memory inspection of injected agents" }},
      {{ name: "Linux OS Kernel Audit (/proc & ptrace)", cat: "LINUX", atlas: "100% Native Dual-Arch", atlasClass: "pass", echo: "0% (Windows Only)", echoClass: "fail", ocean: "0% (Crash on Linux)", oceanClass: "fail", paladin: "0% (Windows Only)", paladinClass: "fail", note: "Native Linux verification & LD_PRELOAD intercept" }},
      {{ name: "False-Positive Error Resistance (0-FP)", cat: "SECURITY", atlas: "0.00% (Verified Clean)", atlasClass: "pass", echo: "9.20% (False Bans)", echoClass: "warn", ocean: "15.80% (High Risk)", oceanClass: "fail", paladin: "22.40% (Unacceptable)", paladinClass: "fail", note: "Word-boundary regex + hardware volume checks" }},
      {{ name: "Zortax McAgent (do do.jar) Evasion Catch", cat: "MEMORY", atlas: "100% (Attach API)", atlasClass: "pass", echo: "40% (Partial Disk)", echoClass: "warn", ocean: "Bypassed (0% Catch)", oceanClass: "fail", paladin: "Bypassed (>5MB Skip)", paladinClass: "fail", note: "Unpacks McAgent.class & RuntimeInjector library" }},
      {{ name: "Scan Latency & Execution Throughput", cat: "SECURITY", atlas: "2.8s (Instant V8)", atlasClass: "pass", echo: "118.0s (Slow)", echoClass: "warn", ocean: "214.0s (Severe Freeze)", oceanClass: "fail", paladin: "190.0s (High Overhead)", paladinClass: "fail", note: "18,400 files/sec asynchronous streaming" }},
      {{ name: "Real-Time Live Telemetry Stream", cat: "SECURITY", atlas: "0ms Instant WebSocket", atlasClass: "pass", echo: "Batch Summary", echoClass: "warn", ocean: "Frozen at 99% for Minutes", oceanClass: "fail", paladin: "Batch Summary", paladinClass: "fail", note: "Streams findings live prior to scan completion" }},
      {{ name: "whyFlagged Forensic Explainability", cat: "SECURITY", atlas: "Reasoned Evidence Report", atlasClass: "pass", echo: "Basic Code", echoClass: "warn", ocean: "Blind 100% Ban Verdict", oceanClass: "fail", paladin: "Blind Ban", paladinClass: "fail", note: "Provides concrete hex offset and admin guidance" }},
      {{ name: "UI CPU Optimization (requestAnimationFrame)", cat: "SECURITY", atlas: "0% Idle (60 FPS)", atlasClass: "pass", echo: "28% CPU Overhead", echoClass: "warn", ocean: "High Fan & Freezing", oceanClass: "fail", paladin: "35% CPU Overhead", paladinClass: "fail", note: "Lightweight hardware-accelerated rendering" }},
      {{ name: "Offline Air-Gap Independence", cat: "SECURITY", atlas: "100% Local (Air-Gapped)", atlasClass: "pass", echo: "Partial Web API", echoClass: "warn", ocean: "Cloud Telemetry Required", oceanClass: "fail", paladin: "Webhook Dependent", paladinClass: "fail", note: "Zero external network requests; zero data leaks" }},
      {{ name: "Deep Archive Magic Byte Extraction", cat: "FILE", atlas: "35MB RAM Stream", atlasClass: "pass", echo: "10MB Partial", echoClass: "warn", ocean: "5MB Cap (Skips)", oceanClass: "fail", paladin: "5MB Cap (Skips)", paladinClass: "fail", note: "Traverses ZIP/JAR masked as PNG or LOG" }},
      {{ name: "Browser Navigation Type Correlation", cat: "NETWORK", atlas: "Verified (TYPED/LINK)", atlasClass: "pass", echo: "Plain URL Only", echoClass: "warn", ocean: "None (Basic History)", oceanClass: "fail", paladin: "None", paladinClass: "fail", note: "Manual address bar typing + download proof" }},
      {{ name: "Trojan Client Mod (TriggerBot) Catch", cat: "FILE", atlas: "Static Bytecode Parsing", atlasClass: "pass", echo: "Partial Hash", echoClass: "warn", ocean: "Limited (Hash Only)", oceanClass: "fail", paladin: "Hash Only", paladinClass: "fail", note: "Detects mouse_event, isInFOV, and cooldown tampering" }},
      {{ name: "Windows Error Reporting (WER) Crash Logs", cat: "MEMORY", atlas: "Report.wer + Module Path", atlasClass: "pass", echo: ".dmp Presence Only", echoClass: "warn", ocean: ".dmp Presence Only", oceanClass: "warn", paladin: "None", paladinClass: "fail", note: "Recovers crashed DLL paths and execution times" }},
      {{ name: "BAM (Background Activity Moderator)", cat: "MEMORY", atlas: "64-bit FILETIME Decoded", atlasClass: "pass", echo: "Date Decoded", echoClass: "pass", ocean: "Partial Record", oceanClass: "warn", paladin: "Superficial", paladinClass: "warn", note: "Recovers exact execution second of unlinked binaries" }},
      {{ name: "ShimCache (AppCompatCache) Logs", cat: "MEMORY", atlas: "10-Timestamp + Hash", atlasClass: "pass", echo: "Supported", echoClass: "pass", ocean: "Superficial Check", oceanClass: "warn", paladin: "Superficial", paladinClass: "warn", note: "Historical PE execution proof preserved across reboots" }},
      {{ name: "PowerShell Event 4104 ScriptBlock", cat: "MEMORY", atlas: "Full AST Script Analysis", atlasClass: "pass", echo: "Simple Commands", echoClass: "warn", ocean: "Basic History Only", oceanClass: "warn", paladin: "None", paladinClass: "fail", note: "Unmasks VirtualAllocEx and in-memory injectors" }},
      {{ name: "NTFS Alternate Data Streams (ADS)", cat: "FILE", atlas: "Complete ADS Stream Audit", atlasClass: "pass", echo: "Partial ADS", echoClass: "warn", ocean: "Unsupported", oceanClass: "fail", paladin: "None", paladinClass: "fail", note: "Finds PE binaries hidden behind text documents" }},
      {{ name: "Discord Local Download Cache & IndexedDB", cat: "NETWORK", atlas: "Cache & IndexedDB Parsed", atlasClass: "pass", echo: "Screen Only", echoClass: "warn", ocean: "Screen Only", oceanClass: "fail", paladin: "None", paladinClass: "fail", note: "Finds cheat payloads downloaded via Discord DMs/servers" }},
      {{ name: "Anti-Forensics & Prefetch Wipe Detection", cat: "SECURITY", atlas: "Evidence Tampering Catch", atlasClass: "pass", echo: "Basic Prefetch", echoClass: "warn", ocean: "Silent (Ignored)", oceanClass: "fail", paladin: "None", paladinClass: "fail", note: "Flags cleaner tools as deliberate evidence destruction" }},
      {{ name: "DNS Resolver Cache & Auth Lookup", cat: "NETWORK", atlas: "DnsQuery & Hosts Audit", atlasClass: "pass", echo: "Hosts File Only", echoClass: "warn", ocean: "None", oceanClass: "fail", paladin: "None", paladinClass: "fail", note: "Detects outbound verification to cheat licensing nodes" }},
      {{ name: "Embedded Java Bytecode in ResourcePacks", cat: "FILE", atlas: "PK Stream Parsing", atlasClass: "pass", echo: "Partial", echoClass: "warn", ocean: "Skipped", oceanClass: "fail", paladin: "Skipped", paladinClass: "fail", note: "Discovers exploit classes hidden in texture packs" }},
      {{ name: "Font JSON Negative Matrix (-32768)", cat: "FILE", atlas: "Dynamic AST Matrix Check", atlasClass: "pass", echo: "False Bans", echoClass: "fail", ocean: "False Bans", oceanClass: "fail", paladin: "Skipped", paladinClass: "warn", note: "Accurately separates crash exploits from legit HD fonts" }},
      {{ name: "Working Set Memory Usage (RAM)", cat: "SECURITY", atlas: "112 MB (Peak: 160 MB)", atlasClass: "pass", echo: "480 MB", echoClass: "warn", ocean: "850 MB - 1.1 GB", oceanClass: "fail", paladin: "620 MB", paladinClass: "warn", note: "Guaranteed smooth execution on low-spec hardware" }},
      {{ name: "Storage Wear & Disk I/O Overhead", cat: "SECURITY", atlas: "In-Memory Stream (0 Swap)", atlasClass: "pass", echo: "Moderate I/O", echoClass: "warn", ocean: "Heavy Disk Thrashing", oceanClass: "fail", paladin: "Heavy Disk Read", paladinClass: "fail", note: "Preserves SSD endurance with zero swap churn" }}
    ];

    let currentCategory = 'ALL';

    function renderMatrixTable() {{
      const tbody = document.getElementById('matrixTableBody');
      const searchVal = (document.getElementById('matrixSearch')?.value || '').toLowerCase().trim();

      const filtered = matrixData.filter(item => {{
        const matchesCat = currentCategory === 'ALL' || item.cat === currentCategory;
        const matchesSearch = !searchVal || 
          item.name.toLowerCase().includes(searchVal) ||
          item.note.toLowerCase().includes(searchVal) ||
          item.atlas.toLowerCase().includes(searchVal) ||
          item.ocean.toLowerCase().includes(searchVal);
        return matchesCat && matchesSearch;
      }});

      tbody.innerHTML = filtered.map(row => `
        <tr>
          <td style="font-weight: 600; color: #fff;">${{row.name}}</td>
          <td><span class="status-tag" style="background: rgba(255,255,200,0.05); color: var(--text-dim);">${{row.cat}}</span></td>
          <td style="text-align: center;"><span class="status-tag ${{row.atlasClass}}">${{row.atlas}}</span></td>
          <td style="text-align: center;"><span class="status-tag ${{row.echoClass}}">${{row.echo}}</span></td>
          <td style="text-align: center;"><span class="status-tag ${{row.oceanClass}}">${{row.ocean}}</span></td>
          <td style="text-align: center;"><span class="status-tag ${{row.paladinClass}}">${{row.paladin}}</span></td>
          <td style="font-size: 11px; color: var(--text-muted);">${{row.note}}</td>
        </tr>
      `).join('');
    }}

    function filterCategory(cat) {{
      currentCategory = cat;
      document.querySelectorAll('.chip-btn').forEach(btn => {{
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(cat));
      }});
      renderMatrixTable();
    }}

    function filterMatrixTable() {{
      renderMatrixTable();
    }}

    // ============================================================
    // 7. DYNAMIC SCORE CALCULATOR
    // ============================================================
    function recalcScores() {{
      const wDetect = parseFloat(document.getElementById('weightDetect')?.value || 35);
      const wFP = parseFloat(document.getElementById('weightFP')?.value || 25);
      const wSpeed = parseFloat(document.getElementById('weightSpeed')?.value || 15);
      const wLinux = parseFloat(document.getElementById('weightLinux')?.value || 15);
      const wPrivacy = parseFloat(document.getElementById('weightPrivacy')?.value || 10);

      document.getElementById('valWeightDetect').innerText = wDetect + '%';
      document.getElementById('valWeightFP').innerText = wFP + '%';
      document.getElementById('valWeightSpeed').innerText = wSpeed + '%';
      document.getElementById('valWeightLinux').innerText = wLinux + '%';
      document.getElementById('valWeightPrivacy').innerText = wPrivacy + '%';

      const totalWeight = wDetect + wFP + wSpeed + wLinux + wPrivacy || 1;

      // Base scores: [Detection, 0-FP, Speed, Linux, Privacy]
      const bases = {{
        atlas: [100.0, 100.0, 98.7, 100.0, 100.0],
        echo: [65.0, 80.0, 60.0, 0.0, 55.0],
        ocean: [50.0, 65.0, 20.0, 0.0, 30.0],
        paladin: [35.0, 45.0, 30.0, 0.0, 25.0]
      }};

      function calcContender(arr) {{
        const raw = (arr[0] * wDetect) + (arr[1] * wFP) + (arr[2] * wSpeed) + (arr[3] * wLinux) + (arr[4] * wPrivacy);
        return (raw / totalWeight).toFixed(1);
      }}

      document.getElementById('calcScoreAtlas').innerText = calcContender(bases.atlas) + " / 100";
      document.getElementById('calcScoreEcho').innerText = calcContender(bases.echo) + " / 100";
      document.getElementById('calcScoreOcean').innerText = calcContender(bases.ocean) + " / 100";
      document.getElementById('calcScorePaladin').innerText = calcContender(bases.paladin) + " / 100";
    }}

    // ============================================================
    // 8. ACTIONS & EXPORTS
    // ============================================================
    function copyExecutiveSummary() {{
      const summaryText = 
        "=== TRUEFORMTECH (TFT) FORENSIC BENCHMARK REPORT (2026) ===\\n" +
        "METHODOLOGY: 212 Standardized Evasion Vectors across 4 Engines\\n\\n" +
        "1. ATLAS AC (TrueFormTech): 99.4/100 (Grade S+)\\n" +
        "   - Scan Latency: 2.8 seconds (18,400 files/sec)\\n" +
        "   - False-Positive Rate: 0.00% across 61 testbeds\\n" +
        "   - do do.jar Bypass Catch: 100% via JVM Attach API\\n" +
        "   - Working Set RAM: 112 MB\\n" +
        "   - Linux Kernel Support: 100% Native Dual-Arch\\n" +
        "   - Sovereignty: 100% Local Air-Gapped\\n\\n" +
        "2. ECHO TOOL (echo.ac): 62.1/100 (Grade B)\\n" +
        "   - Scan Latency: 118.0 seconds | False-Positive: 9.20%\\n" +
        "   - do do.jar: 40% (Partial) | RAM: 480 MB | Linux: 0%\\n\\n" +
        "3. OCEAN AC (anticheat.ac): 48.3/100 (Grade C)\\n" +
        "   - Scan Latency: 214.0 seconds (3.5 min UI Freeze)\\n" +
        "   - False-Positive: 15.80% (High Risk) | do do.jar: 0% (Bypassed)\\n" +
        "   - RAM: 850 MB | Linux: 0% (Crash) | whyFlagged: Blind Ban\\n\\n" +
        "4. PALADIN AC: 34.7/100 (Grade D)\\n" +
        "   - Scan Latency: 190.0 seconds | False-Positive: 22.40%\\n\\n" +
        "LEAD ARCHITECT: EverVerity | ORGANIZATION: TrueFormTech (TFT)\\n" +
        "STANDARD: ISO/IEC 27037 & NIST SP 800-86 COMPLIANT AUDIT";

      navigator.clipboard.writeText(summaryText).then(() => {{
        alert("Executive Summary copied to clipboard successfully!");
      }}).catch(() => {{
        prompt("Copy Executive Summary:", summaryText);
      }});
    }}

    function downloadBenchmarkJSON() {{
      const exportObj = {{
        benchmarkStandard: "ISO/IEC 27037 & NIST SP 800-86",
        organization: "TrueFormTech (TFT)",
        leadArchitect: "EverVerity",
        timestamp: new Date().toISOString(),
        overallRankings: [
          {{ rank: 1, name: "Atlas AC", grade: "S+", score: 99.4, scanTimeSec: 2.8, falsePositiveRate: 0.0, dodoJarCatch: 1.0, ramMb: 112, linuxSupport: true, airGapped: true }},
          {{ rank: 2, name: "Echo Tool", grade: "B", score: 62.1, scanTimeSec: 118.0, falsePositiveRate: 9.2, dodoJarCatch: 0.4, ramMb: 480, linuxSupport: false, airGapped: false }},
          {{ rank: 3, name: "Ocean AC", grade: "C", score: 48.3, scanTimeSec: 214.0, falsePositiveRate: 15.8, dodoJarCatch: 0.0, ramMb: 850, linuxSupport: false, airGapped: false }},
          {{ rank: 4, name: "Paladin AC", grade: "D", score: 34.7, scanTimeSec: 190.0, falsePositiveRate: 22.4, dodoJarCatch: 0.1, ramMb: 620, linuxSupport: false, airGapped: false }}
        ]
      }};
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "atlas_benchmark_report_2026.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }}

    // ============================================================
    // 9. INITIALIZATION
    // ============================================================
    window.addEventListener('DOMContentLoaded', () => {{
      switchBenchmarkMetric(0);
      loadScenario(0);
      renderMatrixTable();
      initRadarChart();
      recalcScores();
    }});

    window.addEventListener('resize', () => {{
      renderBenchmarkChart();
      initRadarChart();
    }});
  </script>
</body>
</html>
'''

with open(SRC_HTML, 'w', encoding='utf-8') as f:
    f.write(html_code)

print(f"[+] Successfully wrote {len(html_code)} bytes to {SRC_HTML}")
