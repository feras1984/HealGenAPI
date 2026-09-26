class DeviceType {
    id: number;
    name: string;
    manufacturer: string;
    model: string;
    description: string;
    isActive: boolean;
    createdAt: string;

    constructor({
        id = -1,
        name = '',
        manufacturer = '',
        model = '',
        description = '',
        isActive = true,
        createdAt = '',
    } = {}) {
        this.id = id;
        this.name = name;
        this.manufacturer = manufacturer;
        this.model = model;
        this.description = description;
        this.isActive = isActive;
        this.createdAt = createdAt;
    }
}

export default DeviceType;
