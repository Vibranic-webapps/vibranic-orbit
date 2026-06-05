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
    category?: { 
        id: string; 
        name: string; 
        color: string; 
        icon: string 
    } | null;
}
