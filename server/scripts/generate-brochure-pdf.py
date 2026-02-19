#!/usr/bin/env python3
"""
Professional multi-column brochure PDF generator using WeasyPrint.
Takes JSON brochure data from stdin, outputs PDF to stdout or specified file.
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
MAX_IMAGE_SIZE = 20 * 1024 * 1024  # 20MB

def is_safe_url(url):
    """Check that URL is HTTPS and points to an allowed host, not a private IP."""
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
    """Download image and convert to data URI for embedding in PDF."""
    try:
        if not url:
            return ""
        if url.startswith('data:'):
            if len(url) > MAX_IMAGE_SIZE:
                sys.stderr.write("Data URI too large, skipping\n")
                return ""
            return url
        if not is_safe_url(url):
            sys.stderr.write(f"URL not allowed: {url[:100]}\n")
            return ""
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read(MAX_IMAGE_SIZE + 1)
            if len(data) > MAX_IMAGE_SIZE:
                sys.stderr.write("Image too large, skipping\n")
                return ""
            content_type = resp.headers.get('Content-Type', 'image/jpeg')
            b64 = base64.b64encode(data).decode('utf-8')
            return f"data:{content_type};base64,{b64}"
    except Exception as e:
        sys.stderr.write(f"Image fetch failed: {e}\n")
        return ""

def generate_brochure_html(data):
    """Generate professional multi-column brochure HTML with CSS."""
    company = data.get('companyName', 'Your Company')
    tagline = data.get('tagline', '')
    phone = data.get('phone', '')
    website = data.get('website', '')
    credentials = data.get('credentials', [])
    accent = data.get('accentColor', '#D4FF00')
    panels = data.get('panels', [])
    hero_url = data.get('heroImageUrl', '')
    layout = data.get('layout', 'tri-fold')

    hero_data_uri = fetch_image_as_data_uri(hero_url) if hero_url else ''

    num_panels = len(panels)
    if num_panels <= 3:
        col_count = num_panels
    elif num_panels <= 5:
        col_count = num_panels
    else:
        col_count = 5

    col_width = f"{100 / col_count:.2f}%"

    creds_html = ' &bull; '.join(f'<span class="cred">{c}</span>' for c in credentials)

    panels_html = []
    for i, panel in enumerate(panels):
        title = panel.get('title', '')
        subtitle = panel.get('subtitle', '')
        body_lines = panel.get('body', [])
        highlights = panel.get('highlights', [])
        footer = panel.get('footer', '')

        body_items = []
        for line in body_lines:
            line_stripped = line.lstrip()
            if line_stripped.startswith(('✔', '•', '-', '✓', '►')):
                clean = line_stripped.lstrip('✔•-✓► ')
                body_items.append(f'<div class="check-item"><span class="check-icon">✔</span><span>{clean}</span></div>')
            else:
                body_items.append(f'<p class="body-text">{line}</p>')

        highlight_html = ''
        if highlights:
            hl_items = ''.join(f'<p class="highlight">{h}</p>' for h in highlights)
            highlight_html = f'<div class="highlights">{hl_items}</div>'

        footer_html = f'<div class="panel-footer">{footer}</div>' if footer else ''

        if i == 0:
            panels_html.append(f'''
            <div class="panel front-panel">
                <div class="front-content">
                    <h1 class="company-name">{company}</h1>
                    <div class="credentials">{creds_html}</div>
                    <div class="accent-line"></div>
                    <p class="tagline">{tagline}</p>
                    {highlight_html}
                </div>
                <div class="contact-block">
                    <p class="phone">{phone}</p>
                    <p class="website">{website}</p>
                </div>
            </div>
            ''')
        else:
            subtitle_html = f'<p class="panel-subtitle">{subtitle}</p>' if subtitle else ''
            panels_html.append(f'''
            <div class="panel content-panel">
                <div class="panel-header">
                    <h2 class="panel-title">{title}</h2>
                    {subtitle_html}
                    <div class="accent-line"></div>
                </div>
                <div class="panel-body">
                    {"".join(body_items)}
                </div>
                {highlight_html}
                {footer_html}
                <div class="panel-phone">{phone}</div>
            </div>
            ''')

    bg_css = ''
    if hero_data_uri:
        bg_css = f'''
            background-image: url("{hero_data_uri}");
            background-size: cover;
            background-position: center;
        '''

    html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
@page {{
    size: 14in 8.5in landscape;
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

.brochure-page {{
    width: 14in;
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
    opacity: 0.15;
}}

.panel {{
    width: {col_width};
    height: 8.5in;
    position: relative;
    z-index: 2;
    padding: 0.5in 0.4in;
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(255,255,255,0.06);
}}

.panel:last-child {{
    border-right: none;
}}

/* Front Panel */
.front-panel {{
    background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.95) 100%);
    text-align: center;
    justify-content: center;
    align-items: center;
}}

.front-panel .bg-overlay {{
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    {bg_css}
    filter: grayscale(100%) contrast(1.2);
    opacity: 0.4;
    z-index: -1;
}}

.front-content {{
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}}

.company-name {{
    font-size: 22pt;
    font-weight: 900;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #fff;
    margin-bottom: 12px;
    line-height: 1.1;
}}

.credentials {{
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: {accent};
    margin-bottom: 20px;
}}

.cred {{
    margin: 0 4px;
}}

.accent-line {{
    width: 60px;
    height: 3px;
    background: {accent};
    margin: 16px auto;
}}

.tagline {{
    font-size: 14pt;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: {accent};
    margin-bottom: 24px;
    line-height: 1.3;
}}

.contact-block {{
    padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,0.15);
}}

.phone {{
    font-size: 16pt;
    font-weight: 900;
    color: #fff;
    letter-spacing: 0.1em;
    margin-bottom: 4px;
    text-shadow: 0 0 20px {accent}40;
}}

.website {{
    font-size: 10pt;
    font-weight: 700;
    color: {accent};
}}

/* Content Panels */
.content-panel {{
    background: linear-gradient(180deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.96) 100%);
}}

.panel-header {{
    margin-bottom: 16px;
}}

.panel-title {{
    font-size: 13pt;
    font-weight: 900;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: {accent};
    margin-bottom: 4px;
    line-height: 1.2;
}}

.panel-subtitle {{
    font-size: 8pt;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #aaa;
    margin-bottom: 4px;
}}

.content-panel .accent-line {{
    width: 40px;
    margin: 10px 0;
}}

.panel-body {{
    flex: 1;
}}

.check-item {{
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 8.5pt;
    line-height: 1.4;
    color: #fff;
}}

.check-icon {{
    color: {accent};
    font-weight: 700;
    flex-shrink: 0;
    margin-top: 1px;
}}

.body-text {{
    font-size: 8.5pt;
    line-height: 1.5;
    color: #ddd;
    margin-bottom: 6px;
}}

.highlights {{
    margin-top: 14px;
    padding-top: 10px;
    border-top: 1px solid rgba(255,255,255,0.08);
}}

.highlight {{
    font-size: 7.5pt;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: {accent};
    margin-bottom: 3px;
}}

.panel-footer {{
    margin-top: 10px;
    font-size: 7pt;
    color: #888;
    line-height: 1.4;
}}

.panel-phone {{
    margin-top: auto;
    padding-top: 10px;
    text-align: center;
    font-size: 8pt;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: {accent};
}}
</style>
</head>
<body>
<div class="brochure-page">
    <div class="bg-layer"></div>
    {"".join(panels_html)}
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
