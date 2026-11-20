import React, { useMemo } from "react";
import {
    ColumnDirective,
    ColumnsDirective, ExcelExport, Filter,
    FilterSettingsModel,
    GridColumnModel,
    GridComponent, Inject, Page,
    PageSettingsModel, PdfExport, RowDD, Search, Selection,
    SelectionSettingsModel, Sort, Toolbar
} from "@syncfusion/ej2-react-grids";
import { GridColumnDirTypecast } from "@syncfusion/ej2-react-grids/src/grid/columns-directive";
import { Container as ServiceContainer } from "typedi";
import CommonService from "@/Services/CommonService/CommonService";
import DeviceUserService from "@/Services/DeviceUserService/DeviceUserService";
import { GridActionEventArgs, SearchEventArgs } from "@syncfusion/ej2-grids/src/grid/base/interface";
import { Box } from "@mui/material";
import UnassignButton from "@/Services/DeviceUserService/Components/UnassignButton";
import ActiveForm from "@/Services/DeviceUserService/Components/ActiveForm";
import { useDeviceUserContext } from "@/Services/DeviceUserService/State/DeviceUserContext";
import { ClickEventArgs } from "@syncfusion/ej2-navigations";
import { handleGridToolbarClick } from "@/Utils/GridExportHelper";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/Redux/Store/hook";

const DeviceUserGrid = () => {
    const deviceUserService = ServiceContainer.get(DeviceUserService);
    const { assignments, onSearch } = useDeviceUserContext();
    const { t, i18n } = useTranslation();
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl = direction === 'rtl' || currentLang === 'ar' || i18n.language === 'ar';

    let grid: GridComponent | null = null;
    const selectionSettings: SelectionSettingsModel = { type: 'Multiple' };
    const FilterOptions: FilterSettingsModel = { type: 'Excel' };
    const pageOptions: PageSettingsModel = {
        pageSizes: CommonService.PageSizes,
        pageSize: CommonService.ListLimit,
        totalRecordsCount: assignments.length,
        pageCount: 25,
    };

    const deviceUserGridColumns = useMemo<(GridColumnModel | GridColumnDirTypecast)[]>(() => [
        { type: 'checkbox', width: '50' },
        {
            field: 'id',
            headerText: t('common.id') || 'Id',
            width: '100',
            textAlign: 'Center',
        },
        {
            field: 'deviceName',
            headerText: t('forms.deviceName') || 'Device Name',
            width: '200',
            textAlign: 'Center',
        },
        {
            field: 'deviceCode',
            headerText: t('forms.deviceCode') || 'Device Code',
            width: '180',
            textAlign: 'Center',
        },
        {
            field: 'userName',
            headerText: t('forms.employee') || 'User Name',
            width: '200',
            textAlign: 'Center',
        },
        {
            field: 'userEmail',
            headerText: t('forms.email') || 'User Email',
            width: '220',
            textAlign: 'Center',
        },
        {
            field: 'assignedAt',
            headerText: t('common.createdAt') || 'Assigned At',
            width: '180',
            textAlign: 'Center',
        },
        {
            field: 'unassignedAt',
            headerText: t('common.unassigned') || 'Unassigned At',
            width: '180',
            textAlign: 'Center',
        },
        {
            field: 'isActive',
            headerText: t('common.status') || 'Active',
            width: '120',
            textAlign: 'Center',
            template: ActiveForm,
        },
        {
            field: 'Action',
            headerText: t('common.actions') || 'Action',
            width: '150',
            textAlign: 'Center',
            template: UnassignButton,
        },
    ], [t]);

    const actionComplete = (args: GridActionEventArgs) => {
        switch (args.requestType) {
            case 'paging':
                break;
            case 'searching':
                const searchStr = (args as SearchEventArgs).searchString;
                if (searchStr !== undefined) {
                    onSearch(searchStr);
                }
                break;
            default:
                break;
        }
    };

    return (
        <Box>
            <GridComponent
                key={`device-user-grid-${currentLang || i18n.language}-${isRtl ? 'rtl' : 'ltr'}`}
                ref={g => grid = g}
                rowHeight={50}
                id="deviceUserComp"
                dataSource={deviceUserService.mapAssignmentsGrid(assignments)}
                allowPaging
                allowSorting
                allowFiltering
                allowExcelExport={true}
                allowPdfExport={true}
                enableRtl={isRtl}
                toolbar={['ExcelExport', 'PdfExport', 'Delete', 'Search']}
                toolbarClick={(args: ClickEventArgs) =>
                    handleGridToolbarClick(grid, args, {
                        fileName: isRtl ? 'تعيينات_الأجهزة_للمستخدمين' : 'Device_User_Assignments',
                        title: t('nav.deviceAssignments') || 'Device User Assignments',
                        isLandscape: true
                    })
                }
                editSettings={{
                    allowDeleting: true,
                    showDeleteConfirmDialog: true,
                }}
                filterSettings={FilterOptions}
                pageSettings={pageOptions}
                actionComplete={actionComplete}
                selectionSettings={selectionSettings}
            >
                <ColumnsDirective>
                    {deviceUserGridColumns.map((item, key) => (
                        <ColumnDirective key={key} {...item} />
                    ))}
                </ColumnsDirective>

                <Inject services={[Page, Toolbar, ExcelExport, PdfExport, Selection, Sort, Search, Filter, RowDD]} />
            </GridComponent>
        </Box>
    );
};

export default DeviceUserGrid;
