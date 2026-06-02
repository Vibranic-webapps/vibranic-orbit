import { DynamicIcon, type IconName } from "lucide-react/dynamic";

interface IconPickerProps {
    value: string;
    onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    const ICONS: IconName[] = ["briefcase", "calendar-days", "heart", "house", "star"];
    return (
        <div className="flex space-x-2">
            {ICONS.map((icon) => (
                <button
                    key={icon}
                    onClick={() => onChange(icon)}
                    className={`p-2 rounded-md ${value === icon ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
                >
                    <DynamicIcon name={icon} size={16} />
                </button>
            ))}
        </div>
    );
}