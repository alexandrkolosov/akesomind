import React, { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import AllFolders from "../components/file-manager/AllFolders";
import RecentFileTable from "../components/file-manager/RecentFileTable";
import FolderFileList from "../components/file-manager/FolderFileList";
import { FileData } from "../../src/types";

// Initial folder data (dummy data)
const initialFolders: FileData[] = [
    {
        id: "1",
        icon: <i className="fas fa-folder" />,
        title: "Images",
        usage: "Folder for images",
        fileCount: 345,
        storageUsed: "26.40 GB",
        iconStyle: "bg-yellow-100 text-yellow-500",
    },
    {
        id: "2",
        icon: <i className="fas fa-folder" />,
        title: "Documents",
        usage: "Folder for documents",
        fileCount: 130,
        storageUsed: "26.40 GB",
        iconStyle: "bg-blue-100 text-blue-500",
    },
    {
        id: "3",
        icon: <i className="fas fa-folder" />,
        title: "Apps",
        usage: "Folder for apps",
        fileCount: 130,
        storageUsed: "26.40 GB",
        iconStyle: "bg-green-100 text-green-500",
    },
    {
        id: "4",
        icon: <i className="fas fa-folder" />,
        title: "Downloads",
        usage: "Folder for downloads",
        fileCount: 345,
        storageUsed: "26.40 GB",
        iconStyle: "bg-red-100 text-red-500",
    },
];

// Dummy file data for folder file list demo
const dummyFiles = [
    { id: "1", name: "Image1.jpg", size: "2 MB", type: "Image" },
    { id: "2", name: "Image2.png", size: "3 MB", type: "Image" },
    { id: "3", name: "Image3.jpeg", size: "1.5 MB", type: "Image" },
];

export default function FileManager() {
    // State for folders
    const [folders, setFolders] = useState<FileData[]>(initialFolders);
    // State for currently selected folder (to view its file list)
    const [selectedFolder, setSelectedFolder] = useState<FileData | null>(null);

    // When a folder is clicked
    const handleFolderClick = (folder: FileData) => {
        setSelectedFolder(folder);
        // Optionally, fetch folder files here.
    };

    // Close the file list modal
    const closeFolderFileList = () => {
        setSelectedFolder(null);
    };

    // Handle creation of a new folder
    const handleCreateFolder = () => {
        const folderName = prompt("Enter new folder name:");
        if (folderName && folderName.trim() !== "") {
            const newFolder: FileData = {
                id: Date.now().toString(), // using timestamp as unique id
                icon: <i className="fas fa-folder" />,
                title: folderName,
                usage: `Folder for ${folderName}`,
                fileCount: 0,
                storageUsed: "0 GB",
                iconStyle: "bg-gray-100 text-gray-500",
            };
            setFolders([...folders, newFolder]);
        }
    };

    return (
        <>
            <PageMeta
                title="AkesoMind - File Manager"
                description="The safest place to keep your files"
            />
            <PageBreadcrumb pageTitle="File Manager" />
            {/* New Folder Button */}
            <div className="mb-4 flex justify-start">
                <button
                    onClick={handleCreateFolder}
                    className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
                >
                    New Folder
                </button>
            </div>
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 xl:col-span-8">
                    {/* Pass folder list and click handler to AllFolders */}
                    <AllFolders folders={folders} onFolderClick={handleFolderClick} />
                </div>
                <div className="col-span-12">
                    <RecentFileTable
                        onFileClick={(file) => {
                            // Handle file click if needed
                            console.log("File clicked:", file);
                        }}
                    />
                </div>
            </div>

            {/* Render the folder file list modal if a folder is selected */}
            {selectedFolder && (
                <FolderFileList
                    folder={selectedFolder}
                    files={dummyFiles}
                    onClose={closeFolderFileList}
                />
            )}
        </>
    );
}