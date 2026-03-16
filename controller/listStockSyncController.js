import PDFDocument from "pdfkit";
import mongoose from "mongoose";
import StockSync from "../model/stockSyncModel.js";
import StockSyncItem from "../model/stockSyncItemModel.js";

/* =========================
   LIST STOCK SYNCS
========================= */
export const listStockSyncs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 10;
        const { startDate, endDate } = req.query;

        const skip = (page - 1) * size;
        const matchStage = {};

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            matchStage.createdAt = { $gte: start, $lte: end };
        }

        const totalItems = await StockSync.countDocuments(matchStage);

        const syncs = await StockSync.find(matchStage)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(size)
            .select("_id sync_invoice note total_items createdAt");

        res.status(200).json({
            message: "Stock sync list retrieved successfully",
            data: {
                items: syncs,
                pagination: {
                    currentPage: page,
                    pageSize: size,
                    totalItems,
                    totalPages: Math.ceil(totalItems / size)
                }
            }
        });
    } catch (error) {
        console.error("List stock sync error:", error);
        res.status(500).json({ message: "Failed to retrieve stock sync list" });
    }
};

/* =========================
   STOCK SYNC DETAIL
========================= */
export const getStockSyncDetail = async (req, res) => {
    try {
        const { id } = req.params;

        // ✅ Validate ObjectId first
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid stock sync id"
            });
        }

        const sync = await StockSync.findById(id)
            .select("_id sync_invoice note total_items createdAt");

        if (!sync) {
            return res.status(404).json({
                message: "Stock sync not found"
            });
        }

        const items = await StockSyncItem.find({ sync_id: id })
            .populate({
                path: "product_id",
                populate: [
                    { path: "type_of_wood_id", select: "name" },
                    { path: "end_grain_of_wood_id", select: "name" },
                    { path: "length_of_wood_id", select: "name" }
                ]
            })
            .select("product_id quantity before_qty after_qty");

        let total_price_of_all_items = 0;
        let total_cost_of_all_items = 0;

        items.forEach(item => {
            const qty = item.quantity || 0;
            const price = item.product_id?.total_price_of_wood || item.product_id?.price_of_each || 0;
            const cost = item.product_id?.cost_of_each || 0;

            total_price_of_all_items += qty * price;
            total_cost_of_all_items += qty * cost;
        });

        res.status(200).json({
            message: "Stock sync detail retrieved successfully",
            data: {
                ...sync.toObject(),
                total_price_of_all_items,
                total_cost_of_all_items,
                items
            }
        });

    } catch (error) {
        console.error("Get stock sync detail error:", error);

        res.status(500).json({
            message: "Failed to retrieve stock sync detail"
        });
    }
};

