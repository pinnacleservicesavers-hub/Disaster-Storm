#!/usr/bin/env python3
"""
Professional 2-sided tri-fold brochure PDF generator using WeasyPrint.
Produces a 2-page PDF: Page 1 = Outside (front cover, back cover, flap), Page 2 = Inside (3 inner panels).
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
            b64 = base64.b64encode(data).decode('utf-8')
            return f"data:{content_type};base64,{b64}"
    except Exception as e:
        sys.stderr.write(f"Image fetch failed: {e}\n")
        return ""

def escape_html(text):
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def render_body_items(body_lines):
    items = []
    for line in body_lines:
        stripped = line.lstrip()
        if stripped.startswith(('\u2714', '\u2022', '-', '\u2713', '\u25ba')):
            clean = stripped.lstrip('\u2714\u2022-\u2713\u25ba ')
            items.append(f'<div class="check-item"><span class="ci">\u2714</span><span>{escape_html(clean)}</span></div>')
        else:
            items.append(f'<p class="body-text">{escape_html(line)}</p>')
    return '\n'.join(items)

def render_highlights(highlights):
    if not highlights:
        return ''
    hl = '\n'.join(f'<p class="highlight">{escape_html(h)}</p>' for h in highlights)
    return f'<div class="highlights">{hl}</div>'

def render_panel(panel, accent, is_front=False, company='', tagline='', phone='', website='', creds_html='', extra_class=''):
    title = panel.get('title', '')
    subtitle = panel.get('subtitle', '')
    body = panel.get('body', [])
    highlights = panel.get('highlights', [])
    footer = panel.get('footer', '')
    cls = f' {extra_class}' if extra_class else ''

    if is_front:
        return f'''
        <div class="panel front-panel{cls}">
            <div class="front-content">
                <h1 class="company-name">{escape_html(company)}</h1>
                <div class="credentials">{creds_html}</div>
                <div class="accent-line"></div>
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

    outside_panels = data.get('outsidePanels', [])
    inside_panels = data.get('insidePanels', [])

    if not outside_panels and not inside_panels:
        old_panels = data.get('panels', [])
        if old_panels:
            outside_panels = old_panels[:3] if len(old_panels) >= 3 else old_panels
            inside_panels = old_panels[3:6] if len(old_panels) > 3 else []
            while len(outside_panels) < 3:
                outside_panels.append({'title': '', 'body': [], 'highlights': []})
            while len(inside_panels) < 3:
                inside_panels.append({'title': '', 'body': [], 'highlights': []})

    hero_data_uri = fetch_image_as_data_uri(hero_url) if hero_url else ''

    creds_html = ' &bull; '.join(f'<span class="cred">{escape_html(c)}</span>' for c in credentials)

    bg_css = ''
    if hero_data_uri:
        bg_css = f'background-image: url("{hero_data_uri}"); background-size: cover; background-position: center;'

    # Outside: print order is [inside_flap, back_cover, front_cover] left-to-right
    # When folded: front_cover is visible on the right, flap tucks inside
    outside_order = []
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

    # Print layout outside: flap (left, narrower) | back (center) | front (right)
    outside_html = render_panel(flap_panel, accent, is_front=False, phone=phone, extra_class='flap-panel')
    outside_html += render_panel(back_panel, accent, is_front=False, phone=phone, extra_class='back-panel')
    outside_html += render_panel(front_panel, accent, is_front=True,
                                  company=company, tagline=tagline, phone=phone,
                                  website=website, creds_html=creds_html, extra_class='front-panel-outer')

    # Inside: left | center | right
    inside_html = ''
    for p in inside_panels[:3]:
        inside_html += render_panel(p, accent, is_front=False, phone=phone)
    while len(inside_panels) < 3:
        inside_html += '<div class="panel content-panel"></div>'
        inside_panels.append({})

    html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
@page {{
    size: 11in 8.5in landscape;
    margin: 0;
}}

* {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}}

body {{
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    background: #000;
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
    width: 11in;
    height: 8.5in;
    display: flex;
    position: relative;
    overflow: hidden;
    page-break-after: always;
}}

.bg-layer {{
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    {bg_css}
    filter: grayscale(100%) contrast(1.2);
    opacity: 0.12;
}}

/* Fold guides */
.fold-line {{
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(255,255,255,0.08);
    z-index: 5;
}}
.fold-1 {{ left: 3.625in; }}
.fold-2 {{ left: 7.3125in; }}
.fold-inside-1 {{ left: 3.6875in; }}
.fold-inside-2 {{ left: 7.375in; }}

/* Panel sizing for outside: flap is slightly narrower */
.flap-panel {{
    width: 3.5in;
}}
.back-panel,
.front-panel-outer {{
    width: 3.75in;
}}

/* Panel sizing for inside: equal thirds */
.inside-page .panel {{
    width: 3.6667in;
}}

.panel {{
    height: 8.5in;
    position: relative;
    z-index: 2;
    padding: 0.45in 0.35in;
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(255,255,255,0.05);
    overflow: hidden;
}}

.panel:last-child {{
    border-right: none;
}}

/* Front Panel */
.front-panel {{
    background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.95) 100%);
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
    color: #fff;
    letter-spacing: 0.08em;
    margin-bottom: 3px;
}}

.website-text {{
    font-size: 9pt;
    font-weight: 700;
    color: {accent};
}}

/* Content Panels */
.content-panel {{
    background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.96) 100%);
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

/* Side label */
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

<!-- PAGE 1: OUTSIDE (what you see when brochure is folded) -->
<!-- Print order left-to-right: Inside Flap | Back Cover | Front Cover -->
<div class="brochure-page outside-page">
    <div class="bg-layer"></div>
    <div class="fold-line fold-1"></div>
    <div class="fold-line fold-2"></div>
    <span class="page-label">Outside &mdash; Page 1 of 2</span>
    <span class="side-label">&larr; Flap &nbsp;&nbsp;|&nbsp;&nbsp; Back Cover &nbsp;&nbsp;|&nbsp;&nbsp; Front Cover &rarr;</span>
    {outside_html}
</div>

<!-- PAGE 2: INSIDE (what you see when brochure is opened flat) -->
<div class="brochure-page inside-page">
    <div class="bg-layer"></div>
    <div class="fold-line fold-inside-1"></div>
    <div class="fold-line fold-inside-2"></div>
    <span class="page-label">Inside &mdash; Page 2 of 2</span>
    <span class="side-label">&larr; Inside Left &nbsp;&nbsp;|&nbsp;&nbsp; Inside Center &nbsp;&nbsp;|&nbsp;&nbsp; Inside Right &rarr;</span>
    {inside_html}
</div>

</body>
</html>'''

    return html


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
