import React, { useRef } from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import {
    ColumnDirective,
    ColumnsDirective,
    GridComponent,
    Inject,
    Page,
    Sort,
    Filter,
    Toolbar,
    Search,
    ExcelExport,
    PdfExport
} from "@syncfusion/ej2-react-grids";
import { ClickEventArgs } from "@syncfusion/ej2-navigations";
import { handleGridToolbarClick } from "@/Utils/GridExportHelper";
import { useMonitorContext } from "@/Services/MonitorService/State/MonitorContext";
import { useAppSelector } from "@/Redux/Store/hook";
import { useTranslation } from "react-i18next";

const ActiveTemplate = (props: any) => {
    const { t } = useTranslation();
    const isActive = props.isActive;
    return (
        <Chip
            label={isActive ? (t('common.active') || "Active") : (t('common.inactive') || "Inactive")}
            color={isActive ? "success" : "default"}
            size="small"
            variant="filled"
        />
    );
};

const DeviceOperationsGrid: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { data } = useMonitorContext();
    const devices = data.deviceOperations || [];
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl = direction === 'rtl' || currentLang === 'ar' || (i18n.language && i18n.language.startsWith('ar'));
    const gridRef = useRef<GridComponent | null>(null);

    return (
        <Card
            className="mb-6"
            sx={{
                borderRadius: 2,
                backgroundColor: dark ? 'var(--clr-bg-content-dark, #102B22)' : '#ffffff',
                border: '1px solid',
                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
            }}
        >
            <CardContent>
                <Box className="flex justify-between items-center mb-3">
                    <Typography variant="h6" sx={{ color: dark ? '#f8fafc' : '#0f172a', fontWeight: 600 }}>
                        {t('monitor.deviceOperations') || 'Device Operations'} ({devices.length})
                    </Typography>
                </Box>
                <Box className="w-full overflow-x-auto">
                    <GridComponent
                        key={`device-ops-grid-${currentLang || i18n.language}-${isRtl ? 'rtl' : 'ltr'}`}
                        ref={gridRef}
                        dataSource={devices}
                        allowPaging={true}
                        allowSorting={true}
                        allowFiltering={true}
                        allowExcelExport={true}
                        allowPdfExport={true}
                        enableRtl={isRtl}
                        toolbar={['ExcelExport', 'PdfExport', 'Search']}
                        toolbarClick={(args: ClickEventArgs) =>
                            handleGridToolbarClick(gridRef.current, args, {
                                fileName: isRtl ? 'عمليات_الأجهزة' : 'Device_Operations',
                                title: t('monitor.deviceOperations') || 'Device Operations',
                                isLandscape: true
                            })
                        }
                        pageSettings={{ pageSize: 10 }}
                        rowHeight={45}
                    >
                        <ColumnsDirective>
                            <ColumnDirective field="deviceCode" headerText={t('forms.deviceCode') || "Device Code"} width="160" textAlign="Center" />
                            <ColumnDirective field="name" headerText={t('forms.deviceName') || "Device Name"} width="200" textAlign="Center" />
                            <ColumnDirective field="deviceTypeName" headerText={t('forms.deviceType') || "Device Type"} width="180" textAlign="Center" />
                            <ColumnDirective field="locationName" headerText={t(['forms.location', 'common.location'], 'Location')} width="160" textAlign="Center" />
                            <ColumnDirective field="isActive" headerText={t('common.status') || "Status"} width="130" textAlign="Center" template={ActiveTemplate} />
                            <ColumnDirective field="lastResultAt" headerText={t('monitor.lastResult') || "Last Result"} width="180" textAlign="Center" />
                            <ColumnDirective field="resultsTodayCount" headerText={t('monitor.resultsToday') || "Results Today"} width="140" textAlign="Center" />
                        </ColumnsDirective>
                        <Inject services={[Page, Sort, Filter, Toolbar, Search, ExcelExport, PdfExport]} />
                    </GridComponent>
                </Box>
            </CardContent>
        </Card>
    );
};

export default DeviceOperationsGrid;
