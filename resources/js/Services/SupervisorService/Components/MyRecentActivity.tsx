import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    TableContainer,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody
} from '@mui/material';
import { useSupervisorContext } from "@/Services/SupervisorService/State/SupervisorContext";
import { useAppSelector } from "@/Redux/Store/hook";

const MyRecentActivity: React.FC = () => {
    const { data } = useSupervisorContext();
    const activity = data.recentActivity || [];
    const dark = useAppSelector(state => state.theme.dark);

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
                        My Recent Activity ({activity.length})
                    </Typography>
                </Box>
                {activity.length === 0 ? (
                    <Box className="p-6 text-center border rounded-lg" sx={{ backgroundColor: dark ? 'rgba(15,23,42,0.4)' : '#f8fafc' }}>
                        <Typography color="text.secondary">
                            You have not performed any supervisor actions yet today.
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer
                        component={Paper}
                        variant="outlined"
                        sx={{
                            borderRadius: 2,
                            backgroundColor: dark ? 'rgba(15, 23, 42, 0.4)' : '#ffffff',
                            borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        }}
                    >
                        <Table size="small">
                            <TableHead sx={{ backgroundColor: dark ? 'rgba(15, 23, 42, 0.8)' : '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>Test ID</TableCell>
                                    <TableCell sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>Patient / Donor</TableCell>
                                    <TableCell sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>Action</TableCell>
                                    <TableCell sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>Status Transition</TableCell>
                                    <TableCell sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>Reason / Note</TableCell>
                                    <TableCell align="right" sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>Timestamp</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {activity.map((act) => {
                                    const isConfirm = act.action === 'SUPERVISOR_CONFIRM';
                                    return (
                                        <TableRow key={act.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell component="th" scope="row" sx={{ color: dark ? '#cbd5e1' : '#334155', fontWeight: 600 }}>
                                                #{act.patientHeaderId}
                                            </TableCell>
                                            <TableCell sx={{ color: dark ? '#cbd5e1' : '#334155' }}>
                                                {act.patientCode} {act.donorName ? `(${act.donorName})` : ''}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={isConfirm ? 'Confirmed' : 'Rejected'}
                                                    color={isConfirm ? 'success' : 'error'}
                                                    size="small"
                                                    variant="filled"
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: dark ? '#cbd5e1' : '#334155' }}>
                                                <span className="text-xs text-gray-500">{act.previousStatus}</span> → <strong className="text-xs">{act.newStatus}</strong>
                                            </TableCell>
                                            <TableCell sx={{ color: dark ? '#cbd5e1' : '#334155', maxWidth: 200 }}>
                                                {act.reason || '-'}
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: dark ? '#94a3b8' : '#64748b', fontSize: '0.8rem' }}>
                                                {act.createdAt}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </CardContent>
        </Card>
    );
};

export default MyRecentActivity;
