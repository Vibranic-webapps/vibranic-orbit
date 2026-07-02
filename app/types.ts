export interface Category {
    id: string;
    name: string;
    color: string;
    icon: string;
    userId: string;
}

export interface TodoState {
    id: string;
    name: string;
    color: string;
    order: number;
    userId: string;
}

export interface Task {
    id: string;
    name: string;
    description?: string;
    startDateTime: string | null;
    endDateTime: string | null;
    priority: "EXTRA_SMALL" | "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE";
    completed: boolean;
    favorite: boolean;
    categoryId?: string | null;
    categoryRemoved: boolean;
    userId: string;
    frequency: "DAILY" | "WEEKLY" | "MONTHLY" | null;
    interval: number;
    byWeekday: number[];
    recurrenceEnd: string | null;
    category?: {
        id: string;
        name: string;
        color: string;
        icon: string
    } | null;
    stateId?: string | null;
    order?: number;
    state?: {
        id: string;
        name: string;
        color: string;
    } | null;
}

export type TaskFormValues = {
    name: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
    priority: Task["priority"];
    categoryId: string;
    frequency: string;
    interval: number;
    byWeekday: number[];
    recurrenceEnd: string;
};

export type FormErrors = Partial<Record<keyof TaskFormValues, string>>;

export type PlanetBody = {
    id: string;
    band: string;
    color: string;
    priority: Task["priority"];
    size: number;
    icon: string | null;
    name: string;
    description: string | null
    due: string;
    category: string | null;
    urgency: number;
    overdue: boolean;
};
