#!/usr/bin/env python3
"""
OpsFlow Enterprise Platform - Professional PDF Documentation Generator
Builds a complete, multi-page vector PDF specification manual using standard Python.
"""

import sys
import zlib
import os
import datetime

class PDFBuilder:
    def __init__(self, page_width=595.28, page_height=841.89): # Standard A4 (points)
        self.width = page_width
        self.height = page_height
        self.pages = [] # List of stream content strings
        self.objects = []
        self.margin_x = 45
        self.margin_top = 45
        self.margin_bottom = 45

    def add_page(self):
        page = PageContent(self.width, self.height, self.margin_x, self.margin_top, self.margin_bottom)
        self.pages.append(page)
        return page

    def build_pdf(self, output_path):
        # We need:
        # 1. Catalog
        # 2. Pages object
        # 3. Fonts (/F1 = Helvetica, /F2 = Helvetica-Bold, /F3 = Helvetica-Oblique, /F4 = Courier, /F5 = Courier-Bold)
        # 4. Page objects
        # 5. Content streams
        
        objects = []
        
        def add_obj(data):
            objects.append(data)
            return len(objects)

        # Reserve object slots
        # Obj 1: Catalog
        # Obj 2: Pages
        # Obj 3: Font F1 (Helvetica)
        # Obj 4: Font F2 (Helvetica-Bold)
        # Obj 5: Font F3 (Helvetica-Oblique)
        # Obj 6: Font F4 (Courier)
        # Obj 7: Font F5 (Courier-Bold)
        
        # We'll fill later
        num_reserved = 7
        for _ in range(num_reserved):
            objects.append(None)
            
        page_obj_ids = []
        content_obj_ids = []
        
        total_pages = len(self.pages)
        
        for i, page in enumerate(self.pages):
            # Add page header/footer
            page.render_footer(i + 1, total_pages)
            raw_content = page.get_stream()
            compressed = zlib.compress(raw_content.encode('latin1'))
            
            stream_id = add_obj({
                'type': 'stream',
                'dict': f"<< /Length {len(compressed)} /Filter /FlateDecode >>",
                'data': compressed
            })
            content_obj_ids.append(stream_id)
            
            page_id = add_obj({
                'type': 'page',
                'dict': f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {self.width} {self.height}] /Contents {stream_id} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R /F5 7 0 R >> >> >>"
            })
            page_obj_ids.append(page_id)
            
        # 1. Catalog
        objects[0] = {'type': 'catalog', 'dict': "<< /Type /Catalog /Pages 2 0 R >>"}
        
        # 2. Pages
        kids_str = " ".join([f"{pid} 0 R" for pid in page_obj_ids])
        objects[1] = {'type': 'pages', 'dict': f"<< /Type /Pages /Kids [{kids_str}] /Count {len(page_obj_ids)} >>"}
        
        # Fonts
        objects[2] = {'type': 'font', 'dict': "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"}
        objects[3] = {'type': 'font', 'dict': "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"}
        objects[4] = {'type': 'font', 'dict': "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>"}
        objects[5] = {'type': 'font', 'dict': "<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>"}
        objects[6] = {'type': 'font', 'dict': "<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>"}
        
        # Serialize to binary PDF
        out = bytearray()
        out.extend(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        
        xref_offsets = []
        
        for i, obj in enumerate(objects):
            offset = len(out)
            xref_offsets.append(offset)
            obj_num = i + 1
            
            if obj['type'] == 'stream':
                header = f"{obj_num} 0 obj\n{obj['dict']}\nstream\n".encode('latin1')
                footer = b"\nendstream\nendobj\n"
                out.extend(header)
                out.extend(obj['data'])
                out.extend(footer)
            else:
                body = f"{obj_num} 0 obj\n{obj['dict']}\nendobj\n".encode('latin1')
                out.extend(body)
                
        xref_offset = len(out)
        out.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode('latin1'))
        for off in xref_offsets:
            out.extend(f"{off:010d} 00000 n \n".encode('latin1'))
            
        trailer = (
            f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF\n"
        )
        out.extend(trailer.encode('latin1'))
        
        with open(output_path, 'wb') as f:
            f.write(out)
        print(f"[PDF] Successfully created {output_path} ({len(out)} bytes, {total_pages} pages)")


