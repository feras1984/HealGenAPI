import { GridComponent, ExcelExportProperties, PdfExportProperties } from "@syncfusion/ej2-react-grids";
import { ClickEventArgs } from "@syncfusion/ej2-navigations";
import { Workbook } from "@syncfusion/ej2-excel-export";
import { PdfDocument, PdfGrid } from "@syncfusion/ej2-pdf-export";

export interface GridExportOptions {
    fileName?: string;
    title?: string;
    isLandscape?: boolean;
    headerColumnsCount?: number;
}

const formatDate = (date: Date = new Date()): string => {
    return date.toISOString().slice(0, 10);
};

const getExportableColumns = (grid: GridComponent): any[] | undefined => {
    if (!grid.columns || !Array.isArray(grid.columns) || grid.columns.length === 0) {
        return undefined;
    }
    const filtered = (grid.columns as any[]).filter((col) => {
        const field = String(col.field || '').toLowerCase();
        const header = String(col.headerText || '').toLowerCase();
        const type = String(col.type || '').toLowerCase();
        if (type === 'checkbox' || field === 'bulkselect') return false;
        if (
            field === 'edit' ||
            header === 'edit' ||
            header === 'action' ||
            header === 'actions' ||
            header === 'inspect' ||
            header === 'review'
        ) {
            return false;
        }
        return true;
    });
    return filtered.length > 0 ? filtered : undefined;
};

/**
 * Export a Syncfusion GridComponent instance to Excel (.xlsx).
 */
export const exportGridToExcel = (grid: GridComponent, options?: GridExportOptions): Promise<any> => {
    const dateStr = formatDate();
    const baseName = options?.fileName || 'Export';
    const title = options?.title || baseName.replace(/_/g, ' ');
    const exportColumns = getExportableColumns(grid);
    const colSpan = options?.headerColumnsCount || (exportColumns ? exportColumns.length : (grid.columns ? grid.columns.length : 6));

    const excelProps: ExcelExportProperties = {
        fileName: `${baseName}_${dateStr}.xlsx`,
        ...(exportColumns ? { columns: exportColumns } : {}),
        header: {
            headerRows: 1,
            rows: [
                {
                    cells: [
                        {
                            colSpan: colSpan,
                            value: `HealGen - ${title} (${dateStr})`,
                            style: { fontSize: 13, bold: true, hAlign: 'Center' }
                        }
                    ]
                }
            ]
        }
    };

    return grid.excelExport(excelProps);
};

/**
 * Export a Syncfusion GridComponent instance to PDF (.pdf).
 */
export const exportGridToPdf = (grid: GridComponent, options?: GridExportOptions): Promise<any> => {
    const dateStr = formatDate();
    const baseName = options?.fileName || 'Export';
    const title = options?.title || baseName.replace(/_/g, ' ');
    const exportColumns = getExportableColumns(grid);

    const pdfProps: PdfExportProperties = {
        fileName: `${baseName}_${dateStr}.pdf`,
        pageOrientation: options?.isLandscape !== false ? 'Landscape' : 'Portrait',
        pageSize: 'A4',
        ...(exportColumns ? { columns: exportColumns } : {}),
        header: {
            fromTop: 0,
            height: 35,
            contents: [
                {
                    type: 'Text',
                    value: `HealGen - ${title} (Exported: ${dateStr})`,
                    position: { x: 0, y: 10 },
                    style: { textBrushColor: '#1e293b', fontSize: 12, bold: true }
                }
            ]
        },
        footer: {
            fromBottom: 10,
            height: 20,
            contents: [
                {
                    type: 'PageNumber',
                    pageNumberType: 'Arabic',
                    format: 'Page {$current} of {$total}',
                    position: { x: 0, y: 0 },
                    style: { textBrushColor: '#64748b', fontSize: 9 }
                }
            ]
        }
    };

    return grid.pdfExport(pdfProps);
};

/**
 * Reusable toolbarClick event handler for Syncfusion GridComponent.
 */
export const handleGridToolbarClick = (
    grid: GridComponent | null,
    args: ClickEventArgs,
    options?: GridExportOptions
): void => {
    if (!grid) return;
    const itemId = (args.item?.id || '').toLowerCase();
    const itemText = (args.item?.text || '').toLowerCase();

    if (itemId.includes('excelexport') || itemText.includes('excel')) {
        exportGridToExcel(grid, options);
    } else if (itemId.includes('pdfexport') || itemText.includes('pdf')) {
        exportGridToPdf(grid, options);
    }
};

/**
 * Export non-Syncfusion tables (like Material UI tables) to Excel (.xlsx).
 */
export const exportCustomTableToExcel = (options: {
    fileName: string;
    title: string;
    columns: string[];
    rows: (string | number)[][];
}): void => {
    const rows: any[] = [];
    const dateStr = formatDate();

    // Row 1: Title Banner
    rows.push({
        index: 1,
        cells: [
            {
                index: 1,
                colSpan: options.columns.length,
                value: `HealGen - ${options.title} (${dateStr})`,
                style: { bold: true, fontSize: 13, hAlign: 'Center' }
            }
        ]
    });

    // Row 2: Header Columns
    rows.push({
        index: 2,
        cells: options.columns.map((col, idx) => ({
            index: idx + 1,
            value: col,
            style: { bold: true, backColor: '#f1f5f9' }
        }))
    });

    // Rows 3+: Data Rows
    options.rows.forEach((row, rIdx) => {
        rows.push({
            index: rIdx + 3,
            cells: row.map((cellVal, cIdx) => ({
                index: cIdx + 1,
                value: cellVal
            }))
        });
    });

    const workbook = new Workbook({ worksheets: [{ rows }] }, 'xlsx');
    workbook.save(`${options.fileName}_${dateStr}.xlsx`);
};

/**
 * Export non-Syncfusion tables (like Material UI tables) to PDF (.pdf).
 */
export const exportCustomTableToPdf = (options: {
    fileName: string;
    title: string;
    columns: string[];
    rows: (string | number)[][];
    isLandscape?: boolean;
}): void => {
    const doc = new PdfDocument();
    const page = doc.pages.add();
    const grid = new PdfGrid();
    const dateStr = formatDate();

    grid.columns.add(options.columns.length);

    // Title Header
    const titleHeader = grid.headers.add(1)[0];
    titleHeader.cells.getCell(0).value = `HealGen - ${options.title} (${dateStr})`;
    titleHeader.cells.getCell(0).columnSpan = options.columns.length;

    // Column Headers
    const colHeader = grid.headers.add(1)[0];
    options.columns.forEach((col, idx) => {
        colHeader.cells.getCell(idx).value = col;
    });

    // Data Rows
    options.rows.forEach((row) => {
        const pdfRow = grid.rows.addRow();
        row.forEach((cellVal, idx) => {
            pdfRow.cells.getCell(idx).value = String(cellVal ?? '-');
        });
    });

    grid.draw(page, 10, 10);
    doc.save(`${options.fileName}_${dateStr}.pdf`);
};
