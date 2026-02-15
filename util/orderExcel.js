import ExcelJS from "exceljs";

export const generateOrderReportExcel = async (res, orders, filters) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Order Report");

    // ===== TITLE =====
    worksheet.mergeCells("A1:I1");
    worksheet.getCell("A1").value = "ORDER REPORT";
    worksheet.getCell("A1").font = { name: "Khmer Sangam MN", size: 16, bold: true };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    let rowIndex = 2;

    // ===== DATE RANGE =====
    if (filters.startDate && filters.endDate) {
        worksheet.mergeCells(`A${rowIndex}:I${rowIndex}`);
        worksheet.getCell(`A${rowIndex}`).value =
            `From ${filters.startDate} to ${filters.endDate}`;
        worksheet.getCell(`A${rowIndex}`).alignment = { horizontal: "center" };
        rowIndex++;
    }

    rowIndex++; // space before table

    // ===== DEFINE COLUMNS (NO HEADER HERE) =====
    worksheet.columns = [
        { key: "no", width: 6 },
        { key: "invoice", width: 20 },
        { key: "customer", width: 20 },
        { key: "items", width: 10 },
        { key: "subtotal", width: 15 },
        { key: "discount", width: 15 },
        { key: "tax", width: 10 },
        { key: "total", width: 15 },
        { key: "date", width: 15 }
    ];

    // ===== TABLE HEADER (MANUAL) =====
    const headerRow = worksheet.addRow([
        "No",
        "Invoice",
        "Customer",
        "Items",
        "Subtotal",
        "Discount",
        "Tax",
        "Total",
        "Date"
    ]);

    headerRow.font = { name: "Khmer Sangam MN", bold: true };
    headerRow.alignment = { horizontal: "center" };

    headerRow.eachCell(cell => {
        cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
    });

    // ===== DATA ROWS =====
    let grandTotalSum = 0;

    orders.forEach((order, index) => {
        const itemsCount = order.items.reduce(
            (sum, item) => sum + item.quantity,
            0
        );

        grandTotalSum += order.grand_total;

        worksheet.addRow({
            no: index + 1,
            invoice: order.order_number,
            customer: order.customer || "-",
            items: itemsCount,
            subtotal: order.subtotal,
            discount: order.discount,
            tax: order.tax,
            total: order.grand_total,
            date: new Date(order.createdAt).toLocaleDateString()
        });
    });

    // ===== SUMMARY =====
    worksheet.addRow({});
    const totalOrdersRow = worksheet.addRow(["", "Total Orders", orders.length]);
    const grandTotalRow = worksheet.addRow(["", "Grand Total", grandTotalSum]);

    totalOrdersRow.font = { name: "Khmer Sangam MN", bold: true };
    grandTotalRow.font = { name: "Khmer Sangam MN", bold: true };

    // ===== RESPONSE =====
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
        "Content-Disposition",
        "attachment; filename=order-report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
};
