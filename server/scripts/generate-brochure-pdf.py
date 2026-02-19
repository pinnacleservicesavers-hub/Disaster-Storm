#!/usr/bin/env python3
"""
Professional multi-format brochure PDF generator using WeasyPrint.
Supports tri-fold (6 panels), bi-fold (4 panels), and single-page (2 panels)
on multiple paper sizes (letter, legal, A4, tabloid, A3, A5).
Takes JSON brochure data from stdin, outputs PDF to specified file.
"""

import sys
import json
import base64
import os
import urllib.request
import urllib.parse
import ipaddress
import socket
from weasyprint import HTML

ALLOWED_IMAGE_HOSTS = {
    'oaidalleapiprodscus.blob.core.windows.net',
    'dalleprodsec.blob.core.windows.net',
    'images.openai.com',
}
MAX_IMAGE_SIZE = 20 * 1024 * 1024

PAPER_SIZES = {
    'letter':  {'w': 11,    'h': 8.5,   'unit': 'in'},
    'legal':   {'w': 14,    'h': 8.5,   'unit': 'in'},
    'a4':      {'w': 11.69, 'h': 8.27,  'unit': 'in'},
    'tabloid': {'w': 17,    'h': 11,    'unit': 'in'},
    'a3':      {'w': 16.54, 'h': 11.69, 'unit': 'in'},
    'a5':      {'w': 8.27,  'h': 5.83,  'unit': 'in'},
}

def is_safe_url(url):
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme != 'https':
            return False
        host = parsed.hostname or ''
        if host in ALLOWED_IMAGE_HOSTS:
            return True
        try:
            for info in socket.getaddrinfo(host, None):
                addr = info[4][0]
                ip = ipaddress.ip_address(addr)
                if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                    return False
        except socket.gaierror:
            return False
        return True
    except Exception:
        return False

def fetch_image_as_data_uri(url):
    try:
        if not url:
            return ""
        if url.startswith('data:'):
            if len(url) > MAX_IMAGE_SIZE:
                return ""
            return url
        if not is_safe_url(url):
            sys.stderr.write(f"URL not allowed: {url[:100]}\n")
            return ""
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read(MAX_IMAGE_SIZE + 1)
            if len(data) > MAX_IMAGE_SIZE:
                return ""
            content_type = resp.headers.get('Content-Type', 'image/jpeg')
            b64 = base64.b64encode(data).decode('ascii')
            return f"data:{content_type};base64,{b64}"
    except Exception as e:
        sys.stderr.write(f"Image fetch failed: {e}\n")
        return ""

def escape_html(text):
    if not text:
        return ''
    return str(text).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

def render_body_items(body):
    if not body:
        return ''
    html = ''
    for item in body:
        txt = str(item)
        if txt.startswith('✔') or txt.startswith('•') or txt.startswith('-'):
            clean = txt.lstrip('✔•- ')
            html += f'<div class="check-item"><span class="ci">✔</span><span>{escape_html(clean)}</span></div>'
        else:
            html += f'<p class="body-text">{escape_html(txt)}</p>'
    return html

def render_highlights(highlights):
    if not highlights:
        return ''
    hl = '\n'.join(f'<p class="highlight">{escape_html(h)}</p>' for h in highlights)
    return f'<div class="highlights">{hl}</div>'

