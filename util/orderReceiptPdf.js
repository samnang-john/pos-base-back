import PDFDocument from "pdfkit";

export const generateOrderReceiptPDF = (res, order, items) => {
    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=receipt-${order.order_number}.pdf`
    );

    // ===== REGISTER FONT =====
    const fontPath = "assets/fonts/KhmerSangamMN.ttf";
    doc.registerFont("Khmer", fontPath);

    doc.pipe(res);

    // ===== HEADER =====
    doc.font("Khmer").fontSize(18).text("ប៊ុន ឈៀង", { align: "center", bold: true });
    doc.fontSize(14).text("ដេប៉ូឈើ បឹងត្របែកទី១ (B.T.1)", { align: "center" });
    doc.moveDown(0.5);

    const headerStartY = doc.y;
    const lineHeight = 15;
    const rightSideX = 350;
    const rightSideWidth = 565 - rightSideX;

    doc.fontSize(10);

    // Row 1
    doc.text(`អាសយដ្ឋាន ផ្លូវលេខ ១០៣`, 30, headerStartY);
    doc.text(`វិក្កយបត្រ #: ${order.order_number}`, rightSideX, headerStartY, { align: "right", width: rightSideWidth });

    // Row 2
    doc.text(`ទល់មុខសាលាបឋមសិក្សាហ៊ុននាងបឹងត្របែកទី២`, 30, headerStartY + lineHeight);
    doc.text(`កាលបរិច្ឆេទ: ${new Date(order.createdAt).toLocaleString()}`, rightSideX, headerStartY + lineHeight, { align: "right", width: rightSideWidth });

    // Row 3
    doc.text(`ភ្នំពេញ`, 30, headerStartY + (lineHeight * 2));
    doc.text(`ទូរស័ព្ទ: ${"012 23 23 37"}`, rightSideX, headerStartY + (lineHeight * 2), { align: "right", width: rightSideWidth });

    // Row 5
    doc.text(`${"097 87 47 347"}`, rightSideX, headerStartY + (lineHeight * 3), { align: "right", width: rightSideWidth });


    doc.y = headerStartY + (lineHeight * 5);




    doc.moveTo(30, doc.y).lineTo(565, doc.y).stroke(); // horizontal line

    // ===== TABLE HEADER =====
    const columns = [
        { key: "no", label: "ល.រ", x: 30, width: 40, align: "center" },
        { key: "product", label: "មុខទំនិញ", x: 70, width: 280, align: "left" },
        { key: "qty", label: "ចំនួន", x: 350, width: 45, align: "center" },
        { key: "unitPrice", label: "តម្លៃ", x: 395, width: 75, align: "right" },
        { key: "total", label: "តម្លៃសរុប", x: 470, width: 95, align: "right" }
    ];

    let y = doc.y + 5;
    drawRow(doc, y, columns, true);
    y += 20;

    // ===== ITEMS =====
    items.forEach((item, index) => {
        if (y > doc.page.height - 100) {
            doc.addPage();
            y = 50;
        }

        const product = item.product_id;
        const productName = `${product.type_of_wood_id?.name || ""} ${product.end_grain_of_wood_id?.name || ""} x ${product.length_of_wood_id?.name || ""}`;

        const rowData = {
            no: index + 1,
            product: productName,
            qty: item.quantity,
            unitPrice: `$${item.price.toFixed(2)}`,
            total: `$${item.total.toFixed(2)}`
        };

        drawRow(doc, y, columns, false, rowData);
        y += 20;
    });

    doc.moveTo(30, y).lineTo(565, y).stroke();
    y += 10;

    // ===== SUMMARY =====
    const summaryStartX = 350;
    const summaryWidth = 215;

    doc.text(`សរុប: $${order.subtotal.toFixed(2)}`, summaryStartX, y, { width: summaryWidth, align: "right" });
    y += 15;
    doc.text(`ពន្ធ: $${order.tax.toFixed(2)}`, summaryStartX, y, { width: summaryWidth, align: "right" });
    y += 20;
    doc.fontSize(12).text(`សរុបរួម: $${order.grand_total.toFixed(2)}`, summaryStartX, y, { width: summaryWidth, align: "right" });
    y += 50;

    // ===== SIGNATURES =====
    const signatureY = y;
    doc.fontSize(10);

    // Left side: Seller
    doc.text("ហត្ថលេខាអ្នកលក់", 30, signatureY, { width: 200, align: "center" });
    doc.text("(..........................)", 30, signatureY + 45, { width: 200, align: "center" });

    // Right side: Customer
    doc.text("ហត្ថលេខាអតិថិជន", 350, signatureY, { width: 215, align: "center" });
    doc.text(`(${order.customer || ".........................."})`, 350, signatureY + 45, { width: 215, align: "center" });

    y = signatureY + 80;

    // ===== FOOTER =====
    doc.fontSize(10).text("សូមអរគុណដែលបានគាំទ្រ!", { align: "center" });
    doc.text("សូមអញ្ជើញមកម្តងទៀត!", { align: "center" });



    doc.end();
};

// ===== HELPERS =====
function drawRow(doc, y, columns, isHeader, data = {}) {
    columns.forEach(col => {
        const text = isHeader ? col.label : data[col.key];
        doc.text(text, col.x, y, { width: col.width, align: col.align || "left" });
    });
}
