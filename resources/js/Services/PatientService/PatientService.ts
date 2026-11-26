import {Service} from "typedi";
import PatientHeader from "@/models/patient/PatientHeader";
import {PatientGridProps} from "@/Services/PatientService/PatientList/Interfaces/PatientProps";

@Service()
class PatientService {
    mapBlocksGrid = (patients: PatientHeader []): PatientGridProps [] => {
        return patients.map(patient => ({
            id : patient.id,
            patientId : patient.patientId,
            donorId : patient.donorId,
            collectionSite : patient.collectionSite,
            cupLotNumber : patient.cupLotNumber,
            status : patient.status,
            ingestionSource: patient.ingestionSource ?? 'excel',
            canManageAttachment: patient.canManageAttachment ?? patient.ingestionSource !== 'pdf',
            deviceCode: patient.device?.deviceCode ?? '',
            deviceName: patient.device?.name ?? '',
            locationName: patient.device?.locationName ?? '',
            tests : [...patient.tests],
            attachment: patient.attachment ?? null,
            delaySummary: patient.delaySummary ?? null,
            delayStatusLabel: patient.delaySummary?.hasDelay
                ? `Delayed (${patient.delaySummary.maxDelayFormatted || ''})`
                : 'On Time',
            capturedAt: patient.capturedAt || patient.createdAt || '-',
            receivedAt: patient.receivedAt || patient.createdAt || '-',
            inspectedAt: patient.inspectedAt || patient.inspectedBy?.at || patient.reviewedBy?.reviewedAt || '-',
            confirmedAt: patient.confirmedAt || patient.confirmedBy?.at || '-',
            createdAt : patient.createdAt,
        }))
    }
}

export default PatientService;
