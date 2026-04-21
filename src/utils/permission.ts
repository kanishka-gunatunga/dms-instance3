import { ParsedPermissions } from "@/context/userPermissions";

export const hasPermission = (
    permissions: ParsedPermissions | { [key: string]: string[] } | Record<string, unknown>,
    group: string,
    permission: string,
    sectorId?: number
  ): boolean => {
    // If it's the old flat structure or super_admin bypass (which might just pass {})
    if (!permissions || (!permissions.globalPermissions && !permissions.sectorPermissions)) {
        // Fallback to old behavior if it seems like a flat array/object
        return permissions[group]?.includes(permission) || false;
    }

    const { isAdmin, globalPermissions, sectorPermissions } = permissions as ParsedPermissions;

    if (isAdmin) {
        return true; 
    }

    if (sectorId !== undefined && sectorPermissions && sectorPermissions[sectorId]) {
        if (sectorPermissions[sectorId][group]?.includes(permission)) {
            return true;
        }
    }

    // Fallback to global permissions if specific sector check fails or no sector provided
    return globalPermissions[group]?.includes(permission) || false;
  };
  