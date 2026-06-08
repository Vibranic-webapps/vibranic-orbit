export interface Category {
    id: string;
    name: string;
    color: string;
    icon: string;
    userId: string;
}

export interface Task {
    id: string;
    name: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    priority: "EXTRA_SMALL" | "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE";
    completed: boolean;
    favorite: boolean;
    categoryId?: string;
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
