import PDFDocument from "pdfkit";

export const generateOrderReportPDF = (res, orders, filters) => {
    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        "attachment; filename=order-report.pdf"
    );

    // ===== REGISTER FONT =====
    const fontPath = "assets/fonts/KhmerSangamMN.ttf";
    doc.registerFont("Khmer", fontPath);

    doc.pipe(res);

    // ===== TITLE =====
    doc.font("Khmer").fontSize(18).text("ORDER REPORT", { align: "center" });
    doc.moveDown(0.5);

    if (filters.startDate && filters.endDate) {
        doc.fontSize(10).text(
            `From ${filters.startDate} to ${filters.endDate}`,
            { align: "center" }
        );
        doc.moveDown();
    }

    // ===== TABLE CONFIG =====
    const rowHeight = 20;
    let y = doc.y;

    const columns = [
        { key: "no", label: "No", x: 20, width: 30 },
        { key: "invoice", label: "Invoice", x: 55, width: 100 }, // bigger
        { key: "customer", label: "Customer", x: 160, width: 90 },
        { key: "items", label: "Items", x: 240, width: 40 },
        { key: "subtotal", label: "Subtotal", x: 275, width: 60 },
        { key: "discount", label: "Discount", x: 330, width: 60 },
        { key: "tax", label: "Tax", x: 395, width: 40 },
        { key: "total", label: "Total", x: 440, width: 60 },
        { key: "date", label: "Date", x: 505, width: 70 }
    ];

    // ===== TABLE HEADER =====
    doc.fontSize(9);
    drawRow(doc, y, rowHeight, columns, true);
    drawFullTableBorder(doc, y, rowHeight, columns);

    y += rowHeight;
    doc.fontSize(9);

    let grandTotalSum = 0;

    // ===== TABLE ROWS =====
    orders.forEach((order, index) => {
        // Page break
        if (y + rowHeight > doc.page.height - 80) {
            doc.addPage();
            y = 50;

            drawRow(doc, y, rowHeight, columns, true);
            drawFullTableBorder(doc, y, rowHeight, columns);
            y += rowHeight;
        }

        const itemsCount = order.items.reduce(
            (sum, item) => sum + item.quantity,
            0
        );

        const rowData = {
            no: index + 1,
            invoice: order.order_number,
            customer: order.customer || "-",
            items: itemsCount,
            subtotal: `$${order.subtotal}`,
            discount: `$${order.discount}`,
            tax: `$${order.tax}`,
            total: `$${order.grand_total}`,
            date: new Date(order.createdAt).toLocaleDateString()
        };

        drawRow(doc, y, rowHeight, columns, false, rowData);
        drawFullTableBorder(doc, y, rowHeight, columns);

        grandTotalSum += order.grand_total;
        y += rowHeight;
    });

    // ===== SUMMARY TABLE =====

    const summaryColumns = [
        { key: "label", label: "Summary", x: 20, width: 505 },
        { key: "value", label: "Value", x: 505, width: 70 }
    ];

    // Row 1 → Total Orders
    drawRow(doc, y, rowHeight, summaryColumns, false, {
        label: "Total Orders",
        value: orders.length
    });
    drawFullTableBorder(doc, y, rowHeight, summaryColumns);

    y += rowHeight;

    // Row 2 → Grand Total
    drawRow(doc, y, rowHeight, summaryColumns, false, {
        label: "Grand Total",
        value: `$${grandTotalSum.toFixed(2)}`
    });
    drawFullTableBorder(doc, y, rowHeight, summaryColumns);
    doc.end();

};

// ================= HELPER FUNCTIONS =================

function drawRow(doc, y, height, columns, isHeader, rowData = {}) {
    columns.forEach(col => {
        const text = isHeader ? col.label : rowData[col.key];
        doc.text(text, col.x + 3, y + 5, {
            width: col.width - 6,
            align: "left",
            ellipsis: true
        });
    });
}

function drawFullTableBorder(doc, yTop, rowHeight, columns) {
    const startX = columns[0].x;
    const endX = columns[columns.length - 1].x + columns[columns.length - 1].width;

    // Horizontal lines
    doc.moveTo(startX, yTop)
        .lineTo(endX, yTop)
        .stroke();
    doc.moveTo(startX, yTop + rowHeight)
        .lineTo(endX, yTop + rowHeight)
        .stroke();

    // Vertical lines
    columns.forEach(col => {
        doc.moveTo(col.x, yTop)
            .lineTo(col.x, yTop + rowHeight)
            .stroke();
    });

    // Right border of the last column
    doc.moveTo(endX, yTop)
        .lineTo(endX, yTop + rowHeight)
        .stroke();
}
