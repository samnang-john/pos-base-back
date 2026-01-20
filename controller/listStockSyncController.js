import PDFDocument from "pdfkit";
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

        const sync = await StockSync.findById(id)
            .select("_id sync_invoice note total_items createdAt");

        if (!sync) {
            return res.status(404).json({ message: "Stock sync not found" });
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

        res.status(200).json({
            message: "Stock sync detail retrieved successfully",
            data: {
                ...sync.toObject(),
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
   PDF TABLE HELPER
========================= */
const drawTableRow = (doc, y, row, colWidths) => {
    let x = doc.page.margins.left;

    row.forEach((cell, i) => {
        doc
            .fontSize(9)
            .text(String(cell), x + 4, y + 6, {
                width: colWidths[i] - 8,
                align: "left"
            });

        doc.rect(x, y, colWidths[i], 22).stroke();
        x += colWidths[i];
    });
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
        const doc = new PDFDocument({ size: "A4", margin: 40 });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${sync.sync_invoice}.pdf`
        );

        doc.pipe(res);

        /* ===== TITLE ===== */
        doc.fontSize(18).text("Stock Sync Report", { align: "center" });
        doc.moveDown();

        /* ===== INFO ===== */
        doc.fontSize(11).text(`Invoice: ${sync.sync_invoice}`);
        doc.text(`Date: ${new Date(sync.createdAt).toLocaleString()}`);
        if (sync.note) doc.text(`Note: ${sync.note}`);
        doc.text(`Total Items: ${sync.total_items}`);
        doc.moveDown(1.5);

        /* ===== TABLE CONFIG ===== */
        const colWidths = [30, 150, 85, 75, 55, 60, 60];
        const tableHeader = [
            "No",
            "Type",
            "End Grain",
            "Length",
            "Qty",
            "Cost",
            "Price"
        ];

        let y = doc.y;

        /* ===== TABLE HEADER ===== */
        drawTableRow(doc, y, tableHeader, colWidths);
        y += 22;

        /* ===== TABLE ROWS ===== */
        items.forEach((item, index) => {
            // Page break
            if (y > doc.page.height - 80) {
                doc.addPage();
                y = doc.page.margins.top;

                drawTableRow(doc, y, tableHeader, colWidths);
                y += 22;
            }

            drawTableRow(doc, y, [
                index + 1,
                item.product_id?.type_of_wood_id?.name || "-",
                item.product_id?.end_grain_of_wood_id?.name || "-",
                item.product_id?.length_of_wood_id?.name || "-", // ✅ FIXED
                item.quantity,
                item.product_id?.cost_of_each || 0,
                item.product_id?.price_of_each || 0
            ], colWidths);

            y += 22;
        });

        doc.end();
    } catch (error) {
        console.error("Download stock sync PDF error:", error);
        res.status(500).json({
            message: "Failed to generate stock sync PDF"
        });
    }
};