/* =========================
   DOWNLOAD STOCK SYNC PDF
========================= */
export const downloadStockSyncPDF = async (req, res) => {
    try {
        const { id } = req.params;

        /* ===== HEADER DATA ===== */
        const sync = await StockSync.findById(id)
            .select("_id sync_invoice note total_items createdAt");

        if (!sync) {
            return res.status(404).json({ message: "Stock sync not found" });
        }

        /* ===== DETAIL ITEMS ===== */
        const items = await StockSyncItem.find({ sync_id: id })
            .populate({
                path: "product_id",
                populate: [
                    { path: "type_of_wood_id", select: "name" },
                    { path: "end_grain_of_wood_id", select: "name" },
                    { path: "length_of_wood_id", select: "name" }
                ]
            })
            .select("quantity before_qty after_qty product_id");

        /* ===== PDF SETUP ===== */
        const doc = new PDFDocument({ size: "A4", margin: 30 });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${sync.sync_invoice}.pdf`
        );

        // ===== REGISTER FONT =====
        const fontPath = "assets/fonts/KhmerSangamMN.ttf";
        doc.registerFont("Khmer", fontPath);

        doc.pipe(res);

        /* ===== HEADER ===== */
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
        doc.text(`វិក្កយបត្រ #: ${sync.sync_invoice}`, rightSideX, headerStartY, { align: "right", width: rightSideWidth });

        // Row 2
        doc.text(`ទល់មុខសាលាបឋមសិក្សាហ៊ុននាងបឹងត្របែកទី២`, 30, headerStartY + lineHeight);
        doc.text(`កាលបរិច្ឆេទ: ${new Date(sync.createdAt).toLocaleString("en-US", { timeZone: "Asia/Phnom_Penh" })}`, rightSideX, headerStartY + lineHeight, { align: "right", width: rightSideWidth });

        // Row 3
        doc.text(`ភ្នំពេញ`, 30, headerStartY + (lineHeight * 2));
        doc.text(`ទូរស័ព្ទ: ${"012 23 23 37"}`, rightSideX, headerStartY + (lineHeight * 2), { align: "right", width: rightSideWidth });

        // Row 5
        doc.text(`${"097 87 47 347"}`, rightSideX, headerStartY + (lineHeight * 3), { align: "right", width: rightSideWidth });

        doc.y = headerStartY + (lineHeight * 5);
        doc.moveTo(30, doc.y).lineTo(565, doc.y).stroke(); // horizontal line

        /* ===== TABLE HEADER ===== */
        const columns = [
            { key: "no", label: "ល.រ", x: 30, width: 30, align: "center" },
            { key: "product", label: "មុខទំនិញ", x: 60, width: 280, align: "left" },
            { key: "qty", label: "ចំនួន", x: 340, width: 50, align: "center" },
            { key: "cost", label: "ថ្លៃដើម/គ្រឿង", x: 390, width: 80, align: "right" },
            { key: "total", label: "តម្លៃសរុប", x: 470, width: 95, align: "right" }
        ];

        let y = doc.y + 5;
        drawRow(doc, y, columns, true);
        y += 20;

        let totalCostAll = 0;
        let totalQtyAll = 0;

        /* ===== TABLE ROWS ===== */
        items.forEach((item, index) => {
            if (y > doc.page.height - 100) {
                doc.addPage();
                y = 50;
            }

            const product = item.product_id;
            const productName = `${product?.type_of_wood_id?.name || ""} ${product?.end_grain_of_wood_id?.name || ""} x ${product?.length_of_wood_id?.name || ""}`;

            const cost = product?.cost_of_each || 0;
            const qty = item.quantity || 0;
            const rowTotalCost = cost * qty;

            totalCostAll += rowTotalCost;
            totalQtyAll += qty;

            const rowData = {
                no: index + 1,
                product: productName.trim() === "x" ? "-" : productName,
                qty: qty,
                cost: `$${cost.toFixed(2)}`,
                total: `$${rowTotalCost.toFixed(2)}`
            };

            drawRow(doc, y, columns, false, rowData);
            y += 20;
        });

        doc.moveTo(30, y).lineTo(565, y).stroke();
        y += 10;

        // ===== SUMMARY =====
        const summaryStartX = 350;
        const summaryWidth = 215;

        // Display note and total items below the product list on the left side
        doc.text(`សរុបមុខទំនិញ: ${sync.total_items}`, 30, y, { width: 300, align: "left" });
        doc.text(`ចំណាំ: ${sync.note || "-"}`, 30, y + 15, { width: 300, align: "left" });

        // Total quantity and cost on the right side
        doc.fontSize(12).text(`ចំនួនទំនិញសរុប: ${totalQtyAll}`, summaryStartX, y, { width: summaryWidth, align: "right" });
        doc.fontSize(12).text(`ថ្លៃដើមសរុប: $${totalCostAll.toFixed(2)}`, summaryStartX, y + 18, { width: summaryWidth, align: "right" });
        y += 65;

        // ===== SIGNATURES =====
        const signatureY = y;
        doc.fontSize(10);

        // Left side: Prepared by
        doc.text("អ្នករៀបចំ", 30, signatureY, { width: 200, align: "center" });
        doc.text("(..........................)", 30, signatureY + 45, { width: 200, align: "center" });

        // Right side: Checked by
        doc.text("អ្នកត្រួតពិនិត្យ", 350, signatureY, { width: 215, align: "center" });
        doc.text("(..........................)", 350, signatureY + 45, { width: 215, align: "center" });

        doc.end();
    } catch (error) {
        console.error("Download stock sync PDF error:", error);
        res.status(500).json({
            message: "Failed to generate stock sync PDF"
        });
    }
};

// ===== HELPERS =====
function drawRow(doc, y, columns, isHeader, data = {}) {
    columns.forEach(col => {
        const text = isHeader ? col.label : data[col.key];
        doc.text(text, col.x, y, { width: col.width, align: col.align || "left" });
    });
}