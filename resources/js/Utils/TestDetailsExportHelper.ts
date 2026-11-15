import PatientHeader from "@/models/patient/PatientHeader";
import { Workbook } from "@syncfusion/ej2-excel-export";
import {
    PdfDocument,
    PdfGrid,
    PdfStandardFont,
    PdfFontFamily,
    PdfFontStyle
} from "@syncfusion/ej2-pdf-export";

const formatDate = (date: Date = new Date()): string => {
    return date.toISOString().slice(0, 10);
};

/**
 * Export a single Test Details record to Excel (.xlsx).
 */
export const exportTestDetailsToExcel = (patient: PatientHeader): void => {
    const dateStr = formatDate();
    const rows: any[] = [];
    let currentRowIndex = 1;

    const device = patient.device as any;
    const deviceName = device?.name || (patient as any).deviceName || '-';
    const deviceCode = device?.deviceCode || (patient as any).deviceCode || '-';
    const deviceTypeName = device?.deviceTypeName || (patient as any).deviceTypeName || '-';
    const locationName = device?.locationName || (patient as any).locationName || '-';

    // 1. Report Title Banner
    rows.push({
        index: currentRowIndex++,
        cells: [
            {
                index: 1,
                colSpan: 4,
                value: `HEALGEN DIAGNOSTICS - CLINICAL TEST REPORT #${patient.id}`,
                style: { bold: true, fontSize: 14, hAlign: 'Center' }
            }
        ]
    });

    rows.push({
        index: currentRowIndex++,
        cells: [
            {
                index: 1,
                colSpan: 4,
                value: `Report Date: ${dateStr} | Status: ${patient.status || 'Imported'} | Test ID: #${patient.id}`,
                style: { italic: true, fontSize: 10, hAlign: 'Center' }
            }
        ]
    });

    currentRowIndex++; // Empty row

    // 2. Patient & Specimen Information Section
    rows.push({
        index: currentRowIndex++,
        cells: [
            {
                index: 1,
                colSpan: 4,
                value: '1. PATIENT & SAMPLE SPECIMEN INFORMATION',
                style: { bold: true, backColor: '#e2e8f0', fontSize: 11 }
            }
        ]
    });

    const patientInfo = [
        ['Donor Name', patient.donorId || '-'],
        ['Patient Code', patient.patientId || '-'],
        ['Collection Site', patient.collectionSite || '-'],
        ['Cup Lot Number', patient.cupLotNumber || '-'],
        ['Test Status', patient.status || 'Imported'],
        ['Created Timestamp', patient.createdAt || '-'],
    ];

    patientInfo.forEach(([label, val]) => {
        rows.push({
            index: currentRowIndex++,
            cells: [
                { index: 1, value: label, style: { bold: true, backColor: '#f8fafc' } },
                { index: 2, colSpan: 3, value: val }
            ]
        });
    });

    currentRowIndex++; // Empty row

    // 3. Device & Facility Details Section
    rows.push({
        index: currentRowIndex++,
        cells: [
            {
                index: 1,
                colSpan: 4,
                value: '2. DEVICE & FACILITY DETAILS',
                style: { bold: true, backColor: '#e2e8f0', fontSize: 11 }
            }
        ]
    });

    const deviceInfo = [
        ['Device Name', deviceName],
        ['Device Code', deviceCode],
        ['Device Type', deviceTypeName],
        ['Location', locationName],
    ];

    deviceInfo.forEach(([label, val]) => {
        rows.push({
            index: currentRowIndex++,
            cells: [
                { index: 1, value: label, style: { bold: true, backColor: '#f8fafc' } },
                { index: 2, colSpan: 3, value: val }
            ]
        });
    });

    // 4. Inspector Review Section (if present)
    if (patient.reviewedBy) {
        currentRowIndex++; // Empty row
        rows.push({
            index: currentRowIndex++,
            cells: [
                {
                    index: 1,
                    colSpan: 4,
                    value: '3. INSPECTION & REVIEW ATTRIBUTION',
                    style: { bold: true, backColor: '#e2e8f0', fontSize: 11 }
                }
            ]
        });

        const reviewInfo = [
            ['Inspector', patient.reviewedBy.name || patient.reviewedBy.email || '-'],
            ['Action Taken', patient.reviewedBy.action || '-'],
            ['Review Timestamp', patient.reviewedBy.reviewedAt || '-'],
            ['Notes / Reason', patient.reviewedBy.reason || '-'],
        ];

        reviewInfo.forEach(([label, val]) => {
            rows.push({
                index: currentRowIndex++,
                cells: [
                    { index: 1, value: label, style: { bold: true, backColor: '#f8fafc' } },
                    { index: 2, colSpan: 3, value: val }
                ]
            });
        });
    }

    // 5. Attached Document Section (if present)
    if (patient.attachment) {
        currentRowIndex++; // Empty row
        rows.push({
            index: currentRowIndex++,
            cells: [
                {
                    index: 1,
                    colSpan: 4,
                    value: '4. ATTACHED MEDICAL DOCUMENT',
                    style: { bold: true, backColor: '#e2e8f0', fontSize: 11 }
                }
            ]
        });

        rows.push({
            index: currentRowIndex++,
            cells: [
                { index: 1, value: 'File Name', style: { bold: true, backColor: '#f8fafc' } },
                { index: 2, value: patient.attachment.name },
                { index: 3, value: 'Uploaded Date', style: { bold: true, backColor: '#f8fafc' } },
                { index: 4, value: patient.attachment.createdAt }
            ]
        });
    }

    currentRowIndex++; // Empty row

    // 6. Medical Substances & Results Table Section
    rows.push({
        index: currentRowIndex++,
        cells: [
            {
                index: 1,
                colSpan: 4,
                value: 'TOXICOLOGICAL SUBSTANCES & LABORATORY RESULTS',
                style: { bold: true, backColor: '#cbd5e1', fontSize: 11 }
            }
        ]
    });

    // Table Header Row
    rows.push({
        index: currentRowIndex++,
        cells: [
            { index: 1, value: '#', style: { bold: true, backColor: '#f1f5f9', hAlign: 'Center' } },
            { index: 2, value: 'Substance Name', style: { bold: true, backColor: '#f1f5f9' } },
            { index: 3, value: 'Software Result', style: { bold: true, backColor: '#f1f5f9', hAlign: 'Center' } },
            { index: 4, value: 'Visual Result', style: { bold: true, backColor: '#f1f5f9', hAlign: 'Center' } },
        ]
    });

    if (patient.tests && patient.tests.length > 0) {
        patient.tests.forEach((substance, idx) => {
            rows.push({
                index: currentRowIndex++,
                cells: [
                    { index: 1, value: idx + 1, style: { hAlign: 'Center' } },
                    { index: 2, value: substance.substance || '-' },
                    { index: 3, value: substance.softwareResult || '-', style: { hAlign: 'Center' } },
                    { index: 4, value: substance.visualResult || '-', style: { hAlign: 'Center' } },
                ]
            });
        });
    } else {
        rows.push({
            index: currentRowIndex++,
            cells: [
                { index: 1, colSpan: 4, value: 'No substance test rows recorded for this sample.', style: { italic: true, hAlign: 'Center' } }
            ]
        });
    }

    currentRowIndex++; // Empty row

    // 7. Footer Disclaimer
    rows.push({
        index: currentRowIndex++,
        cells: [
            {
                index: 1,
                colSpan: 4,
                value: 'CONFIDENTIAL MEDICAL REPORT - This document contains private diagnostic data intended solely for authorized personnel.',
                style: { italic: true, fontSize: 9, hAlign: 'Center' }
            }
        ]
    });

    const fileName = `Test_Report_#${patient.id}_${patient.patientId || 'Specimen'}_${dateStr}.xlsx`;
    const workbook = new Workbook({ worksheets: [{ rows }] }, 'xlsx');
    workbook.save(fileName);
};

