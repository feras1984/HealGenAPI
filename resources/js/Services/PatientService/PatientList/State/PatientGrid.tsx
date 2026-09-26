import React from "react";
import {PatientGridProps} from "@/Services/PatientService/PatientList/Interfaces/PatientProps";
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
import PatientService from "@/Services/PatientService/PatientService";
import {usePatientContext} from "@/Services/PatientService/PatientList/State/PatientsCotext";
import {GridActionEventArgs, SearchEventArgs} from "@syncfusion/ej2-grids/src/grid/base/interface";
import {Box} from "@mui/material";
import EditButton from "@/Services/PatientService/PatientList/Components/EditButton";


interface PatientElement extends Element{
    data: PatientGridProps,
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
        field: 'patientId',
        headerText: 'Code',
        width: '250',
        textAlign: 'Center',
    },

    {
        field: 'donorId',
        headerText: 'Name',
        width: '250',
        textAlign: 'Center',
    },

    {
        field: 'deviceCode',
        headerText: 'Device Code',
        width: '200',
        textAlign: 'Center',
    },

    {
        field: 'deviceName',
        headerText: 'Device Name',
        width: '200',
        textAlign: 'Center',
    },

    {
        field: 'locationName',
        headerText: 'Location',
        width: '200',
        textAlign: 'Center',
    },

    {
        field: 'collectionSite',
        headerText: 'Collection Site',
        width: '250',
        textAlign: 'Center',
    },

    {
        field: 'cupLotNumber',
        headerText: 'Cup Lot Number',
        width: '250',
        textAlign: 'Center',
    },

    {
        field: 'status',
        headerText: 'Status',
        width: '250',
        textAlign: 'Center',
    },

    {
        field: 'Edit',
        headerText: 'Edit',
        width: '250',
        textAlign: 'Center',
        template: EditButton,
    },

    {
        field: 'createdAt',
        headerText: 'Created At',
        width: '250',
        textAlign: 'Center',
    },

];

const PatientGrid = () => {
    const patientService = ServiceContainer.get(PatientService);
    const {patients, onSearch} = usePatientContext();
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
                dataSource={patientService.mapBlocksGrid(patients)}
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

export default PatientGrid;
