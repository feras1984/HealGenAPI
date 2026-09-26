class DeviceUser {
    id: number;
    deviceId: number;
    userId: number;
    deviceName: string;
    deviceCode: string;
    userName: string;
    userEmail: string;
    assignedAt: string;
    unassignedAt: string;
    isActive: boolean;
    createdAt: string;

    constructor({
        id = -1,
        deviceId = -1,
        userId = -1,
        deviceName = '',
        deviceCode = '',
        userName = '',
        userEmail = '',
        assignedAt = '',
        unassignedAt = '',
        isActive = true,
        createdAt = '',
    } = {}) {
        this.id = id;
        this.deviceId = deviceId;
        this.userId = userId;
        this.deviceName = deviceName;
        this.deviceCode = deviceCode;
        this.userName = userName;
        this.userEmail = userEmail;
        this.assignedAt = assignedAt;
        this.unassignedAt = unassignedAt;
        this.isActive = isActive;
        this.createdAt = createdAt;
    }
}

export default DeviceUser;
