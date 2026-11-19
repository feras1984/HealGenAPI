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
import { GridColumnDirTypecast } from "@syncfusion/ej2-react-grids/src/grid/columns-directive";
import { Container as ServiceContainer } from "typedi";
import CommonService from "@/Services/CommonService/CommonService";
import LocationService from "@/Services/LocationService/LocationService";
import { GridActionEventArgs, SearchEventArgs } from "@syncfusion/ej2-grids/src/grid/base/interface";
import { Box } from "@mui/material";
import EditButton from "@/Services/LocationService/Components/EditButton";
import ActiveForm from "@/Services/LocationService/Components/ActiveForm";
import { useLocationContext } from "@/Services/LocationService/State/LocationContext";
import { LocationGridProps } from "@/Services/LocationService/Interfaces/LocationProps";
import { ClickEventArgs } from "@syncfusion/ej2-navigations";
import { handleGridToolbarClick } from "@/Utils/GridExportHelper";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/Redux/Store/hook";

const LocationGrid = () => {
    const locationService = ServiceContainer.get(LocationService);
    const { locations, onSearch } = useLocationContext();
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
        totalRecordsCount: locations.length,
        pageCount: 25,
    };

    const locationGridColumns = useMemo<(GridColumnModel | GridColumnDirTypecast)[]>(() => [
        { type: 'checkbox', width: '50' },
        {
            field: 'id',
            headerText: t('common.id') || 'Id',
            width: '100',
            textAlign: 'Center',
        },
        {
            field: 'name',
            headerText: t('forms.locationName') || 'Location Name',
            width: '200',
            textAlign: 'Center',
        },
        {
            field: 'code',
            headerText: t('forms.locationCode') || 'Location Code',
            width: '150',
            textAlign: 'Center',
        },
        {
            field: 'city',
            headerText: t('forms.city') || 'City',
            width: '150',
            textAlign: 'Center',
        },
        {
            field: 'country',
            headerText: t('forms.country') || 'Country',
            width: '150',
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
                ref={g => grid = g}
                rowHeight={50}
                id="locationComp"
                dataSource={locationService.mapLocationsGrid(locations)}
                allowPaging
                allowSorting
                allowFiltering
                allowExcelExport={true}
                allowPdfExport={true}
                enableRtl={isRtl}
                toolbar={['ExcelExport', 'PdfExport', 'Delete', 'Search']}
                toolbarClick={(args: ClickEventArgs) =>
                    handleGridToolbarClick(grid, args, {
                        fileName: isRtl ? 'دليل_المواقع' : 'Locations_Master_Catalog',
                        title: t('nav.locations') || 'Locations Master Catalog',
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
                    {locationGridColumns.map((item, key) => (
                        <ColumnDirective key={key} {...item} />
                    ))}
                </ColumnsDirective>

                <Inject services={[Page, Toolbar, ExcelExport, PdfExport, Selection, Sort, Search, Filter, RowDD]} />
            </GridComponent>
        </Box>
    );
};

export default LocationGrid;
