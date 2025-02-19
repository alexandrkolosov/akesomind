import React from "react";
import { Link } from "react-router-dom";
import FolderCard from "./FolderCard";
import { FileData } from "../../types";

interface AllFoldersProps {
    onFolderClick: (folder: FileData) => void;
    folders: FileData[];
}

const AllFolders: React.FC<AllFoldersProps> = ({ onFolderClick, folders }) => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="px-4 py-4 sm:pl-6 sm:pr-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        All Folders
                    </h3>
                    <Link
                        to="/folders"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500"
                    >
                        View All
                        {/* (SVG icon omitted for brevity) */}
                    </Link>
                </div>
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 sm:p-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                    {folders.map((folder) => (
                        <div
                            key={folder.id}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => onFolderClick(folder)}
                        >
                            <FolderCard
                                title={folder.title}
                                fileCount={folder.fileCount.toString()}
                                size={folder.storageUsed}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AllFolders;