/**
 * Export a single Test Details record to PDF (.pdf).
 */
export const exportTestDetailsToPdf = (patient: PatientHeader): void => {
    try {
        const dateStr = formatDate();
        const doc = new PdfDocument();
        const page = doc.pages.add();
        let currentY = 10;

        const boldTitleFont = new PdfStandardFont(PdfFontFamily.Helvetica, 12, PdfFontStyle.Bold);
        const boldHeaderFont = new PdfStandardFont(PdfFontFamily.Helvetica, 10, PdfFontStyle.Bold);
        const regularFont = new PdfStandardFont(PdfFontFamily.Helvetica, 9);
        const smallFont = new PdfStandardFont(PdfFontFamily.Helvetica, 8);

        const device = patient.device as any;
        const deviceName = device?.name || (patient as any).deviceName || '-';
        const deviceCode = device?.deviceCode || (patient as any).deviceCode || '-';
        const deviceTypeName = device?.deviceTypeName || (patient as any).deviceTypeName || '-';
        const locationName = device?.locationName || (patient as any).locationName || '-';

        // 1. Report Title Grid
        const titleGrid = new PdfGrid();
        titleGrid.columns.add(1);
        const titleRow = titleGrid.headers.add(1)[0];
        titleRow.cells.getCell(0).value = `HEALGEN DIAGNOSTICS - CLINICAL LABORATORY REPORT`;
        titleRow.cells.getCell(0).style.font = boldTitleFont;

        const subTitleRow = titleGrid.rows.addRow();
        subTitleRow.cells.getCell(0).value = `Test ID: #${patient.id}   |   Status: ${patient.status || 'Imported'}   |   Report Date: ${dateStr}`;
        subTitleRow.cells.getCell(0).style.font = regularFont;

        const titleRes = titleGrid.draw(page, 0, currentY);
        currentY = titleRes.bounds.y + titleRes.bounds.height + 15;

        // 2. Patient & Sample Specimen Info Grid (2 Columns)
        const patientGrid = new PdfGrid();
        patientGrid.columns.add(2);

        const pHeaderRow = patientGrid.headers.add(1)[0];
        pHeaderRow.cells.getCell(0).value = 'PATIENT & SAMPLE SPECIMEN INFORMATION';
        pHeaderRow.cells.getCell(0).columnSpan = 2;
        pHeaderRow.cells.getCell(0).style.font = boldHeaderFont;

        const pRow1 = patientGrid.rows.addRow();
        pRow1.cells.getCell(0).value = `Donor Name: ${patient.donorId || '-'}`;
        pRow1.cells.getCell(1).value = `Patient Code: ${patient.patientId || '-'}`;

        const pRow2 = patientGrid.rows.addRow();
        pRow2.cells.getCell(0).value = `Collection Site: ${patient.collectionSite || '-'}`;
        pRow2.cells.getCell(1).value = `Cup Lot Number: ${patient.cupLotNumber || '-'}`;

        const pRow3 = patientGrid.rows.addRow();
        pRow3.cells.getCell(0).value = `Current Status: ${patient.status || 'Imported'}`;
        pRow3.cells.getCell(1).value = `Received Date: ${patient.createdAt || '-'}`;

        const pRes = patientGrid.draw(page, 0, currentY);
        currentY = pRes.bounds.y + pRes.bounds.height + 12;

        // 3. Device & Facility Details Grid (2 Columns)
        const deviceGrid = new PdfGrid();
        deviceGrid.columns.add(2);

        const dHeaderRow = deviceGrid.headers.add(1)[0];
        dHeaderRow.cells.getCell(0).value = 'DEVICE & FACILITY DETAILS';
        dHeaderRow.cells.getCell(0).columnSpan = 2;
        dHeaderRow.cells.getCell(0).style.font = boldHeaderFont;

        const dRow1 = deviceGrid.rows.addRow();
        dRow1.cells.getCell(0).value = `Device Name: ${deviceName}`;
        dRow1.cells.getCell(1).value = `Device Code: ${deviceCode}`;

        const dRow2 = deviceGrid.rows.addRow();
        dRow2.cells.getCell(0).value = `Device Type: ${deviceTypeName}`;
        dRow2.cells.getCell(1).value = `Facility Location: ${locationName}`;

        const dRes = deviceGrid.draw(page, 0, currentY);
        currentY = dRes.bounds.y + dRes.bounds.height + 12;

        // 4. Inspector Review Attribution (if present)
        if (patient.reviewedBy) {
            const reviewGrid = new PdfGrid();
            reviewGrid.columns.add(2);

            const rHeaderRow = reviewGrid.headers.add(1)[0];
            rHeaderRow.cells.getCell(0).value = 'INSPECTION & REVIEW ATTRIBUTION';
            rHeaderRow.cells.getCell(0).columnSpan = 2;
            rHeaderRow.cells.getCell(0).style.font = boldHeaderFont;

            const rRow1 = reviewGrid.rows.addRow();
            rRow1.cells.getCell(0).value = `Inspector: ${patient.reviewedBy.name || patient.reviewedBy.email || '-'}`;
            rRow1.cells.getCell(1).value = `Decision: ${patient.reviewedBy.action || '-'}`;

            const rRow2 = reviewGrid.rows.addRow();
            rRow2.cells.getCell(0).value = `Reviewed At: ${patient.reviewedBy.reviewedAt || '-'}`;
            rRow2.cells.getCell(1).value = `Reason: ${patient.reviewedBy.reason || '-'}`;

            const rRes = reviewGrid.draw(page, 0, currentY);
            currentY = rRes.bounds.y + rRes.bounds.height + 12;
        }

        // 5. Attached Document info (if present)
        if (patient.attachment) {
            const attachGrid = new PdfGrid();
            attachGrid.columns.add(2);

            const aHeaderRow = attachGrid.headers.add(1)[0];
            aHeaderRow.cells.getCell(0).value = 'ATTACHED MEDICAL DOCUMENT';
            aHeaderRow.cells.getCell(0).columnSpan = 2;
            aHeaderRow.cells.getCell(0).style.font = boldHeaderFont;

            const aRow = attachGrid.rows.addRow();
            aRow.cells.getCell(0).value = `File Name: ${patient.attachment.name} (${patient.attachment.isImage ? 'Image' : 'PDF'})`;
            aRow.cells.getCell(1).value = `Upload Timestamp: ${patient.attachment.createdAt}`;

            const aRes = attachGrid.draw(page, 0, currentY);
            currentY = aRes.bounds.y + aRes.bounds.height + 12;
        }

        // 6. Medical Substances & Results Table
        const substancesGrid = new PdfGrid();
        substancesGrid.columns.add(4);

        const sTitleRow = substancesGrid.headers.add(1)[0];
        sTitleRow.cells.getCell(0).value = 'TOXICOLOGICAL SUBSTANCES & LABORATORY RESULTS';
        sTitleRow.cells.getCell(0).columnSpan = 4;
        sTitleRow.cells.getCell(0).style.font = boldHeaderFont;

        const sHeaderRow = substancesGrid.headers.add(1)[0];
        sHeaderRow.cells.getCell(0).value = '#';
        sHeaderRow.cells.getCell(1).value = 'Substance Name';
        sHeaderRow.cells.getCell(2).value = 'Software Result';
        sHeaderRow.cells.getCell(3).value = 'Visual Result';
        for (let i = 0; i < 4; i++) {
            sHeaderRow.cells.getCell(i).style.font = boldHeaderFont;
        }

        if (patient.tests && patient.tests.length > 0) {
            patient.tests.forEach((test, idx) => {
                const sRow = substancesGrid.rows.addRow();
                sRow.cells.getCell(0).value = String(idx + 1);
                sRow.cells.getCell(1).value = test.substance || '-';
                sRow.cells.getCell(2).value = test.softwareResult || '-';
                sRow.cells.getCell(3).value = test.visualResult || '-';
            });
        } else {
            const emptyRow = substancesGrid.rows.addRow();
            emptyRow.cells.getCell(0).value = 'No substance test rows recorded for this sample.';
            emptyRow.cells.getCell(0).columnSpan = 4;
        }

        const subRes = substancesGrid.draw(page, 0, currentY);
        currentY = subRes.bounds.y + subRes.bounds.height + 15;

        // 7. Footer Notice Grid
        const footerGrid = new PdfGrid();
        footerGrid.columns.add(1);
        const footerRow = footerGrid.rows.addRow();
        footerRow.cells.getCell(0).value = 'CONFIDENTIAL MEDICAL REPORT: This diagnostic report is confidential and intended solely for authorized personnel. HealGen Diagnostics System.';
        footerRow.cells.getCell(0).style.font = smallFont;
        footerGrid.draw(page, 0, currentY);

        const fileName = `Test_Report_#${patient.id}_${patient.patientId || 'Specimen'}_${dateStr}.pdf`;
        doc.save(fileName);
    } catch (err) {
        console.error('Failed to export Test Details PDF:', err);
    }
};
