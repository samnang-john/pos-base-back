import PDFDocument from "pdfkit";

export const generateStockHistoryPDF = (res, history, items) => {
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=stock-sync-${history.reference_no}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text("Stock Sync Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Reference No: ${history.reference_no}`);
    doc.text(`Date: ${new Date(history.created_at).toLocaleString()}`);
    if (history.note) doc.text(`Note: ${history.note}`);
    doc.moveDown();

    doc.text("Items:");
    doc.moveDown(0.5);

    items.forEach((item, index) => {
        doc.text(
            `${index + 1}. Product: ${item.display_name} | ` +
            `Before: ${item.before_qty} | ` +
            `Added: ${item.quantity} | ` +
            `After: ${item.after_qty} | ` +
            `Price: ${item.price_of_each}`
        );
    });

    doc.end();
};