import React, { useMemo } from "react";
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
import { ClickEventArgs } from "@syncfusion/ej2-navigations";
import { handleGridToolbarClick } from "@/Utils/GridExportHelper";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/Redux/Store/hook";

const RoleTemplate = (props: any) => {
    const { t } = useTranslation();
    const role = props.role;
    return <span>{t(`roles.${role}`) || role}</span>;
};

const AdminGrid = () => {
    const adminService = ServiceContainer.get(AdminService);
    const {admins, onSearch} = useAdminContext();
    const { t, i18n } = useTranslation();
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl = direction === 'rtl' || currentLang === 'ar' || i18n.language === 'ar';

    let grid: GridComponent | null = null;
    const selectionSettings: SelectionSettingsModel = {type: 'Multiple'};
    const FilterOptions: FilterSettingsModel = {
        type: 'Excel',
    };
    const pageOptions: PageSettingsModel = {
        pageSizes: CommonService.PageSizes,
        pageSize: CommonService.ListLimit,
        totalRecordsCount: admins.length,
        pageCount: 25,
    };

    const blocksGrid = useMemo<(GridColumnModel | GridColumnDirTypecast)[]>(() => [
        { type: 'checkbox', width: '50' },
        {
            field: 'id',
            headerText: t('common.id') || 'Id',
            width: '100',
            textAlign: 'Center'
        },
        {
            field: 'name',
            headerText: t('common.name') || 'Name',
            width: '250',
            textAlign: 'Center',
            template: ImageTemplate,
        },
        {
            field: 'role',
            headerText: t('forms.role') || 'Role',
            width: '250',
            textAlign: 'Center',
            template: RoleTemplate,
        },
        {
            field: 'isActive',
            headerText: t('common.status') || 'Status',
            width: '250',
            textAlign: 'Center',
            template: ActiveForm,
        },
        {
            field: 'Edit',
            headerText: t('common.edit') || 'Edit',
            width: '250',
            textAlign: 'Center',
            template: EditButton,
        },
    ], [t]);

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
                key={`admin-grid-${currentLang || i18n.language}-${isRtl ? 'rtl' : 'ltr'}`}
                ref={g => grid = g}
                rowHeight={50}
                id="blockComp"
                dataSource={adminService.mapAdminsGrid(admins)}
                allowPaging
                allowSorting
                allowFiltering
                allowExcelExport={true}
                allowPdfExport={true}
                enableRtl={isRtl}
                toolbar={['ExcelExport', 'PdfExport', 'Delete', 'Search']}
                toolbarClick={(args: ClickEventArgs) =>
                    handleGridToolbarClick(grid, args, {
                        fileName: isRtl ? 'دليل_المستخدمين' : 'Users_Master_Catalog',
                        title: t('nav.users') || 'Users Master Catalog',
                        isLandscape: true
                    })
                }
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
            >
                <ColumnsDirective>
                    {blocksGrid.map((item, key) => (
                        <ColumnDirective key={key} {...item}/>
                    ))}
                </ColumnsDirective>

                <Inject services={[Page, Toolbar, ExcelExport, PdfExport, Selection, Sort, Search, Filter, RowDD]} />
            </GridComponent>
        </Box>
    );
};

export default AdminGrid;
