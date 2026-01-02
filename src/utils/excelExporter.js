import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportToExcel = async (fileName, sheetName, columns, data, reportTitle) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // 1. Add Title Row (Merged across all columns)
    // Calculate the range to merge (A1 to LastColumn1)
    const lastColLetter = getExcelColumnName(columns.length);
    worksheet.mergeCells(`A1:${lastColLetter}1`);

    const titleCell = worksheet.getCell('A1');
    titleCell.value = reportTitle;
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Slate 900
    worksheet.getRow(1).height = 30;

    // 2. Add Header Row
    const headerValues = columns.map(col => col.header);
    const headerRow = worksheet.addRow(headerValues);
    headerRow.height = 20;

    headerRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } }; // Blue 500
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // 3. Add Data Rows
    data.forEach(item => {
        // Map data object to array attributes based on columns keys
        const rowValues = columns.map(col => {
            // Handle simple keys or nested/custom accessors if you pass data objects
            // But for simplicity, let's assume 'data' is already an array of mapped values suitable for the columns order,
            // OR 'data' is an object and columns has a 'key' property.
            // Let's go with: data is an array of objects, and columns has 'key'.
            return item[col.key] || "";
        });
        const row = worksheet.addRow(rowValues);
    });

    // 4. Style Data Rows (Borders, Alignment, Alternating Colors)
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) {
            row.eachCell((cell, colNumber) => {
                cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF334155' } }; // Slate 700
                cell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
                cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

                // Optional: Alternating row colors
                if (rowNumber % 2 === 0) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }; // Slate 50
                }
            });
        }
    });

    // 5. Set Column Widths
    worksheet.columns = columns.map(col => ({ width: col.width || 20 }));

    // 6. Generate and Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${fileName}.xlsx`);
};

// Helper to convert index to column letter (1 -> A, 2 -> B, etc)
// Simplified for up to 26 columns, can extend if needed but likely sufficient
function getExcelColumnName(colIndex) {
    let temp, letter = '';
    while (colIndex > 0) {
        temp = (colIndex - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        colIndex = (colIndex - temp - 1) / 26;
    }
    return letter;
}
