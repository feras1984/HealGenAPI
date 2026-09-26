import React from 'react';
import CustomButton from "@/Components/Button/CustomButton";
import { DeviceUserGridProps } from "@/Services/DeviceUserService/Interfaces/DeviceUserProps";
import { useDeviceUserContext } from "@/Services/DeviceUserService/State/DeviceUserContext";

const UnassignButton = (props: DeviceUserGridProps) => {
    const { unassign, reassign, loading } = useDeviceUserContext();

    const handleUnassign = () => {
        if (unassign) {
            unassign(props.id);
        }
    };

    const handleReassign = () => {
        if (reassign) {
            reassign(props.id);
        }
    };

    if (!props.isActive) {
        return (
            <button
                type="button"
                onClick={handleReassign}
                disabled={loading}
                className="px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
            >
                Reassign
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={handleUnassign}
            disabled={loading}
            className="px-3 py-1 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
        >
            Unassign
        </button>
    );
};

export default UnassignButton;
