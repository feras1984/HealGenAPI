import React, { useMemo } from "react";
import { PatientGridProps } from "@/Services/PatientService/PatientList/Interfaces/PatientProps";
import {
    ColumnDirective,
    ColumnsDirective,
    ExcelExport,
    Filter,
    FilterSettingsModel,
    GridColumnModel,
    GridComponent,
    Inject,
    Page,
    PageSettingsModel,
    PdfExport,
    RowDD,
    RowDragEventArgs,
    Search,
    Selection,
    SelectionSettingsModel,
    Sort,
    Toolbar
} from "@syncfusion/ej2-react-grids";
import { GridColumnDirTypecast } from "@syncfusion/ej2-react-grids/src/grid/columns-directive";
import { Container as ServiceContainer } from "typedi";
import CommonService from "@/Services/CommonService/CommonService";
import PatientService from "@/Services/PatientService/PatientService";
import { usePatientContext } from "@/Services/PatientService/PatientList/State/PatientsCotext";
import { GridActionEventArgs, SearchEventArgs } from "@syncfusion/ej2-grids/src/grid/base/interface";
import { Box, Chip } from "@mui/material";
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import EditButton from "@/Services/PatientService/PatientList/Components/EditButton";
import { ClickEventArgs } from "@syncfusion/ej2-navigations";
import { handleGridToolbarClick } from "@/Utils/GridExportHelper";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/Redux/Store/hook";

const AttachmentTemplate = (props: any) => {
    const { t } = useTranslation();
    const attachment = props.attachment;

    if (!attachment) {
        return <span style={{ color: '#94a3b8' }}>-</span>;
    }

    return (
        <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
        >
            <Chip
                size="small"
                icon={attachment.isImage ? <ImageIcon sx={{ fontSize: '14px !important' }} /> : <PictureAsPdfIcon sx={{ fontSize: '14px !important' }} />}
                label={attachment.isImage ? (t('tests.imageDocument') || 'Image') : (t('tests.pdfDocument') || 'PDF')}
                color={attachment.isImage ? 'primary' : 'error'}
                variant="outlined"
                clickable
                sx={{ fontWeight: 600, fontSize: '0.7rem', cursor: 'pointer' }}
            />
        </a>
    );
};

const PatientGrid = () => {
    const patientService = ServiceContainer.get(PatientService);
    const { patients, onSearch } = usePatientContext();
    const { t, i18n } = useTranslation();
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl = direction === 'rtl' || currentLang === 'ar' || i18n.language === 'ar';

    let grid: GridComponent | null = null;
    const selectionSettings: SelectionSettingsModel = { type: 'Multiple' };
    const FilterOptions: FilterSettingsModel = {
        type: 'Excel',
    };
    const pageOptions: PageSettingsModel = {
        pageSizes: CommonService.PageSizes,
        pageSize: CommonService.ListLimit,
        totalRecordsCount: 3,
        pageCount: 25,
    };

    const columns = useMemo<(GridColumnModel | GridColumnDirTypecast)[]>(() => [
        { type: 'checkbox', width: '50' },
        { field: 'id', headerText: t('tests.testId') || 'Id', width: '100', textAlign: 'Center' },
        { field: 'patientId', headerText: t('tests.patientCode') || 'Code', width: '220', textAlign: 'Center' },
        { field: 'donorId', headerText: t('tests.donorName') || 'Name', width: '220', textAlign: 'Center' },
        { field: 'deviceCode', headerText: t('tests.deviceCode') || 'Device Code', width: '180', textAlign: 'Center' },
        { field: 'deviceName', headerText: t('tests.deviceName') || 'Device Name', width: '180', textAlign: 'Center' },
        { field: 'locationName', headerText: t('tests.location') || 'Location', width: '180', textAlign: 'Center' },
        { field: 'collectionSite', headerText: t('tests.collectionSite') || 'Collection Site', width: '200', textAlign: 'Center' },
        { field: 'cupLotNumber', headerText: t('tests.cupLotNumber') || 'Cup Lot Number', width: '200', textAlign: 'Center' },
        { field: 'status', headerText: t('common.status') || 'Status', width: '200', textAlign: 'Center' },
        { field: 'attachment', headerText: t('tests.attachment') || 'Attachment', width: '160', textAlign: 'Center', template: AttachmentTemplate },
        { field: 'Edit', headerText: t('common.details') || 'Details', width: '180', textAlign: 'Center', template: EditButton },
        { field: 'createdAt', headerText: t('common.createdAt') || 'Created At', width: '200', textAlign: 'Center' },
    ], [i18n.language]);

    const actionComplete = (args: GridActionEventArgs) => {
        switch (args.requestType) {
            case 'paging':
                break;
            case 'searching':
                const search = (args as SearchEventArgs).searchString;
                if (search !== undefined) {
                    // onSearch(search);
                }
                break;
            default:
                break;
        }
    };

    const rowDrop = (args: RowDragEventArgs): void => {
        if (args.rows !== undefined && args.fromIndex !== undefined && args.dropIndex !== undefined) {
            args.cancel = true;
            let value: number[] = [];
            for (let r = 0; r < args?.rows?.length; r++) {
                value.push(args?.fromIndex + r);
            }
            if (grid) grid.reorderRows(value, args.dropIndex);
        }
    };

    return (
        <Box>
            <GridComponent
                key={`patient-grid-${currentLang || i18n.language}-${isRtl ? 'rtl' : 'ltr'}`}
                ref={g => grid = g}
                rowHeight={50}
                id="blockComp"
                dataSource={patientService.mapBlocksGrid(patients)}
                allowPaging
                allowSorting
                allowFiltering
                allowExcelExport={true}
                allowPdfExport={true}
                enableRtl={isRtl}
                toolbar={['ExcelExport', 'PdfExport', 'Delete', 'Search']}
                editSettings={{
                    allowDeleting: true,
                    showDeleteConfirmDialog: true
                }}
                filterSettings={FilterOptions}
                pageSettings={pageOptions}
                actionComplete={actionComplete}
                allowRowDragAndDrop={true}
                selectionSettings={selectionSettings}
                rowDrop={rowDrop}
                toolbarClick={(args: ClickEventArgs) =>
                    handleGridToolbarClick(grid, args, {
                        fileName: isRtl ? 'نتائج_فحوصات_المرضى' : 'Patients_Test_Results',
                        title: t('tests.title') || 'Patients Test Results',
                        isLandscape: true
                    })
                }
            >
                <ColumnsDirective>
                    {columns.map((item, key) => (
                        <ColumnDirective key={key} {...item} />
                    ))}
                </ColumnsDirective>

                <Inject services={[Page, Toolbar, ExcelExport, PdfExport, Selection, Sort, Search, Filter, RowDD]} />
            </GridComponent>
        </Box>
    );
};

export default PatientGrid;
