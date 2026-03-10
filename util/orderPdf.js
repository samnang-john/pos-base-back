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

    // ================= HEADER =================
    doc.font("Khmer").fontSize(18).text("ប៊ុន ឈៀង", { align: "center" });
    doc.fontSize(14).text("ដេប៉ូឈើ បឹងត្របែកទី១ (B.T.1)", { align: "center" });

    doc.moveDown(0.5);

    const headerStartY = doc.y;
    const lineHeight = 15;
    const rightSideX = 350;
    const rightSideWidth = 565 - rightSideX;

    doc.fontSize(10);

    doc.text(`អាសយដ្ឋាន ផ្លូវលេខ ១០៣`, 30, headerStartY);
    doc.text(`របាយការណ៍ការលក់`, rightSideX, headerStartY, {
        align: "right",
        width: rightSideWidth
    });

    doc.text(
        `ទល់មុខសាលាបឋមសិក្សាហ៊ុននាងបឹងត្របែកទី២`,
        30,
        headerStartY + lineHeight
    );

    doc.text(
        filters.startDate && filters.endDate
            ? `ចាប់ពី: ${filters.startDate}  ដល់: ${filters.endDate}`
            : `កាលបរិច្ឆេទ: ${new Date().toLocaleDateString()}`,
        rightSideX,
        headerStartY + lineHeight,
        { align: "right", width: rightSideWidth }
    );

    doc.text(`ភ្នំពេញ`, 30, headerStartY + (lineHeight * 2));

    doc.text(
        `ទូរស័ព្ទ: 012 23 23 37`,
        rightSideX,
        headerStartY + (lineHeight * 2),
        { align: "right", width: rightSideWidth }
    );

    doc.text(
        `097 87 47 347`,
        rightSideX,
        headerStartY + (lineHeight * 3),
        { align: "right", width: rightSideWidth }
    );

    doc.y = headerStartY + (lineHeight * 3);
    doc.moveDown();

    // ================= TABLE =================

    const columns = [
        { key: "no", label: "ល.រ", x: 30, width: 40, align: "center" },

        { key: "invoice", label: "លេខវិក្កយបត្រ", x: 70, width: 70, align: "left" },

        { key: "customer", label: "អតិថិជន", x: 140, width: 90, align: "left" },

        { key: "items", label: "ចំនួន", x: 230, width: 50, align: "center" },

        { key: "subtotal", label: "សរុប", x: 280, width: 70, align: "left" },

        { key: "discount", label: "បញ្ចុះតម្លៃ", x: 350, width: 65, align: "left" },

        { key: "total", label: "សរុបចុងក្រោយ", x: 415, width: 80, align: "left" },
 
        { key: "date", label: "កាលបរិច្ឆេទ", x: 495, width: 70, align: "center" }
    ];

    const rowHeight = 22;
    let y = doc.y + 10;

    drawRow(doc, y, rowHeight, columns, true);
    y += rowHeight;

    let grandTotal = 0;

    orders.forEach((order, index) => {

        if (y + rowHeight > doc.page.height - 80) {
            doc.addPage();
            y = 50;

            drawRow(doc, y, rowHeight, columns, true);
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
            total: `$${order.grand_total}`,
            date: new Date(order.order_date).toLocaleDateString()
        };

        drawRow(doc, y, rowHeight, columns, false, rowData);

        grandTotal += order.grand_total;
        y += rowHeight;

    });

    // ================= SUMMARY =================

    y += 10;

    doc.fontSize(10);
    doc.text(`ចំនួនការបញ្ជាទិញសរុប: ${orders.length}`, 440, y);

    y += 17; 

    doc.fontSize(12).text(
        `សរុបទឹកប្រាក់: $${grandTotal.toFixed(2)}`,
        440,
        y
    );

    doc.end();
};

// ================= DRAW ROW =================

function drawRow(doc, y, rowHeight, columns, isHeader, data = {}) {

    columns.forEach(col => {

        const text = isHeader ? col.label : data[col.key] || "";

        if (isHeader) {
            doc.rect(col.x, y, col.width, rowHeight)
                .fillAndStroke("#eeeeee", "black");
        } else {
            doc.rect(col.x, y, col.width, rowHeight).stroke();
        }

        doc.fillColor("black").text(
            text,
            col.x + 5,
            y + 6,
            {
                width: col.width - 10,
                align: col.align || "left",
                ellipsis: true
            }
        );

    });

}