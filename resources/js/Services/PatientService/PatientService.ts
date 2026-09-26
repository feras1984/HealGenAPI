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
            deviceCode: patient.device?.deviceCode ?? '',
            deviceName: patient.device?.name ?? '',
            locationName: patient.device?.locationName ?? '',
            tests : [...patient.tests],
            createdAt : patient.createdAt,
        }))
    }
}

export default PatientService;
