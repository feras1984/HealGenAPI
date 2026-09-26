class Device {
    id: number;
    locationId: number;
    deviceTypeId: number;
    locationName: string;
    deviceTypeName: string;
    name: string;
    deviceCode: string;
    serialNumber: string;
    ipAddress: string;
    isActive: boolean;
    lastSeenAt: string;
    activatedAt: string;
    deactivatedAt: string;
    notes: string;
    createdAt: string;

    constructor({
        id = -1,
        locationId = -1,
        deviceTypeId = -1,
        locationName = '',
        deviceTypeName = '',
        name = '',
        deviceCode = '',
        serialNumber = '',
        ipAddress = '',
        isActive = true,
        lastSeenAt = '',
        activatedAt = '',
        deactivatedAt = '',
        notes = '',
        createdAt = '',
    } = {}) {
        this.id = id;
        this.locationId = locationId;
        this.deviceTypeId = deviceTypeId;
        this.locationName = locationName;
        this.deviceTypeName = deviceTypeName;
        this.name = name;
        this.deviceCode = deviceCode;
        this.serialNumber = serialNumber;
        this.ipAddress = ipAddress;
        this.isActive = isActive;
        this.lastSeenAt = lastSeenAt;
        this.activatedAt = activatedAt;
        this.deactivatedAt = deactivatedAt;
        this.notes = notes;
        this.createdAt = createdAt;
    }
}

export default Device;