def render_panel(panel, accent, is_front=False, company='', tagline='', phone='', website='', creds_html='', extra_class='', fallback_bg=''):
    title = panel.get('title', '')
    subtitle = panel.get('subtitle', '')
    body = panel.get('body', [])
    highlights = panel.get('highlights', [])
    footer = panel.get('footer', '')
    cls = f' {extra_class}' if extra_class else ''

    watermark_url = panel.get('watermarkUrl', '') or panel.get('watermark_url', '')
    if not watermark_url:
        watermark_url = fallback_bg

    watermark_data_uri = fetch_image_as_data_uri(watermark_url) if watermark_url else ''
    panel_bg_html = ''
    if watermark_data_uri:
        panel_bg_html = f'<div class="panel-watermark" style="background-image: url(\'{watermark_data_uri}\');"></div>'

    if is_front:
        body_line = ''
        if body and len(body) > 0:
            body_line = f'<p class="front-body-line">{escape_html(body[0])}</p>'
        return f'''
        <div class="panel front-panel{cls}">
            {panel_bg_html}
            <div class="front-content">
                <h1 class="company-name">{escape_html(company)}</h1>
                <div class="credentials">{creds_html}</div>
                <div class="accent-line"></div>
                {body_line}
                <p class="tagline">{escape_html(tagline)}</p>
                {render_highlights(highlights)}
            </div>
            <div class="contact-block">
                <p class="phone">{escape_html(phone)}</p>
                <p class="website-text">{escape_html(website)}</p>
            </div>
        </div>'''

    subtitle_html = f'<p class="panel-subtitle">{escape_html(subtitle)}</p>' if subtitle else ''
    footer_html = f'<div class="panel-footer">{escape_html(footer)}</div>' if footer else ''

    return f'''
    <div class="panel content-panel{cls}">
        {panel_bg_html}
        <div class="panel-header">
            <h2 class="panel-title">{escape_html(title)}</h2>
            {subtitle_html}
            <div class="accent-line"></div>
        </div>
        <div class="panel-body">
            {render_body_items(body)}
        </div>
        {render_highlights(highlights)}
        {footer_html}
        <div class="panel-phone">{escape_html(phone)}</div>
    </div>'''


def generate_brochure_html(data):
    company = data.get('companyName', 'Your Company')
    tagline = data.get('tagline', '')
    phone = data.get('phone', '')
    website = data.get('website', '')
    credentials = data.get('credentials', [])
    accent = data.get('accentColor', '#D4FF00')
    hero_url = data.get('heroImageUrl', '')
    brochure_format = data.get('_format', 'tri-fold')
    paper_size_key = data.get('_paperSize', 'letter')

    paper = PAPER_SIZES.get(paper_size_key, PAPER_SIZES['letter'])
    page_w = paper['w']
    page_h = paper['h']

    outside_panels = data.get('outsidePanels', [])
    inside_panels = data.get('insidePanels', [])

    if not outside_panels and not inside_panels:
        old_panels = data.get('panels', [])
        if old_panels:
            if brochure_format == 'bi-fold':
                outside_panels = old_panels[:2] if len(old_panels) >= 2 else old_panels
                inside_panels = old_panels[2:4] if len(old_panels) > 2 else []
            elif brochure_format == 'single-page':
                outside_panels = old_panels[:1] if len(old_panels) >= 1 else old_panels
                inside_panels = old_panels[1:2] if len(old_panels) > 1 else []
            else:
                outside_panels = old_panels[:3] if len(old_panels) >= 3 else old_panels
                inside_panels = old_panels[3:6] if len(old_panels) > 3 else []

    hero_data_uri = fetch_image_as_data_uri(hero_url) if hero_url else ''

    creds_html = ' &bull; '.join(f'<span class="cred">{escape_html(c)}</span>' for c in credentials)

    bg_css = ''
    if hero_data_uri:
        bg_css = f'background-image: url("{hero_data_uri}"); background-size: cover; background-position: center;'

    if brochure_format == 'tri-fold':
        return generate_trifold_html(data, outside_panels, inside_panels, accent, company, tagline, phone, website, creds_html, bg_css, page_w, page_h, hero_url)
    elif brochure_format == 'bi-fold':
        return generate_bifold_html(data, outside_panels, inside_panels, accent, company, tagline, phone, website, creds_html, bg_css, page_w, page_h, hero_url)
    else:
        return generate_single_html(data, outside_panels, inside_panels, accent, company, tagline, phone, website, creds_html, bg_css, page_w, page_h, hero_url)


