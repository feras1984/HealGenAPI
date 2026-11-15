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
    reviewedBy?: {
        id?: number;
        name?: string;
        email?: string;
        action?: string;
        reviewedAt?: string;
        reason?: string;
    } | null;
    attachment?: {
        id: number;
        name: string;
        url: string;
        downloadUrl: string;
        isImage: boolean;
        description?: string;
        createdAt: string;
    } | null;
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
        reviewedBy = null,
        attachment = null,
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
        this.reviewedBy = reviewedBy;
        this.attachment = attachment;
        this.createdAt = createdAt;
    }
}

export default PatientHeader;
