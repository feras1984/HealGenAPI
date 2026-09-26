import ListProps from "@/Components/Lists/Interfaces/ListProps";
import PatientHeader from "@/models/patient/PatientHeader";
import PatientTest from "@/models/patient/PatientTest";

interface PatientProps extends ListProps {
    patients: PatientHeader [],
}

export default PatientProps;

export interface PatientGridProps {
    id: number;
    patientId: string;
    donorId: string;
    collectionSite: string;
    cupLotNumber: string;
    status: string;
    deviceId?: number | null;
    deviceCode?: string | null;
    deviceName?: string | null;
    locationName?: string | null;
    deviceTypeName?: string | null;
    tests: PatientTest[];
    createdAt: string;
}