def generate_trifold_html(data, outside_panels, inside_panels, accent, company, tagline, phone, website, creds_html, bg_css, page_w, page_h, hero_url=''):
    front_panel = None
    back_panel = None
    flap_panel = None
    for p in outside_panels:
        pos = p.get('position', '')
        if pos == 'front_cover':
            front_panel = p
        elif pos == 'back_cover':
            back_panel = p
        elif pos == 'inside_flap':
            flap_panel = p
    if not front_panel:
        front_panel = outside_panels[0] if len(outside_panels) > 0 else {'title': '', 'body': []}
    if not back_panel:
        back_panel = outside_panels[1] if len(outside_panels) > 1 else {'title': '', 'body': []}
    if not flap_panel:
        flap_panel = outside_panels[2] if len(outside_panels) > 2 else {'title': '', 'body': []}

    flap_w = round(page_w * 0.318, 4)
    main_w = round((page_w - flap_w) / 2, 4)
    inside_w = round(page_w / 3, 4)

    fold1 = round(flap_w, 4)
    fold2 = round(flap_w + main_w, 4)
    ifold1 = round(inside_w, 4)
    ifold2 = round(inside_w * 2, 4)

    outside_html = render_panel(flap_panel, accent, is_front=False, phone=phone, extra_class='flap-panel', fallback_bg=hero_url)
    outside_html += render_panel(back_panel, accent, is_front=False, phone=phone, extra_class='back-panel', fallback_bg=hero_url)
    outside_html += render_panel(front_panel, accent, is_front=True,
                                  company=company, tagline=tagline, phone=phone,
                                  website=website, creds_html=creds_html, extra_class='front-panel-outer', fallback_bg=hero_url)

    inside_html = ''
    for p in inside_panels[:3]:
        inside_html += render_panel(p, accent, is_front=False, phone=phone, fallback_bg=hero_url)
    while len(inside_panels) < 3:
        inside_html += '<div class="panel content-panel"></div>'
        inside_panels.append({})

    return build_html(accent, bg_css, page_w, page_h, f'''
<!-- PAGE 1: OUTSIDE -->
<div class="brochure-page outside-page">
    <div class="bg-layer"></div>
    <div class="fold-line" style="left: {fold1}in;"></div>
    <div class="fold-line" style="left: {fold2}in;"></div>
    <span class="page-label">Outside &mdash; Page 1 of 2</span>
    <span class="side-label">&larr; Flap &nbsp;&nbsp;|&nbsp;&nbsp; Back Cover &nbsp;&nbsp;|&nbsp;&nbsp; Front Cover &rarr;</span>
    {outside_html}
</div>

<!-- PAGE 2: INSIDE -->
<div class="brochure-page inside-page">
    <div class="bg-layer"></div>
    <div class="fold-line" style="left: {ifold1}in;"></div>
    <div class="fold-line" style="left: {ifold2}in;"></div>
    <span class="page-label">Inside &mdash; Page 2 of 2</span>
    <span class="side-label">&larr; Inside Left &nbsp;&nbsp;|&nbsp;&nbsp; Inside Center &nbsp;&nbsp;|&nbsp;&nbsp; Inside Right &rarr;</span>
    {inside_html}
</div>
''', extra_css=f'''
.flap-panel {{
    width: {flap_w}in;
}}
.back-panel,
.front-panel-outer {{
    width: {main_w}in;
}}
.inside-page .panel {{
    width: {inside_w}in;
}}
''')


