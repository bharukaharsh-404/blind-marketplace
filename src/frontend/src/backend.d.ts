import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PublicOrder {
    status: string;
    title: string;
    createdAt: bigint;
    description: string;
    orderId: string;
    budget: bigint;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createOrder(title: string, description: string, budget: bigint): Promise<string>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyOrders(): Promise<Array<PublicOrder>>;
    getMyPseudonym(): Promise<string | null>;
    getOrderById(orderId: string): Promise<PublicOrder | null>;
    getOrders(): Promise<Array<PublicOrder>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    registerUser(): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
