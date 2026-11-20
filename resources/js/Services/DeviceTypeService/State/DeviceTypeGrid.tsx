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
import DeviceTypeService from "@/Services/DeviceTypeService/DeviceTypeService";
import { GridActionEventArgs, SearchEventArgs } from "@syncfusion/ej2-grids/src/grid/base/interface";
import { Box } from "@mui/material";
import EditButton from "@/Services/DeviceTypeService/Components/EditButton";
import ActiveForm from "@/Services/DeviceTypeService/Components/ActiveForm";
import { useDeviceTypeContext } from "@/Services/DeviceTypeService/State/DeviceTypeContext";
import { ClickEventArgs } from "@syncfusion/ej2-navigations";
import { handleGridToolbarClick } from "@/Utils/GridExportHelper";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/Redux/Store/hook";

const DeviceTypeGrid = () => {
    const deviceTypeService = ServiceContainer.get(DeviceTypeService);
    const { deviceTypes, onSearch } = useDeviceTypeContext();
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
        totalRecordsCount: deviceTypes.length,
        pageCount: 25,
    };

    const deviceTypeGridColumns = useMemo<(GridColumnModel | GridColumnDirTypecast)[]>(() => [
        { type: 'checkbox', width: '50' },
        {
            field: 'id',
            headerText: t('common.id') || 'Id',
            width: '100',
            textAlign: 'Center',
        },
        {
            field: 'name',
            headerText: t('common.name') || 'Name',
            width: '200',
            textAlign: 'Center',
        },
        {
            field: 'manufacturer',
            headerText: t('forms.manufacturer') || 'Manufacturer',
            width: '180',
            textAlign: 'Center',
        },
        {
            field: 'model',
            headerText: t('forms.model') || 'Model',
            width: '180',
            textAlign: 'Center',
        },
        {
            field: 'isActive',
            headerText: t('common.status') || 'Status',
            width: '150',
            textAlign: 'Center',
            template: ActiveForm,
        },
        {
            field: 'Edit',
            headerText: t('common.edit') || 'Edit',
            width: '150',
            textAlign: 'Center',
            template: EditButton,
        },
        {
            field: 'createdAt',
            headerText: t('common.createdAt') || 'Created At',
            width: '180',
            textAlign: 'Center',
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
                key={`device-type-grid-${currentLang || i18n.language}-${isRtl ? 'rtl' : 'ltr'}`}
                ref={g => grid = g}
                rowHeight={50}
                id="deviceTypeComp"
                dataSource={deviceTypeService.mapDeviceTypesGrid(deviceTypes)}
                allowPaging
                allowSorting
                allowFiltering
                allowExcelExport={true}
                allowPdfExport={true}
                enableRtl={isRtl}
                toolbar={['ExcelExport', 'PdfExport', 'Delete', 'Search']}
                toolbarClick={(args: ClickEventArgs) =>
                    handleGridToolbarClick(grid, args, {
                        fileName: isRtl ? 'دليل_أنواع_الأجهزة' : 'Device_Types_Catalog',
                        title: t('nav.deviceTypes') || 'Device Types Catalog',
                        isLandscape: false
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
                    {deviceTypeGridColumns.map((item, key) => (
                        <ColumnDirective key={key} {...item} />
                    ))}
                </ColumnsDirective>

                <Inject services={[Page, Toolbar, ExcelExport, PdfExport, Selection, Sort, Search, Filter, RowDD]} />
            </GridComponent>
        </Box>
    );
};

export default DeviceTypeGrid;
