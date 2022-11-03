export interface AppName {
    name: string;
}

export interface Address {
    houseNo: number;
    street: string;
    city: string;
}

export enum Level {
    Undergraduate = 'Undergraduate',
    Postgraduate = 'Postgraduate'
}

export interface Student {
    name: string;
    surname: string;
    age?: number;
    address?: Address;
    level?: Level;
}