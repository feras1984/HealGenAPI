import PatientTest from "@/models/patient/PatientTest";
import Device from "@/models/device/Device";

class PatientHeader {
    id: number;
    patientId: string;
    donorId: string;
    collectionSite: string;
    cupLotNumber: string;
    status: string;
    device?: Device | null;
    tests: PatientTest[];
    createdAt: string;

    constructor( {
        id = -1,
        patientId = '',
        donorId = '',
        collectionSite = '',
        cupLotNumber = '',
        status = '',
        device = null as Device | null,
        tests = [] as PatientTest[],
        createdAt = '',
                 } = {}) {
        this.id = id;
        this.patientId = patientId;
        this.donorId = donorId;
        this.collectionSite = collectionSite;
        this.cupLotNumber = cupLotNumber;
        this.status = status;
        this.device = device ? new Device(device) : null;
        this.tests = [...tests];
        this.createdAt = createdAt;
    }
}

export default PatientHeader;
