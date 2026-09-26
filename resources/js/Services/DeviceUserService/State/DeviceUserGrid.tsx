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
import DeviceUserService from "@/Services/DeviceUserService/DeviceUserService";
import { GridActionEventArgs, SearchEventArgs } from "@syncfusion/ej2-grids/src/grid/base/interface";
import { Box } from "@mui/material";
import UnassignButton from "@/Services/DeviceUserService/Components/UnassignButton";
import ActiveForm from "@/Services/DeviceUserService/Components/ActiveForm";
import { useDeviceUserContext } from "@/Services/DeviceUserService/State/DeviceUserContext";

const deviceUserGridColumns: (GridColumnModel | GridColumnDirTypecast)[] = [
    { type: 'checkbox', width: '50' },
    {
        field: 'id',
        headerText: 'Id',
        width: '100',
        textAlign: 'Center',
    },
    {
        field: 'deviceName',
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
        field: 'userName',
        headerText: 'User Name',
        width: '200',
        textAlign: 'Center',
    },
    {
        field: 'userEmail',
        headerText: 'User Email',
        width: '220',
        textAlign: 'Center',
    },
    {
        field: 'assignedAt',
        headerText: 'Assigned At',
        width: '180',
        textAlign: 'Center',
    },
    {
        field: 'unassignedAt',
        headerText: 'Unassigned At',
        width: '180',
        textAlign: 'Center',
    },
    {
        field: 'isActive',
        headerText: 'Active',
        width: '120',
        textAlign: 'Center',
        template: ActiveForm,
    },
    {
        field: 'Action',
        headerText: 'Action',
        width: '150',
        textAlign: 'Center',
        template: UnassignButton,
    },
];

const DeviceUserGrid = () => {
    const deviceUserService = ServiceContainer.get(DeviceUserService);
    const { assignments, onSearch } = useDeviceUserContext();
    let grid: GridComponent | null;
    const selectionSettings: SelectionSettingsModel = { type: 'Multiple' };
    const FilterOptions: FilterSettingsModel = { type: 'Excel' };
    const pageOptions: PageSettingsModel = {
        pageSizes: CommonService.PageSizes,
        pageSize: CommonService.ListLimit,
        totalRecordsCount: assignments.length,
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
                id="deviceUserComp"
                dataSource={deviceUserService.mapAssignmentsGrid(assignments)}
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
