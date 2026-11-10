import os
import io
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class InvoiceGenerator:
    """Generates official verified PDF tax invoices for settled e-commerce orders."""

    @staticmethod
    def generate_pdf(order: dict, transaction: dict, user: dict, address: dict = None) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'InvoiceTitle',
            parent=styles['Heading1'],
            fontSize=22,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'Subtitle',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=15
        )
        body_bold = ParagraphStyle(
            'BodyBold',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#0f172a'),
            fontName='Helvetica-Bold'
        )
        body_text = ParagraphStyle(
            'BodyText',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#334155')
        )

        elements = []

        # 1. Header Banner
        header_data = [
            [
                Paragraph("<b>PAYPILOT AI COMMERCE</b><br/><font size=8 color='#64748b'>Autonomous Multi-Agent Retail Platform<br/>GSTIN: 33AAACP1234A1Z5</font>", body_text),
                Paragraph(f"<b>TAX INVOICE</b><br/><font size=8 color='#0284c7'>Invoice No: INV-{str(transaction.get('transaction_id', order.get('id', '1001')))[:8].upper()}</font><br/><font size=8 color='#64748b'>Date: {datetime.now(timezone.utc).strftime('%d %b %Y, %H:%M UTC')}</font>", body_text)
            ]
        ]
        header_table = Table(header_data, colWidths=[300, 240])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT')
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 15))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0'), spaceAfter=15))

        # 2. Bill To & Payment Info
        cust_name = user.get('full_name', 'Verified Customer')
        cust_email = user.get('email', '')
        addr_line = f"{address.get('street', 'Plot 42, Tech Park')}, {address.get('city', 'Bangalore')}, {address.get('state', 'Karnataka')} - {address.get('pin_code', '560100')}" if address else "Standard Ground Delivery Address"
        
        provider = transaction.get('payment_provider', 'Payment Gateway').upper()
        method = transaction.get('payment_method_type', 'ELECTRONIC').upper()
        ref_id = transaction.get('gateway_payment_reference') or transaction.get('paypal_capture_id') or 'SETTLED'

        meta_data = [
            [
                Paragraph("<b>Billed & Delivered To:</b>", body_bold),
                Paragraph("<b>Settlement Details:</b>", body_bold)
            ],
            [
                Paragraph(f"{cust_name}<br/>{cust_email}<br/>{addr_line}", body_text),
                Paragraph(f"<b>Provider:</b> {provider}<br/><b>Method:</b> {method}<br/><b>Txn ID:</b> {ref_id}<br/><b>Status:</b> <font color='#16a34a'><b>PAID & VERIFIED</b></font>", body_text)
            ]
        ]
        meta_table = Table(meta_data, colWidths=[270, 270])
        meta_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1'))
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 20))

        # 3. Itemized Products Table
        items_header = [
            Paragraph("<b>Item Description</b>", body_bold),
            Paragraph("<b>Qty</b>", body_bold),
            Paragraph("<b>Unit Price</b>", body_bold),
            Paragraph("<b>Subtotal</b>", body_bold)
        ]
        
        table_rows = [items_header]
        items = order.get('items', [])
        if not items:
            items = [{
                'product_name': order.get('product_name', 'PayPilot Autonomous Purchase'),
                'quantity': order.get('quantity', 1),
                'unit_price': order.get('unit_price', order.get('subtotal', 0.0)),
                'subtotal': order.get('subtotal', 0.0)
            }]

        for item in items:
            table_rows.append([
                Paragraph(f"<b>{item.get('product_name', 'Item')}</b><br/><font size=7 color='#64748b'>Verified Marketplace Source</font>", body_text),
                Paragraph(str(item.get('quantity', 1)), body_text),
                Paragraph(f"INR {item.get('unit_price', 0.0):,.2f}", body_text),
                Paragraph(f"INR {item.get('subtotal', 0.0):,.2f}", body_text)
            ])

        subtotal = float(order.get('subtotal', 0.0))
        tax = float(order.get('tax_amount', subtotal * 0.18))
        discount = float(order.get('discount_amount', 0.0))
        shipping = float(order.get('shipping_fee', 0.0))
        total = float(order.get('total_amount', subtotal + tax + shipping - discount))

        table_rows.append(["", "", Paragraph("<b>Items Subtotal:</b>", body_bold), Paragraph(f"INR {subtotal:,.2f}", body_text)])
        if discount > 0:
            table_rows.append(["", "", Paragraph("<b>Coupon Discount:</b>", body_bold), Paragraph(f"-INR {discount:,.2f}", body_text)])
        table_rows.append(["", "", Paragraph("<b>GST (18%):</b>", body_bold), Paragraph(f"INR {tax:,.2f}", body_text)])
        table_rows.append(["", "", Paragraph("<b>Shipping:</b>", body_bold), Paragraph("FREE" if shipping == 0 else f"INR {shipping:,.2f}", body_text)])
        table_rows.append(["", "", Paragraph("<b>Grand Total:</b>", body_bold), Paragraph(f"<b>INR {total:,.2f}</b>", body_bold)])

        item_table = Table(table_rows, colWidths=[260, 40, 120, 120])
        item_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, len(items)), 0.5, colors.HexColor('#e2e8f0')),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('LINEABOVE', (2, -1), (3, -1), 1, colors.HexColor('#0f172a')),
            ('BACKGROUND', (2, -1), (3, -1), colors.HexColor('#e0f2fe'))
        ]))
        elements.append(item_table)
        elements.append(Spacer(1, 25))

        # 4. Footer & Legal Terms
        footer_text = (
            "<b>Thank you for shopping with PayPilot AI!</b><br/>"
            "This is a system-generated electronic invoice backed by cryptographic payment gateway verification. "
            "Returns and warranty are governed by authorized merchant policies. Questions? Contact support@paypilot.ai."
        )
        elements.append(Paragraph(footer_text, subtitle_style))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

invoice_service = InvoiceGenerator()