class PageContent:
    def __init__(self, width, height, margin_x, margin_top, margin_bottom):
        self.width = width
        self.height = height
        self.margin_x = margin_x
        self.margin_top = margin_top
        self.margin_bottom = margin_bottom
        self.cursor_y = height - margin_top
        self.stream = []
        
    def escape_text(self, text):
        return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

    def set_color_rgb(self, r, g, b, is_fill=True):
        cmd = "rg" if is_fill else "RG"
        self.stream.append(f"{r:.3f} {g:.3f} {b:.3f} {cmd}")

    def draw_rect(self, x, y, w, h, fill_rgb=None, stroke_rgb=None, line_width=1):
        self.stream.append("q")
        if stroke_rgb:
            self.set_color_rgb(*stroke_rgb, is_fill=False)
            self.stream.append(f"{line_width} w")
        if fill_rgb:
            self.set_color_rgb(*fill_rgb, is_fill=True)
            
        op = "B" if (fill_rgb and stroke_rgb) else ("f" if fill_rgb else "S")
        self.stream.append(f"{x:.2f} {y:.2f} {w:.2f} {h:.2f} re {op}")
        self.stream.append("Q")

    def draw_rounded_rect(self, x, y, w, h, r=4, fill_rgb=None, stroke_rgb=None, line_width=1):
        # Approximate rounded rect or rect
        self.draw_rect(x, y, w, h, fill_rgb, stroke_rgb, line_width)

    def draw_line(self, x1, y1, x2, y2, stroke_rgb=(0.8, 0.85, 0.9), line_width=1):
        self.stream.append("q")
        self.set_color_rgb(*stroke_rgb, is_fill=False)
        self.stream.append(f"{line_width} w")
        self.stream.append(f"{x1:.2f} {y1:.2f} m {x2:.2f} {y2:.2f} l S")
        self.stream.append("Q")

    def text(self, x, y, text, font="/F1", size=10, rgb=(0.1, 0.15, 0.2)):
        safe = self.escape_text(text)
        self.stream.append("BT")
        self.set_color_rgb(*rgb, is_fill=True)
        self.stream.append(f"{font} {size} Tf")
        self.stream.append(f"{x:.2f} {y:.2f} Td")
        self.stream.append(f"({safe}) Tj")
        self.stream.append("ET")

    def add_heading1(self, text, icon=""):
        self.cursor_y -= 22
        full_text = f"{icon} {text}" if icon else text
        self.text(self.margin_x, self.cursor_y, full_text, font="/F2", size=15, rgb=(0.06, 0.1, 0.18))
        self.cursor_y -= 6
        self.draw_line(self.margin_x, self.cursor_y, self.width - self.margin_x, self.cursor_y, stroke_rgb=(0.82, 0.86, 0.92), line_width=1.5)
        self.cursor_y -= 12

    def add_heading2(self, text):
        self.cursor_y -= 14
        self.text(self.margin_x, self.cursor_y, text, font="/F2", size=11.5, rgb=(0.12, 0.18, 0.28))
        self.cursor_y -= 8

    def add_heading3(self, text):
        self.cursor_y -= 10
        self.text(self.margin_x, self.cursor_y, text, font="/F2", size=9.5, rgb=(0.2, 0.28, 0.4))
        self.cursor_y -= 6

    def add_paragraph(self, text, font="/F1", size=8.5, rgb=(0.2, 0.25, 0.32), line_height=12):
        # Simple word wrapper
        max_width = self.width - (2 * self.margin_x)
        # Approximate 5.0 points per char at size 8.5
        char_limit = int(max_width / (size * 0.52))
        words = text.split()
        lines = []
        curr = []
        curr_len = 0
        
        for w in words:
            if curr_len + len(w) + 1 <= char_limit:
                curr.append(w)
                curr_len += len(w) + 1
            else:
                lines.append(" ".join(curr))
                curr = [w]
                curr_len = len(w)
        if curr:
            lines.append(" ".join(curr))
            
        for line in lines:
            self.cursor_y -= line_height
            self.text(self.margin_x, self.cursor_y, line, font=font, size=size, rgb=rgb)
        self.cursor_y -= 4

    def add_bullet(self, title, body, size=8.5):
        max_width = self.width - (2 * self.margin_x) - 16
        char_limit = int(max_width / (size * 0.52))
        
        self.cursor_y -= 12
        # Bullet dot
        self.draw_rect(self.margin_x + 3, self.cursor_y + 3, 3, 3, fill_rgb=(0.2, 0.45, 0.9))
        
        # Title in bold
        safe_title = self.escape_text(title)
        self.text(self.margin_x + 12, self.cursor_y, title, font="/F2", size=size, rgb=(0.08, 0.12, 0.2))
        
        # Title width approx
        title_width = len(title) * (size * 0.55)
        
        # Word wrap body
        full_text = body
        words = full_text.split()
        lines = []
        curr = []
        curr_len = 0
        for w in words:
            if curr_len + len(w) + 1 <= char_limit:
                curr.append(w)
                curr_len += len(w) + 1
            else:
                lines.append(" ".join(curr))
                curr = [w]
                curr_len = len(w)
        if curr:
            lines.append(" ".join(curr))
            
        for idx, line in enumerate(lines):
            if idx > 0:
                self.cursor_y -= 11
            self.text(self.margin_x + 12, self.cursor_y - (0 if idx > 0 else 11), line if idx > 0 else line, font="/F1", size=size, rgb=(0.25, 0.3, 0.38))
            
        self.cursor_y -= 11

    def add_callout(self, text, title="NOTE", style="info"):
        colors = {
            "info": {"bg": (0.94, 0.97, 1.0), "border": (0.2, 0.5, 0.95), "text": (0.1, 0.25, 0.65)},
            "success": {"bg": (0.94, 0.99, 0.95), "border": (0.1, 0.7, 0.35), "text": (0.08, 0.45, 0.2)},
            "warning": {"bg": (1.0, 0.98, 0.92), "border": (0.95, 0.65, 0.1), "text": (0.55, 0.35, 0.05)},
        }
        c = colors.get(style, colors["info"])
        
        w = self.width - (2 * self.margin_x)
        # Approximate height
        words = text.split()
        char_limit = int((w - 20) / 4.2)
        line_count = max(1, len(text) // char_limit + 1)
        box_h = 24 + (line_count * 11)
        
        self.cursor_y -= box_h + 4
        box_y = self.cursor_y
        
        # Background
        self.draw_rect(self.margin_x, box_y, w, box_h, fill_rgb=c["bg"], stroke_rgb=None)
        # Left accent bar
        self.draw_rect(self.margin_x, box_y, 4, box_h, fill_rgb=c["border"], stroke_rgb=None)
        
        # Title
        self.text(self.margin_x + 12, box_y + box_h - 14, title, font="/F2", size=8.5, rgb=c["text"])
        
        # Text wrapping
        lines = []
        curr = []
        curr_len = 0
        for wd in words:
            if curr_len + len(wd) + 1 <= char_limit:
                curr.append(wd)
                curr_len += len(wd) + 1
            else:
                lines.append(" ".join(curr))
                curr = [wd]
                curr_len = len(wd)
        if curr:
            lines.append(" ".join(curr))
            
        cur_text_y = box_y + box_h - 26
        for line in lines:
            self.text(self.margin_x + 12, cur_text_y, line, font="/F1", size=8.0, rgb=(0.15, 0.2, 0.3))
            cur_text_y -= 11
            
        self.cursor_y -= 6

    def add_table(self, headers, rows, col_widths):
        total_w = sum(col_widths)
        start_x = self.margin_x
        row_h = 18
        
        # Header Row
        self.cursor_y -= row_h + 4
        h_y = self.cursor_y
        self.draw_rect(start_x, h_y, total_w, row_h, fill_rgb=(0.93, 0.95, 0.98), stroke_rgb=(0.78, 0.83, 0.9), line_width=0.8)
        
        cur_x = start_x
        for i, h in enumerate(headers):
            self.text(cur_x + 6, h_y + 5, h, font="/F2", size=7.8, rgb=(0.08, 0.12, 0.2))
            cur_x += col_widths[i]
            if i < len(headers) - 1:
                self.draw_line(cur_x, h_y, cur_x, h_y + row_h, stroke_rgb=(0.78, 0.83, 0.9), line_width=0.8)
                
        # Data Rows
        for r_idx, row in enumerate(rows):
            self.cursor_y -= row_h
            r_y = self.cursor_y
            bg = (0.98, 0.99, 1.0) if r_idx % 2 == 1 else (1.0, 1.0, 1.0)
            self.draw_rect(start_x, r_y, total_w, row_h, fill_rgb=bg, stroke_rgb=(0.85, 0.88, 0.92), line_width=0.6)
            
            cur_x = start_x
            for c_idx, val in enumerate(row):
                # Check if it's code/badge
                f_type = "/F4" if val.startswith("/") or val.startswith("POST") or val.startswith("GET") or val.startswith("npm") else "/F1"
                self.text(cur_x + 6, r_y + 5, val, font=f_type, size=7.5, rgb=(0.18, 0.22, 0.3))
                cur_x += col_widths[c_idx]
                if c_idx < len(row) - 1:
                    self.draw_line(cur_x, r_y, cur_x, r_y + row_h, stroke_rgb=(0.85, 0.88, 0.92), line_width=0.6)
                    
        self.cursor_y -= 8

    def add_code_box(self, code_lines):
        box_h = (len(code_lines) * 11.5) + 16
        self.cursor_y -= box_h + 4
        b_y = self.cursor_y
        w = self.width - (2 * self.margin_x)
        
        # Dark Terminal Background
        self.draw_rect(self.margin_x, b_y, w, box_h, fill_rgb=(0.06, 0.08, 0.13), stroke_rgb=(0.2, 0.25, 0.35), line_width=0.8)
        
        # Top terminal bar
        self.draw_rect(self.margin_x, b_y + box_h - 12, w, 12, fill_rgb=(0.1, 0.13, 0.2), stroke_rgb=None)
        self.draw_rect(self.margin_x + 6, b_y + box_h - 8, 4, 4, fill_rgb=(0.95, 0.35, 0.35))
        self.draw_rect(self.margin_x + 13, b_y + box_h - 8, 4, 4, fill_rgb=(0.95, 0.75, 0.25))
        self.draw_rect(self.margin_x + 20, b_y + box_h - 8, 4, 4, fill_rgb=(0.25, 0.85, 0.45))
        self.text(self.margin_x + 30, b_y + box_h - 9, "bash / terminal", font="/F4", size=6.5, rgb=(0.6, 0.65, 0.75))
        
        cur_y = b_y + box_h - 23
        for line in code_lines:
            c = (0.2, 0.75, 0.95) if line.startswith("$") or line.startswith("#") else (0.85, 0.9, 0.95)
            if line.startswith("#"):
                c = (0.45, 0.55, 0.65)
            self.text(self.margin_x + 10, cur_y, line, font="/F4", size=7.2, rgb=c)
            cur_y -= 11.5
            
        self.cursor_y -= 8

    def render_footer(self, page_num, total_pages):
        # Footer line
        y = self.margin_bottom - 12
        self.draw_line(self.margin_x, y + 10, self.width - self.margin_x, y + 10, stroke_rgb=(0.85, 0.88, 0.92), line_width=0.8)
        self.text(self.margin_x, y, "NexusCloud OpsFlow Enterprise Platform &bull; v2.4.0-LTS", font="/F1", size=7.0, rgb=(0.5, 0.55, 0.65))
        self.text(self.width - self.margin_x - 55, y, f"Page {page_num} of {total_pages}", font="/F2", size=7.0, rgb=(0.4, 0.45, 0.55))

    def get_stream(self):
        return "\n".join(self.stream)


def generate_full_opsflow_pdf(output_path):
    pdf = PDFBuilder()
    
    # =========================================================================
    # PAGE 1: COVER PAGE
    # =========================================================================
    p1 = pdf.add_page()
    
    # Top Decorative Banner
    p1.draw_rect(p1.margin_x, p1.height - 40, p1.width - (2 * p1.margin_x), 6, fill_rgb=(0.15, 0.45, 0.95))
    
    p1.cursor_y = p1.height - 85
    
    # System Tag
    p1.draw_rect(p1.margin_x, p1.cursor_y, 190, 18, fill_rgb=(0.92, 0.96, 1.0), stroke_rgb=(0.7, 0.82, 0.98), line_width=0.8)
    p1.text(p1.margin_x + 8, p1.cursor_y + 5, "OPSFLOW ENTERPRISE SPECIFICATION", font="/F2", size=7.5, rgb=(0.1, 0.35, 0.85))
    
    p1.cursor_y -= 45
    p1.text(p1.margin_x, p1.cursor_y, "NexusCloud OpsFlow", font="/F2", size=26, rgb=(0.06, 0.1, 0.2))
    p1.cursor_y -= 18
    p1.text(p1.margin_x, p1.cursor_y, "Next-Gen Enterprise Task Orchestration & SRE Platform", font="/F2", size=13, rgb=(0.25, 0.35, 0.5))
    
    p1.cursor_y -= 25
    p1.add_paragraph("Comprehensive Technical Architecture, Functional Capability Matrix, System Workflows, Security Specifications & Deployment Manual.", size=9.5, rgb=(0.3, 0.35, 0.45), line_height=14)
    
    p1.cursor_y -= 10
    p1.add_callout(
        "100% FREE & ZERO-COST GUARANTEE: OpsFlow is fully localized and architected to run with zero recurring cloud subscription costs, zero third-party AI tokens, and zero vendor lock-in.",
        title="ZERO-COST CLOUD ALTERNATIVE",
        style="success"
    )
    
    p1.cursor_y -= 15
    # Executive Meta Grid (2x3 cards)
    meta_box_y = p1.cursor_y - 120
    meta_w = p1.width - (2 * p1.margin_x)
    p1.draw_rect(p1.margin_x, meta_box_y, meta_w, 120, fill_rgb=(0.97, 0.98, 1.0), stroke_rgb=(0.85, 0.88, 0.94), line_width=1)
    
    # Grid items
    col1_x = p1.margin_x + 15
    col2_x = p1.margin_x + (meta_w / 2) + 10
    
    items = [
        ("Platform Version", "v2.4.0-LTS Production Release", "System Classification", "Distributed Engineering & SRE Command"),
        ("Frontend Architecture", "Next.js 14, React 18, Tailwind CSS", "Backend Core", "Node.js 20+, Express, Prisma ORM, WebSockets"),
        ("Security Standard", "Zero-Trust TOTP 2FA & Audit Trail", "Intelligence Layer", "Local Heuristic SRE AI Copilot")
    ]
    
    cur_row_y = meta_box_y + 90
    for l1, v1, l2, v2 in items:
        p1.text(col1_x, cur_row_y + 10, l1.upper(), font="/F2", size=6.5, rgb=(0.45, 0.5, 0.6))
        p1.text(col1_x, cur_row_y, v1, font="/F2", size=8.0, rgb=(0.1, 0.15, 0.25))
        
        p1.text(col2_x, cur_row_y + 10, l2.upper(), font="/F2", size=6.5, rgb=(0.45, 0.5, 0.6))
        p1.text(col2_x, cur_row_y, v2, font="/F2", size=8.0, rgb=(0.1, 0.15, 0.25))
        cur_row_y -= 36
        
    p1.cursor_y = meta_box_y - 25
    p1.add_paragraph("Confidential & Technical Documentation &bull; Released by NexusCloud Systems Group &bull; Local Access: Frontend http://localhost:3000 | Backend http://localhost:5001", size=7.5, rgb=(0.45, 0.5, 0.6))

    # =========================================================================
    # PAGE 2: EXECUTIVE SUMMARY & TECH STACK
    # =========================================================================
    p2 = pdf.add_page()
    p2.add_heading1("1. Executive Summary & Problem Statement")
    
    p2.add_paragraph("Modern engineering and infrastructure teams face acute operational friction caused by fragmented tools: tasks are tracked in Jira/Linear, production outages in PagerDuty/Slack, automated jobs in custom scripts, and team analytics in disconnected business intelligence spreadsheets. Furthermore, enterprise SaaS toolchains impose massive, recurring per-seat subscription costs.", size=8.5)
    
    p2.add_paragraph("NexusCloud OpsFlow bridges these divides by delivering an all-in-one, enterprise-grade engineering command platform with real-time multi-user task orchestration, live SRE incident war rooms, no-code workflow automation, and localized AI intelligence running entirely on free and local infrastructure.", size=8.5)
    
    p2.add_heading2("Key Value Propositions")
    p2.add_bullet("Zero Cloud Costs:", "Runs 100% on local hardware, SQLite/Postgres databases, and local AI with zero cloud bills.")
    p2.add_bullet("Sub-Millisecond Collaboration:", "Full-duplex WebSocket bus keeps tasks, active war rooms, and presence synced in real time.")
    p2.add_bullet("SRE War Room Command:", "Live outage response with severity scoring (SEV-1 to SEV-4), event timelines, and post-mortems.")
    p2.add_bullet("Zero-Trust Security & 2FA:", "RFC 6238 TOTP two-factor authentication, remote session termination, and immutable audit logs.")
    p2.add_bullet("Local AI SRE Copilot:", "Diagnostic root-cause reasoning, incident triage, and natural language SQL query translation.")

    p2.add_heading1("2. Complete Technical Stack Matrix")
    
    tech_headers = ["Layer", "Technology", "Architectural Role & Description"]
    tech_rows = [
        ["Frontend UI", "Next.js 14 / React 18", "App Router, SSR, responsive components, TypeScript type-safety."],
        ["Styling & UX", "Tailwind CSS + Lucide", "Modern dark & high-contrast light modes, glassmorphism, fluid typography."],
        ["Real-Time Client", "Socket.IO Client", "Low-latency bidirectional WebSocket events for tasks, chat, and alerts."],
        ["API Gateway", "Express.js / Node.js 20+", "Modular controllers, centralized error handling, and rate limiting."],
        ["Persistence", "Prisma ORM & SQLite", "Type-safe database abstraction, migrations, ACID transactions."],
        ["Security & Auth", "JWT + Speakeasy TOTP", "Stateless tokens, bcrypt password hashing, 2FA, session tracking."],
        ["Automation", "Event-Driven Engine", "Rule evaluator for task triggers, condition filters, and multi-actions."],
        ["AI Copilot", "Local Inference Engine", "Deterministic SRE root-cause analysis, post-mortem generator."],
        ["API Docs", "OpenAPI 3.0 / Swagger", "Interactive documentation console hosted at /api-docs and root portal."]
    ]
    p2.add_table(tech_headers, tech_rows, [85, 120, 300])

    # =========================================================================
    # PAGE 3: SYSTEM ARCHITECTURE & DATA FLOW
    # =========================================================================
    p3 = pdf.add_page()
    p3.add_heading1("3. System Architecture & How It Works")
    
    p3.add_paragraph("OpsFlow is architected according to clean multi-layered domain principles, ensuring strict isolation between user interfaces, security middleware, business domains, and persistence layers.", size=8.5)
    
    # Architecture Visual Box
    p3.cursor_y -= 8
    arch_box_y = p3.cursor_y - 145
    p3.draw_rect(p3.margin_x, arch_box_y, p3.width - (2 * p3.margin_x), 145, fill_rgb=(0.96, 0.98, 1.0), stroke_rgb=(0.8, 0.85, 0.94), line_width=1)
    
    layers = [
        ("1. CLIENT PRESENTATION (Port 3000)", "Next.js App Router | Kanban Boards | SRE War Room | AI Assistant Drawer | Linear Vim-Hotkeys", (0.15, 0.45, 0.9)),
        ("2. GATEWAY & ZERO-TRUST MIDDLEWARE (Port 5001)", "Helmet Headers | Global Rate Limiter | JWT Auth Guard | Tenant Org Filter | Audit Logger", (0.5, 0.25, 0.8)),
        ("3. DOMAIN SERVICES & EVENT DISPATCHER", "Task Services | Incident Escalation | Workflow Automation Engine | Local SRE AI Copilot", (0.85, 0.5, 0.1)),
        ("4. PERSISTENCE & REAL-TIME EVENT BUS", "Prisma ORM | SQLite (dev.db) / Postgres | Socket.IO Server Engine | Local Storage Volume", (0.1, 0.65, 0.35))
    ]
    
    l_y = arch_box_y + 110
    for title, desc, color in layers:
        p3.draw_rect(p3.margin_x + 10, l_y, p3.width - (2 * p3.margin_x) - 20, 26, fill_rgb=(1.0, 1.0, 1.0), stroke_rgb=(0.85, 0.88, 0.94), line_width=0.8)
        p3.draw_rect(p3.margin_x + 10, l_y, 4, 26, fill_rgb=color)
        p3.text(p3.margin_x + 20, l_y + 15, title, font="/F2", size=7.5, rgb=(0.1, 0.15, 0.25))
        p3.text(p3.margin_x + 20, l_y + 5, desc, font="/F1", size=6.8, rgb=(0.4, 0.45, 0.55))
        l_y -= 34
        
    p3.cursor_y = arch_box_y - 15
    
    p3.add_heading2("3.1 End-to-End Data & Execution Lifecycle")
    p3.add_bullet("1. Client Dispatch:", "Engineer submits a task mutation or initiates an incident triage action from the UI.")
    p3.add_bullet("2. Security Guard:", "Gateway validates JWT, verifies user permissions, checks rate limits, and scopes tenant ID.")
    p3.add_bullet("3. ACID Persistence:", "Prisma ORM executes database write and simultaneously inserts an immutable Audit Log entry.")
    p3.add_bullet("4. Workflow Automation:", "Domain event triggers the Automation Engine to evaluate rules and fire automated actions.")
    p3.add_bullet("5. WebSocket Broadcast:", "Socket.IO server emits real-time payloads to all connected organization members.")

    p3.add_heading2("3.2 Zero-Trust Security & Session Governance")
    p3.add_paragraph("OpsFlow implements zero-trust principles with SHA-256 JWT sessions, RFC 6238 TOTP two-factor authentication, and active session device management allowing one-click remote session revocation.", size=8.5)

    # =========================================================================
    # PAGE 4: DETAILED CAPABILITIES & FEATURE BREAKDOWN
    # =========================================================================
    p4 = pdf.add_page()
    p4.add_heading1("4. Comprehensive Platform Features")

    p4.add_heading2("4.1 Enterprise Task & Project Orchestration")
    p4.add_bullet("Dual Layout Engine:", "Interactive Kanban Boards with drag-and-drop columns alongside dense Data Grid tables.")
    p4.add_bullet("Bulk Operations Toolbar:", "Multi-select tasks to batch change status, reassign engineers, or adjust priority in seconds.")
    p4.add_bullet("Priority & SLA Management:", "Granular priority scoring (Low, Medium, High, Urgent) with due-date alerts.")

    p4.add_heading2("4.2 Live SRE Incident War Room & Outage Command")
    p4.add_bullet("Severity Categorization:", "Structured SEV-1 (Critical Outage) to SEV-4 (Minor Glitch) with live SLA countdowns.")
    p4.add_bullet("Collaborative Incident Modal:", "Live war room chat, chronological timeline markers, and real-time active responder presence.")
    p4.add_bullet("Automated Post-Mortem:", "Captures root cause analysis and computes Mean Time to Detect (MTTD) and Resolve (MTTR).")

    p4.add_heading2("4.3 Event-Driven Workflow Automation Engine")
    p4.add_paragraph("Empowers engineering managers to build automated triggers without writing code:", size=8.5)
    
    auto_headers = ["Trigger Event", "Condition Filter", "Automated Action Executed"]
    auto_rows = [
        ["task_created", "priority == 'URGENT'", "Notify Lead On-Call SRE & assign to SRE Team."],
        ["incident_opened", "severity == 'SEV_1'", "Broadcast War Room notification & create emergency tracking task."],
        ["status_changed", "status == 'DONE'", "Log compliance completion event in Audit Trail & notify reviewer."]
    ]
    p4.add_table(auto_headers, auto_rows, [100, 130, 275])

    p4.add_heading2("4.4 Local SRE AI Copilot & Query Assistant")
    p4.add_bullet("Zero Cloud Dependencies:", "100% free, local AI assistant operating without third-party API keys or subscription fees.")
    p4.add_bullet("Incident Root Cause Analysis:", "Automated diagnostic playbooks (memory leak checks, lock detection, timeout triage).")
    p4.add_bullet("Natural Language SQL:", "Translates plain text queries into structured task and incident filters.")

    p4.add_heading2("4.5 Power-User Linear & Vim Hotkeys")
    p4.add_bullet("Single-Key Hotkeys:", "Press C to create task, A for AI Copilot, ? for hotkey cheatsheet.")
    p4.add_bullet("Two-Key Vim Navigation:", "GD (Dashboard), GT (Tasks), GI (Incidents), GW (Automations), GA (Analytics), GS (Settings).")

    # =========================================================================
    # PAGE 5: SETUP GUIDE & API REFERENCE
    # =========================================================================
    p5 = pdf.add_page()
    p5.add_heading1("5. Quickstart & Deployment Guide")
    
    p5.add_paragraph("OpsFlow is designed to be set up locally in under 2 minutes with zero external database configuration:", size=8.5)
    
    code_steps = [
        "# 1. Clone workspace and setup backend",
        "$ cd opsflow/backend",
        "$ npm install",
        "$ npx prisma db push                      # Initializes SQLite schema",
        "$ npx tsx src/database/seeds/seed.ts      # Seeds demo enterprise accounts",
        "$ npm run dev                             # Starts backend API on Port 5001",
        "",
        "# 2. In a separate terminal, start frontend",
        "$ cd ../frontend",
        "$ npm install",
        "$ npm run dev                             # Starts Web UI on Port 3000"
    ]
    p5.add_code_box(code_steps)
    
    p5.add_heading2("Default Demo Accounts")
    acc_headers = ["Role Classification", "Email Address", "Default Password"]
    acc_rows = [
        ["Organization Admin", "admin@nexuscloud.io", "Password123!"],
        ["Lead SRE / DevOps", "sarah.connor@nexuscloud.io", "Password123!"],
        ["Senior Engineer", "alex.chen@nexuscloud.io", "Password123!"]
    ]
    p5.add_table(acc_headers, acc_rows, [150, 200, 155])

    p5.add_heading1("6. REST API Reference & Service Endpoints")
    
    api_headers = ["Method", "Endpoint Route", "Description & Response Payload"]
    api_rows = [
        ["GET", "/api/v1/health", "Live database latency probe, memory footprint, uptime stats."],
        ["POST", "/api/v1/auth/login", "Authenticates user credentials and returns session JWT."],
        ["POST", "/api/v1/auth/totp/verify", "Validates 6-digit TOTP code for 2FA zero-trust login."],
        ["GET", "/api/v1/tasks", "Returns paginated tasks with department and priority filters."],
        ["POST", "/api/v1/tasks", "Creates new engineering task & dispatches automation rules."],
        ["GET", "/api/v1/incidents", "Fetches active incident tickets, severity, and SLA countdowns."],
        ["POST", "/api/v1/incidents/:id/war-room", "Posts collaborative message or status change to War Room."],
        ["GET", "/api/v1/automations", "Lists configured event-driven automation rules and logs."],
        ["POST", "/api/v1/copilot/chat", "Executes local SRE AI Copilot reasoning and query generation."],
        ["GET", "/api/v1/audit-logs", "Returns immutable, tenant-isolated compliance audit records."]
    ]
    p5.add_table(api_headers, api_rows, [60, 160, 285])

    p5.add_callout(
        "Interactive Swagger UI & Developer Portal: Visit http://localhost:5001 or http://localhost:5001/api-docs in your browser to inspect live schema models and test API endpoints.",
        title="DEVELOPER PORTAL ACCESS",
        style="info"
    )

    pdf.build_pdf(output_path)


if __name__ == '__main__':
    target_path = "/Users/manojkumarmeena/Desktop/opsflow/OpsFlow_Enterprise_Documentation.pdf"
    if len(sys.argv) > 1:
        target_path = sys.argv[1]
    generate_full_opsflow_pdf(target_path)
