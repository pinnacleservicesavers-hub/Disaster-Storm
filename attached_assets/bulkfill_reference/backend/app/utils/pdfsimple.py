
# Minimal PDF generator with basic formatting:
# - Fonts: Helvetica (F1), Helvetica-Bold (F2), Helvetica-Oblique (F3)
# - Parses a tiny subset of HTML: <b>/<strong>, <i>/<em>, <ul>/<ol>/<li>, <br>, <p>
# - Single page; wraps lines and switches fonts inline.

import re
from datetime import datetime

def _escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

def _tokenize_html(html: str):
    # Very small tokenizer: returns list of (type, value)
    tokens = []
    i=0
    while i < len(html):
        if html[i] == '<':
            j = html.find('>', i+1)
            if j == -1:
                tokens.append(("text", html[i:]))
                break
            tag = html[i+1:j].strip()
            tokens.append(("tag", tag))
            i = j+1
        else:
            j = html.find('<', i+1)
            if j == -1: j = len(html)
            tokens.append(("text", html[i:j]))
            i = j
    return tokens

def _segments_from_html(html: str):
    # Convert tiny HTML into a list of lines; each line is list of segments: (text, font)
    # font: "F1" normal, "F2" bold, "F3" italic
    bold=False; italic=False; in_ul=False; in_ol=False; ol_index=0
    lines=[[]]
    def current_font():
        if bold and italic: return "F2"  # prefer bold when both (simple)
        if bold: return "F2"
        if italic: return "F3"
        return "F1"
    tokens = _tokenize_html(html or "")
    for t, val in tokens:
        if t == "text":
            text = val.replace("\r","")
            parts = text.split("\n")
            for idx, part in enumerate(parts):
                if part:
                    lines[-1].append((part, current_font()))
                if idx < len(parts)-1:
                    lines.append([])
        else:
            tag = val.lower().strip()
            # closing tags
            if tag in ("/b","/strong"): bold=False
            elif tag in ("/i","/em"): italic=False
            elif tag == "br" or tag.startswith("br "): lines.append([])
            elif tag == "p" or tag.startswith("p "):
                if lines[-1]: lines.append([])
            elif tag == "/p":
                lines.append([]); lines.append([])
            elif tag == "b" or tag.startswith("b "): bold=True
            elif tag == "strong" or tag.startswith("strong "): bold=True
            elif tag == "i" or tag.startswith("i "): italic=True
            elif tag == "em" or tag.startswith("em "): italic=True
            elif tag == "ul" or tag.startswith("ul "): in_ul=True
            elif tag == "/ul": in_ul=False
            elif tag == "ol" or tag.startswith("ol "): in_ol=True; ol_index=0
            elif tag == "/ol": in_ol=False; ol_index=0
            elif tag == "li" or tag.startswith("li "):
                prefix = "• " if in_ul else (f"{ol_index+1}. " if in_ol else "- ")
                ol_index = ol_index + 1 if in_ol else ol_index
                if lines[-1]: lines.append([])
                lines[-1].append((prefix, "F1"))
            elif tag == "/li":
                lines.append([])
            # ignore other tags
    # trim trailing empty lines
    while lines and lines[-1]==[]:
        lines.pop()
    return lines

def make_pdf_html(title: str, html: str, footer_text: str = "") -> bytes:
    width, height = 612, 792
    margin = 72
    y = height - margin
    content_lines = []

    def add_text(x, y, text, font, size):
        return f"BT /{font} {size} Tf {int(x)} {int(y)} Td ({_escape(text)}) Tj ET"

    # Header
    content_lines.append(add_text(margin, y, title or "Letter", "F2", 18)); y -= 18+6
    date_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    content_lines.append(add_text(margin, y, f"Generated: {date_str}", "F1", 10)); y -= 10+8
    y_line_start = y

    # Body: wrap per line with word wrapping
    max_chars_per_line = 90  # rough; we're not measuring width precisely
    lines = _segments_from_html(html)

    def wrap_segment(text, limit):
        # naive wrap by spaces
        out=[]; cur=text
        while len(cur)>limit:
            cut = cur.rfind(" ",0,limit)
            if cut<int(limit*0.5): cut=limit
            out.append(cur[:cut])
            cur = cur[cut:].lstrip()
        out.append(cur)
        return out

    for segline in lines:
        if not segline:
            y -= 14
            continue
        # wrap per segment line
        pending=[("", "F1")]
        for text,font in segline:
            parts = wrap_segment(text, max_chars_per_line)
            for i,p in enumerate(parts):
                if i==0:
                    pending[-1]=(pending[-1][0]+p, pending[-1][1] if pending[-1][0] else font)
                else:
                    # flush pending line
                    if pending[-1][0]:
                        content_lines.append(add_text(margin, y, pending[-1][0], pending[-1][1], 12)); y -= 14
                    pending=[(p,font)]
        if pending and pending[-1][0]:
            content_lines.append(add_text(margin, y, pending[-1][0], pending[-1][1], 12)); y -= 14

        if y < margin+36:  # simplistic single page guard
            break

    # Footer
    if footer_text:
        content_lines.append(add_text(margin, margin-10+14, footer_text, "F3", 10))

    stream = ("\n".join(content_lines)).encode("latin-1","ignore")

    # Assemble PDF
    pdf=b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"
    offsets=[]

    def w(obj):
        offsets.append(len(pdf))

    # 1: Catalog
    w(1); pdf+=b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
    # 2: Pages
    w(2); pdf+=b"2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj\n"
    # 3: Page
    w(3); pdf+=f"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 {width} {height}] /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> /Contents 4 0 R >> endobj\n".encode()
    # 4: Contents
    w(4); pdf+=b"4 0 obj << /Length " + str(len(stream)).encode() + b" >> stream\n" + stream + b"\nendstream endobj\n"
    # 5: Font: Helvetica
    w(5); pdf+=b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
    # 6: Font: Helvetica-Bold
    w(6); pdf+=b"6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n"
    # 7: Font: Helvetica-Oblique
    w(7); pdf+=b"7 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >> endobj\n"

    xref_pos=len(pdf)
    pdf+=b"xref\n0 8\n0000000000 65535 f \n"
    # naive calculation of offsets based on previous chunks length
    # Recalculate properly
    chunks = pdf.split(b"endobj\n")
    # redo with tracked offsets:
    pdf=b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"
    obj_data=[
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
        b"2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj\n",
        f"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 {width} {height}] /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> /Contents 4 0 R >> endobj\n".encode(),
        b"4 0 obj << /Length " + str(len(stream)).encode() + b" >> stream\n" + stream + b"\nendstream endobj\n",
        b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
        b"6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n",
        b"7 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >> endobj\n",
    ]
    offs=[len(pdf)]
    for i,chunk in enumerate(obj_data):
        if i>0: offs.append(len(pdf))
        pdf+=chunk
    xref_pos=len(pdf)
    pdf+=b"xref\n0 8\n0000000000 65535 f \n"
    for off in offs:
        pdf+=f"{off:010d} 00000 n \n".encode()
    pdf+=b"trailer << /Size 8 /Root 1 0 R >>\nstartxref\n"+str(xref_pos).encode()+b"\n%%EOF"
    return pdf
