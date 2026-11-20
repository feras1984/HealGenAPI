import React, { useState, useRef } from 'react';
import { Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    Chip
} from "@mui/material";
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
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
import { SystemAuditLogItem, AuditLogFilterParams } from "@/models/audit/SystemAuditLogData";
import { useAppSelector } from "@/Redux/Store/hook";
import { useTranslation } from "react-i18next";
import axios from 'axios';

interface AuditLogListProps {
    logs: SystemAuditLogItem[];
    initialFilters?: AuditLogFilterParams;
}

const ActionTemplate = (props: any) => {
    const action = props.action || 'LOG';
    let color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" = "info";

    if (action.includes('ACCEPT') || action.includes('CONFIRM') || action.includes('CREATE')) {
        color = "success";
    } else if (action.includes('REJECT') || action.includes('DELETE')) {
        color = "error";
    } else if (action.includes('UPDATE') || action.includes('ASSIGN')) {
        color = "warning";
    }

    return (
        <Chip
            label={action}
            color={color}
            size="small"
            variant="filled"
            sx={{ fontWeight: 600 }}
        />
    );
};

const RoleTemplate = (props: any) => {
    const { t } = useTranslation();
    const role = props.role;
    return <span>{t(`roles.${role}`) || role}</span>;
};

const AuditLogList: React.FC<AuditLogListProps> = ({ logs: initialLogs, initialFilters = {} }) => {
    const [logs, setLogs] = useState<SystemAuditLogItem[]>(initialLogs);
    const [filters, setFiltersState] = useState<AuditLogFilterParams>(initialFilters);
    const [loading, setLoading] = useState<boolean>(false);
    const { t, i18n } = useTranslation();
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl = direction === 'rtl' || currentLang === 'ar' || i18n.language === 'ar';
    const gridRef = useRef<GridComponent | null>(null);

    const fetchLogs = (currentFilters: AuditLogFilterParams) => {
        setLoading(true);
        axios.get<{ status: boolean; data: SystemAuditLogItem[] }>('/audit-logs/data', {
            params: currentFilters
        }).then(res => {
            if (res.data && res.data.data) {
                setLogs(res.data.data);
            }
        }).finally(() => {
            setLoading(false);
        });
    };

    const updateFilter = (key: keyof AuditLogFilterParams, value: any) => {
        const next = { ...filters, [key]: value };
        setFiltersState(next);
        fetchLogs(next);
    };

    const clearFilters = () => {
        setFiltersState({});
        fetchLogs({});
    };

    return (
        <AdminLayout>
            <Head title={t('nav.auditLogs') || 'System Audit Logs'} />
            <Box className="p-6">
                <Box className="flex justify-between items-center mb-6">
                    <Typography variant="h4" color="text.primary" className="font-bold">
                        {t('nav.auditLogs') || 'System Audit Logs'}
                    </Typography>
                </Box>

                {/* Filter Toolbar */}
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
                        <Typography variant="h6" color="text.primary" className="font-semibold mb-4">
                            {t('filters.operationalFilters') || 'Audit Trail Filters'}
                        </Typography>
                        <Grid container spacing={2} alignItems="center" justifyContent="flex-start">
                            <Grid item xs={12} sm={6} md={2.5} sx={{ flexGrow: 1, minWidth: 200 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>{t('forms.role') || 'Role'}</InputLabel>
                                    <Select
                                        value={filters.role || ''}
                                        label={t('forms.role') || 'Role'}
                                        onChange={(e) => updateFilter('role', e.target.value)}
                                    >
                                        <MenuItem value="">{t('common.all') || 'All Roles'}</MenuItem>
                                        <MenuItem value="Administrator">{t('roles.Administrator') || 'Administrator'}</MenuItem>
                                        <MenuItem value="Supervisor">{t('roles.Supervisor') || 'Supervisor'}</MenuItem>
                                        <MenuItem value="Inspector">{t('roles.Inspector') || 'Inspector'}</MenuItem>
                                        <MenuItem value="Employee">{t('roles.Employee') || 'Employee'}</MenuItem>
                                        <MenuItem value="System">System</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6} md={2} sx={{ flexGrow: 1, minWidth: 170 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="date"
                                    label={t('filters.date') || 'Date'}
                                    InputLabelProps={{ shrink: true }}
                                    value={filters.date || ''}
                                    onChange={(e) => updateFilter('date', e.target.value)}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={3} sx={{ flexGrow: 1, minWidth: 220 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label={t('filters.search') || 'Search'}
                                    placeholder={t('placeholders.search') || 'User, Action, Details...'}
                                    value={filters.search || ''}
                                    onChange={(e) => updateFilter('search', e.target.value)}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md="auto" sx={{ minWidth: 120 }}>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    startIcon={<FilterAltOffIcon />}
                                    onClick={clearFilters}
                                    size="small"
                                    fullWidth
                                >
                                    {t('filters.reset') || 'Reset'}
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Audit Logs Grid */}
                <Card
                    sx={{
                        borderRadius: 2,
                        backgroundColor: dark ? 'var(--clr-bg-content-dark, #334155)' : '#ffffff',
                        border: '1px solid',
                        borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
                    }}
                >
                    <CardContent>
                        <Typography variant="h6" color="text.primary" className="font-semibold mb-3">
                            {t('nav.auditLogs') || 'Audit Trail Log Entries'} ({logs.length})
                        </Typography>
                        {logs.length === 0 ? (
                            <Box className="p-8 text-center border rounded-lg" sx={{ backgroundColor: dark ? 'rgba(15,23,42,0.4)' : '#f8fafc' }}>
                                <Typography color="text.secondary">
                                    {t('dashboard.noTestsRecorded') || 'No audit log records match the selected filters.'}
                                </Typography>
                            </Box>
                        ) : (
                            <Box className="w-full overflow-x-auto">
                                <GridComponent
                                    key={`audit-log-grid-${currentLang || i18n.language}-${isRtl ? 'rtl' : 'ltr'}`}
                                    ref={gridRef}
                                    dataSource={logs}
                                    allowPaging={true}
                                    allowSorting={true}
                                    allowFiltering={true}
                                    allowExcelExport={true}
                                    allowPdfExport={true}
                                    enableRtl={isRtl}
                                    toolbar={['ExcelExport', 'PdfExport', 'Search']}
                                    toolbarClick={(args: ClickEventArgs) =>
                                        handleGridToolbarClick(gridRef.current, args, {
                                            fileName: isRtl ? 'سجلات_التدقيق' : 'System_Audit_Logs',
                                            title: t('nav.auditLogs') || 'System Audit Logs',
                                            isLandscape: true
                                        })
                                    }
                                    pageSettings={{ pageSize: 15 }}
                                    rowHeight={45}
                                >
                                    <ColumnsDirective>
                                        <ColumnDirective field="id" headerText={t('common.id') || 'ID'} width="80" textAlign="Center" />
                                        <ColumnDirective field="userName" headerText={t('forms.employee') || 'User'} width="160" textAlign="Center" />
                                        <ColumnDirective field="role" headerText={t('forms.role') || 'Role'} width="140" textAlign="Center" template={RoleTemplate} />
                                        <ColumnDirective field="action" headerText={t('tests.action') || 'Action'} width="180" textAlign="Center" template={ActionTemplate} />
                                        <ColumnDirective field="entityType" headerText={t('common.details') || 'Entity'} width="140" textAlign="Center" />
                                        <ColumnDirective field="entityId" headerText={t('common.id') || 'Entity ID'} width="100" textAlign="Center" />
                                        <ColumnDirective field="details" headerText={t('forms.description') || 'Details'} width="280" textAlign="Left" />
                                        <ColumnDirective field="ipAddress" headerText={t('forms.ipAddress') || 'IP Address'} width="130" textAlign="Center" />
                                        <ColumnDirective field="createdAt" headerText={t('tests.timestamp') || 'Timestamp'} width="180" textAlign="Center" />
                                    </ColumnsDirective>
                                    <Inject services={[Page, Sort, Filter, Toolbar, Search, ExcelExport, PdfExport]} />
                                </GridComponent>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </AdminLayout>
    );
};

export default AuditLogList;
