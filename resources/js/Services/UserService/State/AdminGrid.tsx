import React from "react";
import {
    ColumnDirective,
    ColumnsDirective, ExcelExport, Filter,
    FilterSettingsModel,
    GridColumnModel,
    GridComponent, Inject, Page,
    PageSettingsModel, PdfExport, RowDD, RowDragEventArgs, Search, Selection,
    SelectionSettingsModel, Sort, Toolbar
} from "@syncfusion/ej2-react-grids";
import {GridColumnDirTypecast} from "@syncfusion/ej2-react-grids/src/grid/columns-directive";
import {Container as ServiceContainer} from "typedi";
import CommonService from "@/Services/CommonService/CommonService";
import AdminService from "@/Services/UserService/AdminService";
import {GridActionEventArgs, SearchEventArgs} from "@syncfusion/ej2-grids/src/grid/base/interface";
import {Box} from "@mui/material";
import EditButton from "@/Services/UserService/Components/EditButton";
import {AdminGridProps} from "@/Services/UserService/Interfaces/AdminProps";
import adminService from "@/Services/UserService/AdminService";
import {useAdminContext} from "@/Services/UserService/State/AdminsContext";
import ActiveForm from "@/Services/UserService/Components/ActiveForm";
import ImageTemplate from "@/Services/UserService/Components/ImageTemplate";


interface PatientElement extends Element{
    data: AdminGridProps,
}

const blocksGrid: (GridColumnModel | GridColumnDirTypecast) [] = [
    { type: 'checkbox', width: '50' },
    {   field: 'id',
        headerText: 'Id',
        width: '100',
        // template: ImageTemplate,
        // allowFiltering: true,
        // filterTemplate: filterName,
        textAlign: 'Center' },
    {
        field: 'name',
        headerText: 'Name',
        width: '250',
        textAlign: 'Center',
        template: ImageTemplate,
    },

    {
        field: 'role',
        headerText: 'Role',
        width: '250',
        textAlign: 'Center',
    },

    {
        field: 'isActive',
        headerText: 'Status',
        width: '250',
        textAlign: 'Center',
        template: ActiveForm,
    },

    {
        field: 'Edit',
        headerText: 'Edit',
        width: '250',
        textAlign: 'Center',
        template: EditButton,
    },

    // {
    //     field: 'createdAt',
    //     headerText: 'Status',
    //     width: '250',
    //     textAlign: 'Center',
    // },

];

const AdminGrid = () => {
    const adminService = ServiceContainer.get(AdminService);
    const {admins, onSearch} = useAdminContext();
    let grid: GridComponent | null;
    const selectionSettings: SelectionSettingsModel = {type: 'Multiple'};
    const FilterOptions: FilterSettingsModel = {
        type: 'Excel',
    };
    const pageOptions: PageSettingsModel = {
        pageSizes: CommonService.PageSizes,
        pageSize: CommonService.ListLimit,
        totalRecordsCount: 3,
        pageCount: 25,
    };

    const actionComplete = (args: GridActionEventArgs) => {
        // console.log('args:', args);
        switch (args.requestType) {
            case 'paging':
                break;
            case 'searching':
                const search = (args as SearchEventArgs).searchString
                if (search !== undefined) {
                    // onSearch(search);
                }
                break;
            // case 'rowdraganddrop':
            //     let orderList: {id: number, order: number} [] = [];
            //     const rows = (args as RowDragEventArgs).rows as PatientElement [];
            //     rows?.map((row, index) => {
            //         orderList = [...orderList, {id: row.data.id, order: index}]
            //     })
            //     reorder(orderList);
            //     break;
            default:
                break;

        }
    }

    const rowDrop = (args: RowDragEventArgs): void => {
        if (args.rows !== undefined && args.fromIndex !== undefined && args.dropIndex !== undefined) {
            args.cancel = true;
            let value: number[] = [];
            for (let r = 0; r < args?.rows?.length; r++) {
                value.push(args?.fromIndex + r);
            }
            if (grid) grid.reorderRows(value, args.dropIndex);
        }
    }

    return (
        <Box>
            <GridComponent
                ref={g => grid = g}
                rowHeight={50}
                id="blockComp"
                dataSource={adminService.mapAdminsGrid(admins)}
                allowPaging
                allowSorting
                allowFiltering
                allowExcelExport={true}
                allowPdfExport={true}
                toolbar={['Delete', 'Search']}
                editSettings={{allowDeleting: true,
                    // allowEditing: true,
                    showDeleteConfirmDialog:true}}
                filterSettings={FilterOptions}
                pageSettings={pageOptions}
                actionComplete={actionComplete}
                allowRowDragAndDrop={true}
                selectionSettings={selectionSettings}
                rowDrop={rowDrop}
                // toolbarClick={handleExport}
            >
                <ColumnsDirective>
                    {blocksGrid.map((item, key) => (
                        <ColumnDirective key={key} {...item}/>
                    ))}
                </ColumnsDirective>

                <Inject services={[Page, Toolbar, ExcelExport, PdfExport, Selection,
                    // Edit,
                    Sort, Search, Filter, RowDD]} />
            </GridComponent>
        </Box>
    );
}

export default AdminGrid;
