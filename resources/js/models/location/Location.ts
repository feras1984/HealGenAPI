class Location {
    id: number;
    name: string;
    code: string;
    address: string;
    city: string;
    country: string;
    isActive: boolean;
    notes: string;
    createdAt: string;

    constructor({
        id = -1,
        name = '',
        code = '',
        address = '',
        city = '',
        country = '',
        isActive = true,
        notes = '',
        createdAt = '',
    } = {}) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.address = address;
        this.city = city;
        this.country = country;
        this.isActive = isActive;
        this.notes = notes;
        this.createdAt = createdAt;
    }
}

export default Location;
