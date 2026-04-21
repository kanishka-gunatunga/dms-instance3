/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Heading from "@/components/common/Heading";
import DashboardLayout from "@/components/DashboardLayout";
import useAuth from "@/hooks/useAuth";
import React, { useState } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { postWithAuth } from "@/utils/apiClient";
import { IoSave } from "react-icons/io5";
import { MdOutlineCancel } from "react-icons/md";
import Link from "next/link";
import { Checkbox, Divider } from "antd";
import ToastMessage from "@/components/common/Toast";
import { SectorDropdownItem } from "@/types/types";


export default function AllDocTable() {
    const [roleName, setRoleName] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [toastType, setToastType] = useState<"success" | "error">("success");
    const [toastMessage, setToastMessage] = useState("");
    const [error, setError] = useState("");
    const [allSectors, setAllSectors] = useState<SectorDropdownItem[]>([]);
    const [selectedSectorIds, setSelectedSectorIds] = useState<number[]>([]);
    const [activeSectorId, setActiveSectorId] = useState<number | null>(null);
    const [sectorPermissions, setSectorPermissions] = useState<{ [key: number]: { [group: string]: string[] } }>({});
    const [apiCallFailed, setApiCallFailed] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
const [isAdmin, setIsAdmin] = useState(false);
    const isAuthenticated = useAuth();

    React.useEffect(() => {
        const loadSectors = async () => {
            try {
                const response = await getWithAuth('all-sectors');
                if (response && Array.isArray(response)) {
                    setAllSectors(response);
                }
            } catch (err) {
                console.error("Failed to load sectors", err);
            }
        };
        loadSectors();
    }, []);

    if (!isAuthenticated) {
        return <LoadingSpinner />;
    }

    const allGroups = [
        { name: "Dashboard", items: ["View Dashboard"] },
        { name: "All Documents", items: ["View Documents", "Create Document", "Edit Document", "Delete Document", "Archive Document", "Add Reminder", "Share Document", "Download Document", "Send Email", "Manage Sharable Link", "AI Options", "Upload New Version file", "Version History", "Comment", "Remove From Search"] },        
        { name: "Assigned Documents", items: ["Create Document", "Edit Document", "Share Document", "Upload New Version", "Delete Document", "Send Email", "Manage Sharable Link", "Upload New Version file", "Version History", "Comment", "Remove From Search", "Download", "Add Reminder", "Archive"] },
        { name: "Archived Documents", items: ["View Documents", "Restore Document", "Delete Document"] },
        { name: "Advanced Search", items: ["Advanced Search"] },
        { name: "Deep Search", items: ["Deep Search", "Add Indexing", "Remove Indexing"] },
        { name: "Document Categories", items: ["Manage Document Category"] },
        { name: "Bulk Upload", items: ["View Bulk Upload","Delete Bulk Upload","Create Bulk Upload", "Edit Bulk Upload",] },
        { name: "FTP Accounts", items: ["View FTP Accounts","Delete FTP Accounts","Create FTP Accounts", "Edit FTP Accounts",] },
        { name: "Attributes", items: ["View Attributes", "Add Attributes", "Edit Attributes","Delete Attributes"] },
        { name: "Sectors", items: ["Manage Sectors"] },
        { name: "Documents Audit Trail", items: ["View Document Audit Trail"] },
        { name: "User", items: ["View Users", "Create User", "Edit User", "Delete User", "Reset Password", "Assign User Role", "Assign Permission"] },
        { name: "Role", items: ["View Roles", "Create Role", "Edit Role", "Delete Role"] },
        { name: "Email", items: ["Manage SMTP Settings"] },
        { name: "Settings", items: ["Manage Languages", "Storage Settings", "Manage Company Profile"] },
        { name: "Reminder", items: ["View Reminders", "Create Reminder", "Edit Reminder", "Delete Reminder"] },
        { name: "Login Audits", items: ["View Login Audit Logs"] },
        { name: "Page Helpers", items: ["Manage Page Helper"] },
    ];
    
    // Get permissions for active sector
    const selectedGroups = activeSectorId ? (sectorPermissions[activeSectorId] || {}) : {};

    const setSelectedGroupsForActiveSector = (updater: (prev: { [key: string]: string[] }) => { [key: string]: string[] }) => {
        if (!activeSectorId) return;
        setSectorPermissions(prev => ({
            ...prev,
            [activeSectorId]: updater(prev[activeSectorId] || {})
        }));
    };

    const handleSelectAll = (checked: boolean) => {
        if (!activeSectorId) return;
        if (checked) {
            const updatedGroups: { [key: string]: string[] } = {};
            allGroups.forEach((group) => {
                updatedGroups[group.name] = group.items;
            });
            setSelectedGroupsForActiveSector(() => updatedGroups);
        } else {
            setSelectedGroupsForActiveSector(() => ({}));
        }
    };

    const handleGroupSelect = (checked: boolean, groupName: string, groupItems: string[]) => {
        if (!activeSectorId) return;
        setSelectedGroupsForActiveSector((prev) => {
            const updatedGroups = { ...prev };
            if (checked) {
                updatedGroups[groupName] = groupItems;
            } else {
                delete updatedGroups[groupName];
            }
            return updatedGroups;
        });
    };

    const handleIndividualSelect = (groupName: string, value: string, checked: boolean) => {
        if (!activeSectorId) return;
        setSelectedGroupsForActiveSector((prev) => {
            const updatedGroups = { ...prev };
            const groupItems = updatedGroups[groupName] || [];
            if (checked) {
                updatedGroups[groupName] = [...groupItems, value];
            } else {
                updatedGroups[groupName] = groupItems.filter((item) => item !== value);
                if (updatedGroups[groupName].length === 0) {
                    delete updatedGroups[groupName];
                }
            }
            return updatedGroups;
        });
    };

    const handleSectorToggle = (sectorId: number, checked: boolean) => {
        if (checked) {
            setSelectedSectorIds(prev => [...prev, sectorId]);
            if (!activeSectorId) setActiveSectorId(sectorId);
        } else {
            setSelectedSectorIds(prev => prev.filter(id => id !== sectorId));
            if (activeSectorId === sectorId) {
                const remaining = selectedSectorIds.filter(id => id !== sectorId);
                setActiveSectorId(remaining.length > 0 ? remaining[0] : null);
            }
            // Optional: clean up permissions for unselected sector
            setSectorPermissions(prev => {
                const updated = { ...prev };
                delete updated[sectorId];
                return updated;
            });
        }
    };

    const handleAddRolePermission = async () => {
        if (formSubmitted) return;
        if (!roleName.trim()) {
            setError("Role name is required.");
            return;
        }
        if (selectedSectorIds.length === 0) {
            setError("At least one sector must be selected.");
            return;
        }

        setError("");
        setApiCallFailed(false);
        setFormSubmitted(true);
        try {
            const permissionsData = selectedSectorIds.map(sectorId => {
                const sector = allSectors.find(s => s.id === sectorId);
                const groups = sectorPermissions[sectorId] || {};
                const itemsArray = Object.entries(groups).map(([group, items]) => ({
                    group,
                    items,
                }));
                return {
                    sector_id: sectorId,
                    sector_name: sector?.sector_name || "Unknown",
                    permissions: itemsArray
                };
            });

            const formData = new FormData();
            formData.append("role_name", roleName);
            formData.append("permissions", JSON.stringify(permissionsData));
            formData.append("is_admin", isAdmin ? "1" : "0");
            const response = await postWithAuth(`add-role`, formData);

            if (response.status === "success") {
                setToastType("success");
                setToastMessage("Role added successfully!");
                setShowToast(true);
                setTimeout(() => setShowToast(false), 5000);
                setFormSubmitted(false);
            } else {
                setToastType("error");
                setToastMessage("Failed to add role!");
                setShowToast(true);
                setTimeout(() => setShowToast(false), 5000);
                setFormSubmitted(false);
            }
        } catch (error) {
            setToastType("error");
            setToastMessage("Failed to add role!");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
            setFormSubmitted(false);
        }
    };


    return (
        <>
            <DashboardLayout>
                <div className="d-flex justify-content-between align-items-center pt-2">
                    <Heading text="Manage Role" color="#444" />
                </div>
                <div className="d-flex flex-column bg-white p-2 p-lg-3 rounded mt-3">

                    <div className="d-flex flex-column  custom-scroll" style={{ maxHeight: "80vh", overflowY: "auto" }}>
                        <div className="d-flex col-12 col-md-6 flex-column mb-3">
                            <p className="mb-1" style={{ fontSize: "14px" }}>
                                Role Name
                            </p>
                            <div className="input-group mb-1 pe-lg-4">
                                <input
                                    type="text"
                                    className={`form-control ${error ? "is-invalid" : ""}`}
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                />
                            </div>
                            {error && (
                                <div className="text-danger" style={{ fontSize: "12px" }}>
                                    {error}
                                </div>
                            )}
                        </div>
                        <Checkbox  className="mb-2"
                            checked={isAdmin}
                            onChange={(e) => setIsAdmin(e.target.checked)}
                        >
                           Enable Admin Dashboard
                        </Checkbox>   
                        <Heading text="Permission" color="#444" />
                        <div className="mt-2">
                            <Checkbox
                                checked={Object.keys(selectedGroups).length === allGroups.length}
                                indeterminate={
                                    Object.keys(selectedGroups).length > 0 && Object.keys(selectedGroups).length < allGroups.length
                                }
                                onChange={(e) => handleSelectAll(e.target.checked)}
                            >
                                Select All
                            </Checkbox>
                            <Divider />

                            {allGroups.map((group, groupIndex) => (
                                <div key={groupIndex} className="mb-4">
                                    <div className="ckeckbox-wrapper mb-2 me-2">
                                        <Checkbox
                                            checked={selectedGroups[group.name]?.length === group.items.length}
                                            indeterminate={
                                                selectedGroups[group.name]?.length > 0 &&
                                                selectedGroups[group.name]?.length < group.items.length
                                            }
                                            onChange={(e) => handleGroupSelect(e.target.checked, group.name, group.items)} 
                                            style={{fontWeight:"700"}}
                                            
                                        >
                                            {group.name}
                                        </Checkbox>
                                        <div style={{ marginLeft: "20px" }}>
                                            {group.items.map((item, itemIndex) => (
                                                <Checkbox
                                                    key={itemIndex}
                                                    checked={selectedGroups[group.name]?.includes(item)}
                                                    onChange={(e) => handleIndividualSelect(group.name, item, e.target.checked)}
                                                >
                                                    {item}
                                                </Checkbox>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Divider />

                            {/* <pre>{JSON.stringify(selectedArray, null, 2)}</pre> */}
                            <div className="d-flex flex-row"
                            >
                                <button
                                    disabled={(formSubmitted)}
                                    onClick={() => handleAddRolePermission()}
                                    className="custom-icon-button button-success px-3 py-1 rounded me-2"
                                >
                                    <IoSave fontSize={16} className="me-1" /> Yes
                                </button>
                                <Link
                                    href={"/roles"}
                                    className="custom-icon-button button-danger text-white bg-danger px-3 py-1 rounded"
                                >
                                    <MdOutlineCancel fontSize={16} className="me-1" /> No
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
            <ToastMessage
          message={toastMessage}
          show={showToast}
          onClose={() => setShowToast(false)}
          type={toastType}
        />
        </>
    );
}

