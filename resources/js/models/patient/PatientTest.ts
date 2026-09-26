class PatientTest {
    id: number;
    patientHeaderId: number;
    substance: string;
    softwareResult: string;
    visualResult: string;
    createdAt: string;

    constructor({
                    id = -1,
        patientHeaderId = -1,
        substance = '',
        softwareResult = '',
        visualResult = '',
        createdAt = '',
                }) {
        this.id = id;
        this.patientHeaderId = patientHeaderId;
        this.substance = substance;
        this.softwareResult = softwareResult;
        this.visualResult = visualResult;
        this.createdAt = createdAt;
    }
}

export default PatientTest;
