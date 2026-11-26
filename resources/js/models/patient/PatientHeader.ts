import PatientTest from "@/models/patient/PatientTest";
import Device from "@/models/device/Device";

export interface PatientActionAttribution {
    id?: number;
    name?: string;
    email?: string;
    role?: string;
    action?: string;
    at?: string;
    reviewedAt?: string;
    atIso?: string | null;
    reason?: string;
}

export interface TestHistoryEntry {
    id: string;
    type: 'EMPLOYEE_SUBMISSION' | 'FILE_UPLOADED' | 'INSPECTOR_ACCEPT' | 'INSPECTOR_REJECT' | 'EXPERT_REVIEW' | 'EXPERT_CONFIRM' | 'EXPERT_REJECT' | string;
    rawAction: string;
    actorId?: number | null;
    actorName: string;
    actorRole: string;
    previousStatus?: string | null;
    newStatus?: string | null;
    reason?: string | null;
    isDirect?: boolean;
    at: string;
    atIso?: string | null;
}

export interface WorkflowStageDelay {
    key: 'capture_to_receive' | 'receive_to_inspection' | 'inspection_to_supervision';
    seconds: number;
    hours: number;
    formatted: string;
    isDelayed: boolean;
    isOngoing: boolean;
}

export interface WorkflowDelaySummary {
    thresholdHours: number;
    hasDelay: boolean;
    delayedCount: number;
    maxDelayHours: number;
    maxDelayFormatted: string | null;
    delayedStages: Array<'capture_to_receive' | 'receive_to_inspection' | 'inspection_to_supervision'>;
    stages: {
        captureToReceive: WorkflowStageDelay | null;
        receiveToInspection: WorkflowStageDelay | null;
        inspectionToSupervision: WorkflowStageDelay | null;
    };
}

class PatientHeader {
    id: number;
    patientId: string;
    donorId: string;
    collectionSite: string;
    cupLotNumber: string;
    status: string;
    ingestionSource?: 'excel' | 'pdf';
    canManageAttachment?: boolean;
    device?: Device | null;
    tests: PatientTest[];
    reviewedBy?: PatientActionAttribution | null;
    inspectedBy?: PatientActionAttribution | null;
    confirmedBy?: PatientActionAttribution | null;
    attachment?: {
        id: number;
        name: string;
        url: string;
        downloadUrl: string;
        isImage: boolean;
        description?: string;
        createdAt: string;
    } | null;
    deviceCapturedAt?: string | null;
    capturedAt?: string;
    capturedAtIso?: string | null;
    receivedAt?: string;
    receivedAtIso?: string | null;
    inspectedAt?: string | null;
    confirmedAt?: string | null;
    createdAt: string;
    delaySummary?: WorkflowDelaySummary | null;
    history?: TestHistoryEntry[];
    isDirectExpertDecision?: boolean;
    canExpertDecide?: boolean;

    constructor({
        id = -1,
        patientId = '',
        donorId = '',
        collectionSite = '',
        cupLotNumber = '',
        status = '',
        ingestionSource = 'excel' as 'excel' | 'pdf',
        canManageAttachment = undefined as boolean | undefined,
        device = null as Device | null,
        tests = [] as PatientTest[],
        reviewedBy = null as PatientActionAttribution | null,
        inspectedBy = null as PatientActionAttribution | null,
        confirmedBy = null as PatientActionAttribution | null,
        attachment = null,
        deviceCapturedAt = null,
        capturedAt = '',
        capturedAtIso = null,
        receivedAt = '',
        receivedAtIso = null,
        inspectedAt = null,
        confirmedAt = null,
        createdAt = '',
        delaySummary = null as WorkflowDelaySummary | null,
        history = [] as TestHistoryEntry[],
        isDirectExpertDecision = false,
        canExpertDecide = false,
    } = {}) {
        this.id = id;
        this.patientId = patientId;
        this.donorId = donorId;
        this.collectionSite = collectionSite;
        this.cupLotNumber = cupLotNumber;
        this.status = status;
        this.ingestionSource = ingestionSource === 'pdf' ? 'pdf' : 'excel';
        this.canManageAttachment = canManageAttachment ?? this.ingestionSource !== 'pdf';
        this.device = device ? new Device(device) : null;
        this.tests = [...tests];
        this.reviewedBy = reviewedBy || inspectedBy;
        this.inspectedBy = inspectedBy || reviewedBy;
        this.confirmedBy = confirmedBy;
        this.attachment = attachment;
        this.deviceCapturedAt = deviceCapturedAt;
        this.capturedAt = capturedAt || createdAt;
        this.capturedAtIso = capturedAtIso;
        this.receivedAt = receivedAt || createdAt;
        this.receivedAtIso = receivedAtIso;
        this.inspectedAt = inspectedAt;
        this.confirmedAt = confirmedAt;
        this.createdAt = createdAt;
        this.delaySummary = delaySummary;
        this.history = [...history];
        this.isDirectExpertDecision = isDirectExpertDecision;
        this.canExpertDecide = canExpertDecide;
    }
}

export default PatientHeader;
