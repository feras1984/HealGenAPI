import React from "react";
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
import DeviceService from "@/Services/DeviceService/DeviceService";
import { GridActionEventArgs, SearchEventArgs } from "@syncfusion/ej2-grids/src/grid/base/interface";
import { Box } from "@mui/material";
import EditButton from "@/Services/DeviceService/Components/EditButton";
import ActiveForm from "@/Services/DeviceService/Components/ActiveForm";
import { useDeviceContext } from "@/Services/DeviceService/State/DeviceContext";

const deviceGridColumns: (GridColumnModel | GridColumnDirTypecast)[] = [
    { type: 'checkbox', width: '50' },
    {
        field: 'id',
        headerText: 'Id',
        width: '100',
        textAlign: 'Center',
    },
    {
        field: 'name',
        headerText: 'Device Name',
        width: '200',
        textAlign: 'Center',
    },
    {
        field: 'deviceCode',
        headerText: 'Device Code',
        width: '180',
        textAlign: 'Center',
    },
    {
        field: 'locationName',
        headerText: 'Location',
        width: '180',
        textAlign: 'Center',
    },
    {
        field: 'deviceTypeName',
        headerText: 'Device Type',
        width: '180',
        textAlign: 'Center',
    },
    {
        field: 'serialNumber',
        headerText: 'Serial Number',
        width: '180',
        textAlign: 'Center',
    },
    {
        field: 'ipAddress',
        headerText: 'IP Address',
        width: '150',
        textAlign: 'Center',
    },
    {
        field: 'isActive',
        headerText: 'Status',
        width: '150',
        textAlign: 'Center',
        template: ActiveForm,
    },
    {
        field: 'Edit',
        headerText: 'Edit',
        width: '150',
        textAlign: 'Center',
        template: EditButton,
    },
    {
        field: 'createdAt',
        headerText: 'Created At',
        width: '180',
        textAlign: 'Center',
    },
];

const DeviceGrid = () => {
    const deviceService = ServiceContainer.get(DeviceService);
    const { devices, onSearch } = useDeviceContext();
    let grid: GridComponent | null;
    const selectionSettings: SelectionSettingsModel = { type: 'Multiple' };
    const FilterOptions: FilterSettingsModel = { type: 'Excel' };
    const pageOptions: PageSettingsModel = {
        pageSizes: CommonService.PageSizes,
        pageSize: CommonService.ListLimit,
        totalRecordsCount: devices.length,
        pageCount: 25,
    };

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
                ref={g => grid = g}
                rowHeight={50}
                id="deviceComp"
                dataSource={deviceService.mapDevicesGrid(devices)}
                allowPaging
                allowSorting
                allowFiltering
                allowExcelExport={true}
                allowPdfExport={true}
                toolbar={['Delete', 'Search']}
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
                    {deviceGridColumns.map((item, key) => (
                        <ColumnDirective key={key} {...item} />
                    ))}
                </ColumnsDirective>

                <Inject services={[Page, Toolbar, ExcelExport, PdfExport, Selection, Sort, Search, Filter, RowDD]} />
            </GridComponent>
        </Box>
    );
};

export default DeviceGrid;
