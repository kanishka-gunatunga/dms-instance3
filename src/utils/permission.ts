import { ParsedPermissions } from "@/context/userPermissions";

export const hasPermission = (
    permissions: ParsedPermissions | { [key: string]: string[] } | Record<string, unknown>,
    group: string,
    permission?: string,
    sectorId?: number
  ): boolean => {
    // If it's the old flat structure or super_admin bypass (which might just pass {})
    if (!permissions || (!('globalPermissions' in permissions) && !('sectorPermissions' in permissions))) {
        // Fallback to old behavior if it seems like a flat array/object
        const flatPermissions = permissions as Record<string, string[]>;
        if (!permission) return !!flatPermissions[group];
        return flatPermissions[group]?.includes(permission) || false;
    }

    const { isAdmin, globalPermissions, sectorPermissions } = permissions as ParsedPermissions;

    if (isAdmin) {
        return true; 
    }

    if (!permission) {
        // Group-only validation
        if (sectorId !== undefined && sectorPermissions && sectorPermissions[sectorId]) {
            if (sectorPermissions[sectorId][group]) {
                return true;
            }
        }

        if (sectorId === undefined && sectorPermissions) {
            for (const sId in sectorPermissions) {
                if (sectorPermissions[sId][group]) {
                    return true;
                }
            }
        }

        return !!globalPermissions[group];
    }

    if (sectorId !== undefined && sectorPermissions && sectorPermissions[sectorId]) {
        if (sectorPermissions[sectorId][group]?.includes(permission)) {
            return true;
        }
    }

    // NEW: If no sectorId is provided, check ALL sectors (aggregation)
    // This allows sidebar items to show if the user has permission in at least one sector.
    if (sectorId === undefined && sectorPermissions) {
        for (const sId in sectorPermissions) {
            if (sectorPermissions[sId][group]?.includes(permission)) {
                return true;
            }
        }
    }

    // Fallback to global permissions if specific sector check fails or no sector provided
    return globalPermissions[group]?.includes(permission) || false;
  };
  