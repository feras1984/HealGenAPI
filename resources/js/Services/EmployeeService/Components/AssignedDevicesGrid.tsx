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
import { useEmployeeContext } from "@/Services/EmployeeService/State/EmployeeContext";
import { useAppSelector } from "@/Redux/Store/hook";
import { useTranslation } from "react-i18next";

const StatusTemplate = (props: any) => {
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

const AssignedDevicesGrid: React.FC = () => {
    const { data } = useEmployeeContext();
    const { t, i18n } = useTranslation();
    const devices = data.assignedDevices || [];
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl = direction === 'rtl' || currentLang === 'ar' || i18n.language === 'ar';
    const gridRef = useRef<GridComponent | null>(null);

    return (
        <Card
            className="mb-6"
            sx={{
                borderRadius: 2,
                backgroundColor: dark ? 'var(--clr-bg-content-dark, #334155)' : '#ffffff',
                border: '1px solid',
                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
            }}
        >
            <CardContent>
                <Box className="flex justify-between items-center mb-3">
                    <Typography variant="h6" color="text.primary" className="font-semibold">
                        {t('employee.myAssignedDevices') || 'My Assigned Devices'} ({devices.length})
                    </Typography>
                </Box>
                {devices.length === 0 ? (
                    <Box className="p-6 text-center border rounded-lg" sx={{ backgroundColor: dark ? 'rgba(15,23,42,0.4)' : '#f8fafc' }}>
                        <Typography color="text.secondary">
                            {t('employee.noAssignedDevices') || 'You currently have no assigned devices. Contact your Administrator to assign devices to your account.'}
                        </Typography>
                    </Box>
                ) : (
                    <Box className="w-full overflow-x-auto">
                        <GridComponent
                            key={`assigned-devices-grid-${currentLang || i18n.language}-${isRtl ? 'rtl' : 'ltr'}`}
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
                                    fileName: isRtl ? 'أجهزتي_المخصصة' : 'My_Assigned_Devices',
                                    title: t('employee.myAssignedDevices') || 'My Assigned Devices',
                                    isLandscape: false
                                })
                            }
                            pageSettings={{ pageSize: 5 }}
                            rowHeight={45}
                        >
                            <ColumnsDirective>
                                <ColumnDirective field="deviceCode" headerText={t('tests.deviceCode') || 'Device Code'} width="160" textAlign="Center" />
                                <ColumnDirective field="name" headerText={t('tests.deviceName') || 'Device Name'} width="200" textAlign="Center" />
                                <ColumnDirective field="deviceTypeName" headerText={t('tests.deviceType') || 'Device Type'} width="180" textAlign="Center" />
                                <ColumnDirective field="locationName" headerText={t('tests.location') || 'Location'} width="160" textAlign="Center" />
                                <ColumnDirective field="isActive" headerText={t('common.status') || 'Status'} width="130" textAlign="Center" template={StatusTemplate} />
                            </ColumnsDirective>
                            <Inject services={[Page, Sort, Filter, Toolbar, Search, ExcelExport, PdfExport]} />
                        </GridComponent>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default AssignedDevicesGrid;