def generate_bifold_html(data, outside_panels, inside_panels, accent, company, tagline, phone, website, creds_html, bg_css, page_w, page_h, hero_url=''):
    front_panel = None
    back_panel = None
    for p in outside_panels:
        pos = p.get('position', '')
        if pos in ('front_cover', 'front'):
            front_panel = p
        elif pos in ('back_cover', 'back'):
            back_panel = p
    if not front_panel:
        front_panel = outside_panels[0] if len(outside_panels) > 0 else {'title': '', 'body': []}
    if not back_panel:
        back_panel = outside_panels[1] if len(outside_panels) > 1 else {'title': '', 'body': []}

    half_w = round(page_w / 2, 4)
    fold_pos = half_w

    left_panel = None
    right_panel = None
    for p in inside_panels:
        pos = p.get('position', '')
        if pos in ('left_panel', 'inside_left'):
            left_panel = p
        elif pos in ('right_panel', 'inside_right'):
            right_panel = p
    if not left_panel:
        left_panel = inside_panels[0] if len(inside_panels) > 0 else {'title': '', 'body': []}
    if not right_panel:
        right_panel = inside_panels[1] if len(inside_panels) > 1 else {'title': '', 'body': []}

    outside_html = render_panel(back_panel, accent, is_front=False, phone=phone, extra_class='half-panel', fallback_bg=hero_url)
    outside_html += render_panel(front_panel, accent, is_front=True,
                                  company=company, tagline=tagline, phone=phone,
                                  website=website, creds_html=creds_html, extra_class='half-panel', fallback_bg=hero_url)

    inside_html = render_panel(left_panel, accent, is_front=False, phone=phone, extra_class='half-panel', fallback_bg=hero_url)
    inside_html += render_panel(right_panel, accent, is_front=False, phone=phone, extra_class='half-panel', fallback_bg=hero_url)

    return build_html(accent, bg_css, page_w, page_h, f'''
<!-- PAGE 1: OUTSIDE -->
<div class="brochure-page outside-page">
    <div class="bg-layer"></div>
    <div class="fold-line" style="left: {fold_pos}in;"></div>
    <span class="page-label">Outside &mdash; Page 1 of 2</span>
    <span class="side-label">&larr; Back Cover &nbsp;&nbsp;|&nbsp;&nbsp; Front Cover &rarr;</span>
    {outside_html}
</div>

<!-- PAGE 2: INSIDE -->
<div class="brochure-page inside-page">
    <div class="bg-layer"></div>
    <div class="fold-line" style="left: {fold_pos}in;"></div>
    <span class="page-label">Inside &mdash; Page 2 of 2</span>
    <span class="side-label">&larr; Inside Left &nbsp;&nbsp;|&nbsp;&nbsp; Inside Right &rarr;</span>
    {inside_html}
</div>
''', extra_css=f'''
.half-panel {{
    width: {half_w}in;
}}
''')


def generate_single_html(data, outside_panels, inside_panels, accent, company, tagline, phone, website, creds_html, bg_css, page_w, page_h, hero_url=''):
    front_panel = outside_panels[0] if len(outside_panels) > 0 else {'title': '', 'body': []}
    back_panel = inside_panels[0] if len(inside_panels) > 0 else {'title': '', 'body': []}

    outside_html = render_panel(front_panel, accent, is_front=True,
                                  company=company, tagline=tagline, phone=phone,
                                  website=website, creds_html=creds_html, extra_class='full-panel', fallback_bg=hero_url)

    inside_html = render_panel(back_panel, accent, is_front=False, phone=phone, extra_class='full-panel', fallback_bg=hero_url)

    return build_html(accent, bg_css, page_w, page_h, f'''
<!-- PAGE 1: FRONT -->
<div class="brochure-page outside-page">
    <div class="bg-layer"></div>
    <span class="page-label">Front &mdash; Page 1 of 2</span>
    {outside_html}
</div>

<!-- PAGE 2: BACK -->
<div class="brochure-page inside-page">
    <div class="bg-layer"></div>
    <span class="page-label">Back &mdash; Page 2 of 2</span>
    {inside_html}
</div>
''', extra_css=f'''
.full-panel {{
    width: {page_w}in;
}}
''')


