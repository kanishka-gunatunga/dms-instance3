/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { getWithAuth } from "@/utils/apiClient";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { useUserContext } from "./userContext";

export interface ParsedPermissions {
  isAdmin: boolean;
  globalPermissions: { [key: string]: string[] };
  sectorPermissions: { [sectorId: number]: { [key: string]: string[] } };
}

const PermissionsContext = createContext<ParsedPermissions>({
  isAdmin: false,
  globalPermissions: {},
  sectorPermissions: {},
});

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<ParsedPermissions>({
    isAdmin: false,
    globalPermissions: {},
    sectorPermissions: {},
  });
  const { userId, userType } = useUserContext();
  const router = useRouter();

  useEffect(() => {
    if (!userId || userType === "super_admin") {
      if (userType === "super_admin") {
         setPermissions({
             isAdmin: true,
             globalPermissions: {},
             sectorPermissions: {}
         });
      }
      return;
    }

    const fetchRoleData = async () => {
      try {
        const response = await getWithAuth(`user-permissions/${userId}`);

        // Ensure valid response
        if (!response || response.status === "fail") {
          router.push("/unauthorized");
          return;
        }

        const isAdmin = response.is_admin || false;
        const permissionBlocks = response.permissions || [];
        
        const globalPermissions: { [key: string]: string[] } = {};
        const sectorPermissions: { [sectorId: number]: { [key: string]: string[] } } = {};

        // Parse the new structure
        permissionBlocks.forEach((block: { sector_id: number; permissions?: { group: string; items: string[] }[] }) => {
            const sectorId = block.sector_id;
            
            // Determine the target permission object (global or a specific sector)
            const target = sectorId === 0 
                ? globalPermissions 
                : (sectorPermissions[sectorId] || (sectorPermissions[sectorId] = {}));
            
            if (block.permissions) {
                block.permissions.forEach((permission: { group: string; items: string[] }) => {
                    if (!target[permission.group]) {
                        // If group doesn't exist, just copy the items
                        target[permission.group] = [...permission.items];
                    } else {
                        // If group exists, merge unique actions (items)
                        const existingItems = target[permission.group];
                        permission.items.forEach(item => {
                            if (!existingItems.includes(item)) {
                                existingItems.push(item);
                            }
                        });
                    }
                });
            }
        });

        // If we only have global permissions but we aren't explicitly admin, we might
        // still distribute them across all sectors if needed, but the hasPermission 
        // util will handle fallback to global.

        setPermissions({
            isAdmin,
            globalPermissions,
            sectorPermissions
        });
        
      } catch (error) {
        console.error("Failed to fetch role data:", error);
        router.push("/unauthorized");
      }
    };

    fetchRoleData();
  }, [userId, userType, router]);

  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  );
};


export const usePermissions = () => useContext(PermissionsContext);
