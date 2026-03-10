import ExcelJS from "exceljs";

export const generateOrderReportExcel = async (res, orders, filters) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Order Report");

    // ===== TITLE / HEADER =====
    worksheet.mergeCells("A1:H1");
    worksheet.getCell("A1").value = "ប៊ុន ឈៀង";
    worksheet.getCell("A1").font = { name: "Khmer Sangam MN", size: 16, bold: true };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    worksheet.mergeCells("A2:H2");
    worksheet.getCell("A2").value = "ដេប៉ូឈើ បឹងត្របែកទី១ (B.T.1)";
    worksheet.getCell("A2").font = { name: "Khmer Sangam MN", size: 14 };
    worksheet.getCell("A2").alignment = { horizontal: "center" };

    let rowIndex = 4;

    // Address and report info
    worksheet.getCell(`A${rowIndex}`).value = "អាសយដ្ឋាន ផ្លូវលេខ ១០៣";
    worksheet.getCell(`A${rowIndex}`).font = { name: "Khmer Sangam MN", size: 10 };
    worksheet.getCell(`E${rowIndex}`).value = "របាយការណ៍ការលក់";
    worksheet.getCell(`E${rowIndex}`).font = { name: "Khmer Sangam MN", size: 10 };
    worksheet.getCell(`E${rowIndex}`).alignment = { horizontal: "right" };
    rowIndex++;

    worksheet.getCell(`A${rowIndex}`).value = "ទល់មុខសាលាបឋមសិក្សាហ៊ុននាងបឹងត្របែកទី២";
    worksheet.getCell(`A${rowIndex}`).font = { name: "Khmer Sangam MN", size: 10 };
    worksheet.getCell(`E${rowIndex}`).value = filters.startDate && filters.endDate
        ? `ចាប់ពី: ${filters.startDate}  ដល់: ${filters.endDate}`
        : `កាលបរិច្ឆេទ: ${new Date().toLocaleDateString()}`;
    worksheet.getCell(`E${rowIndex}`).font = { name: "Khmer Sangam MN", size: 10 };
    worksheet.getCell(`E${rowIndex}`).alignment = { horizontal: "right" };
    rowIndex++;

    worksheet.getCell(`A${rowIndex}`).value = "ភ្នំពេញ";
    worksheet.getCell(`A${rowIndex}`).font = { name: "Khmer Sangam MN", size: 10 };
    worksheet.getCell(`E${rowIndex}`).value = "ទូរស័ព្ទ: 012 23 23 37 / 097 87 47 347";
    worksheet.getCell(`E${rowIndex}`).font = { name: "Khmer Sangam MN", size: 10 };
    worksheet.getCell(`E${rowIndex}`).alignment = { horizontal: "right" };
    rowIndex += 2;

    // ===== TABLE COLUMNS =====
    worksheet.columns = [
        { key: "no", width: 6 },
        { key: "invoice", width: 18 },
        { key: "customer", width: 20 },
        { key: "items", width: 10 },
        { key: "subtotal", width: 15 },
        { key: "discount", width: 15 },
        { key: "total", width: 15 },
        { key: "date", width: 15 }
    ];

    // ===== TABLE HEADER =====
    const headerRow = worksheet.addRow([
        "ល.រ", "លេខវិក្កយបត្រ", "អតិថិជន", "ចំនួន",
        "សរុប", "បញ្ចុះតម្លៃ", "សរុបចុងក្រោយ", "កាលបរិច្ឆេទ"
    ]);

    headerRow.font = { name: "Khmer Sangam MN", bold: true };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 20;

    headerRow.eachCell(cell => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEEEEEE' }
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // ===== DATA ROWS =====
    let grandTotal = 0;

    orders.forEach((order, index) => {
        const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
        grandTotal += order.grand_total;

        const row = worksheet.addRow({
            no: index + 1,
            invoice: order.order_number,
            customer: order.customer || "-",
            items: itemsCount,
            subtotal: `$${order.subtotal}`,
            discount: `$${order.discount}`,
            total: `$${order.grand_total}`,
            date: new Date(order.order_date).toLocaleDateString()
        });

        row.alignment = { horizontal: 'center', vertical: 'middle' };
        row.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    rowIndex = worksheet.lastRow.number + 2;

    // ===== SUMMARY =====
    const totalOrdersRow = worksheet.addRow(["", "ចំនួនការបញ្ជាទិញសរុប", orders.length]);
    totalOrdersRow.font = { name: "Khmer Sangam MN", bold: true };
    const grandTotalRow = worksheet.addRow(["", "សរុបទឹកប្រាក់", `$${grandTotal.toFixed(2)}`]);
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