def build_html(accent, bg_css, page_w, page_h, body_html, extra_css=''):
    return f'''<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
@page {{
    size: {page_w}in {page_h}in landscape;
    margin: 0;
}}

* {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}}

body {{
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    background: #111111;
    color: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}}

.page-label {{
    position: absolute;
    top: 6px;
    right: 12px;
    font-size: 6pt;
    color: rgba(255,255,255,0.25);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    z-index: 10;
}}

.brochure-page {{
    width: {page_w}in;
    height: {page_h}in;
    display: flex;
    position: relative;
    overflow: hidden;
    page-break-after: always;
}}

.bg-layer {{
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    {bg_css}
    filter: grayscale(100%) contrast(1.1) brightness(0.9);
    opacity: 0.35;
}}

.fold-line {{
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(255,255,255,0.08);
    z-index: 5;
}}

{extra_css}

.panel {{
    height: {page_h}in;
    position: relative;
    z-index: 2;
    padding: 0.45in 0.35in;
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(255,255,255,0.05);
    overflow: hidden;
}}

.panel-watermark {{
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-size: cover;
    background-position: center;
    filter: grayscale(100%) contrast(1.1) brightness(0.9);
    opacity: 0.35;
    z-index: 0;
}}

.front-panel .panel-watermark {{
    opacity: 0.7;
    filter: grayscale(100%) contrast(1.15);
}}

.panel > *:not(.panel-watermark) {{
    position: relative;
    z-index: 1;
}}

.panel:last-child {{
    border-right: none;
}}

.front-panel {{
    background: linear-gradient(180deg, rgba(28,28,28,0.15) 0%, rgba(20,20,20,0.4) 50%, rgba(15,15,15,0.7) 100%);
    text-align: center;
    justify-content: center;
    align-items: center;
}}

.front-content {{
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}}

.company-name {{
    font-size: 20pt;
    font-weight: 900;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #fff;
    margin-bottom: 10px;
    line-height: 1.1;
}}

.credentials {{
    font-size: 6.5pt;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: {accent};
    margin-bottom: 16px;
    line-height: 1.5;
}}

.cred {{
    margin: 0 3px;
}}

.accent-line {{
    width: 50px;
    height: 2.5px;
    background: {accent};
    margin: 14px auto;
}}

.front-body-line {{
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.9);
    margin-bottom: 14px;
    line-height: 1.3;
}}

.tagline {{
    font-size: 12pt;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: {accent};
    margin-bottom: 20px;
    line-height: 1.3;
}}

.contact-block {{
    padding-top: 16px;
    border-top: 1px solid rgba(255,255,255,0.12);
}}

.phone {{
    font-size: 14pt;
    font-weight: 900;
    color: {accent};
    letter-spacing: 0.08em;
    margin-bottom: 3px;
}}

.website-text {{
    font-size: 9pt;
    font-weight: 700;
    color: {accent};
}}

.content-panel {{
    background: linear-gradient(180deg, rgba(30,30,30,0.55) 0%, rgba(22,22,22,0.65) 60%, rgba(18,18,18,0.75) 100%);
}}

.panel-header {{
    margin-bottom: 12px;
}}

.panel-title {{
    font-size: 11pt;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: {accent};
    margin-bottom: 3px;
    line-height: 1.2;
}}

.panel-subtitle {{
    font-size: 7.5pt;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #aaa;
    margin-bottom: 3px;
}}

.content-panel .accent-line {{
    width: 35px;
    margin: 8px 0;
}}

.panel-body {{
    flex: 1;
}}

.check-item {{
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-bottom: 5px;
    font-size: 8pt;
    line-height: 1.4;
    color: #fff;
}}

.ci {{
    color: {accent};
    font-weight: 700;
    flex-shrink: 0;
    margin-top: 1px;
}}

.body-text {{
    font-size: 8pt;
    line-height: 1.5;
    color: #ddd;
    margin-bottom: 5px;
}}

.highlights {{
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid rgba(255,255,255,0.07);
}}

.highlight {{
    font-size: 7pt;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: {accent};
    margin-bottom: 2px;
}}

.panel-footer {{
    margin-top: 8px;
    font-size: 6.5pt;
    color: #888;
    line-height: 1.4;
}}

.panel-phone {{
    margin-top: auto;
    padding-top: 8px;
    text-align: center;
    font-size: 7.5pt;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: {accent};
}}

.side-label {{
    position: absolute;
    bottom: 8px;
    left: 12px;
    font-size: 5.5pt;
    color: rgba(255,255,255,0.2);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    z-index: 10;
}}
</style>
</head>
<body>
{body_html}
</body>
</html>'''


def main():
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: generate-brochure-pdf.py <output-file>\n")
        sys.exit(1)

    output_file = sys.argv[1]

    raw = sys.stdin.read()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        sys.stderr.write(f"Invalid JSON input: {e}\n")
        sys.exit(1)

    html_content = generate_brochure_html(data)
    html_obj = HTML(string=html_content)
    html_obj.write_pdf(output_file)

    sys.stderr.write(f"PDF generated: {output_file}\n")
    print(json.dumps({"success": True, "file": output_file}))


if __name__ == '__main__':
    main()
