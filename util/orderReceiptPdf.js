import PDFDocument from "pdfkit";

export const generateOrderReceiptPDF = (res, order, items) => {
    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=receipt-${order.order_number}.pdf`
    );

    doc.pipe(res);

    // ===== HEADER =====
    doc.fontSize(18).text("MY STORE POS", { align: "center", bold: true });
    doc.fontSize(10).text("Address: 123 Main Street, City", { align: "center" });
    doc.text("Phone: (123) 456-7890", { align: "center" });
    doc.moveDown(0.5);

    doc.fontSize(10).text(`Invoice #: ${order.order_number}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
    doc.text(`Customer: ${order.customer || "-"}`);
    doc.text(`Payment Status: ${order.payment_status}`);
    doc.moveDown(0.5);

    doc.moveTo(30, doc.y).lineTo(565, doc.y).stroke(); // horizontal line

    // ===== TABLE HEADER =====
    const columns = [
        { key: "no", label: "No", x: 30, width: 30 },
        { key: "product", label: "Product", x: 60, width: 200 },
        { key: "qty", label: "Qty", x: 260, width: 40 },
        { key: "unitPrice", label: "Unit Price", x: 300, width: 80 },
        { key: "carFee", label: "Car Fee", x: 380, width: 60 },
        { key: "total", label: "Total", x: 440, width: 100 }
    ];

    let y = doc.y + 5;
    doc.font("Helvetica-Bold");
    drawRow(doc, y, columns, true);
    y += 20;
    doc.font("Helvetica");

    // ===== ITEMS =====
    items.forEach((item, index) => {
        if (y > doc.page.height - 100) {
            doc.addPage();
            y = 50;
        }

        const product = item.product_id;
        const productName = `${product.type_of_wood_id?.name || ""} ${product.end_grain_of_wood_id?.name || ""} ${product.length_of_wood_id?.name || ""}`;

        const rowData = {
            no: index + 1,
            product: productName,
            qty: item.quantity,
            unitPrice: `$${item.price.toFixed(2)}`,
            carFee: `$${product.car_fee?.toFixed(2) || 0}`,
            total: `$${item.total.toFixed(2)}`
        };

        drawRow(doc, y, columns, false, rowData);
        y += 20;
    });

    doc.moveTo(30, y).lineTo(565, y).stroke();
    y += 10;

    // ===== SUMMARY =====
    const summaryStartX = 350;
    const summaryWidth = 150;

    doc.font("Helvetica-Bold");
    doc.text(`Subtotal: $${order.subtotal.toFixed(2)}`, summaryStartX, y, { width: summaryWidth, align: "right" });
    y += 15;
    doc.text(`Discount: $${order.discount.toFixed(2)}`, summaryStartX, y, { width: summaryWidth, align: "right" });
    y += 15;
    doc.text(`Tax: $${order.tax.toFixed(2)}`, summaryStartX, y, { width: summaryWidth, align: "right" });
    y += 15;
    doc.text(`Grand Total: $${order.grand_total.toFixed(2)}`, summaryStartX, y, { width: summaryWidth, align: "right" });
    y += 30;

    // ===== FOOTER =====
    doc.fontSize(10).text("Thank you for shopping with us!", { align: "center" });
    doc.text("Visit Again!", { align: "center" });

    doc.end();
};

// ===== HELPERS =====
function drawRow(doc, y, columns, isHeader, data = {}) {
    columns.forEach(col => {
        const text = isHeader ? col.label : data[col.key];
        doc.text(text, col.x, y, { width: col.width, align: "left" });
    });
}
