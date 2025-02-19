import React from "react";
import { FileData } from "../../types";

interface FileItem {
    id: string;
    name: string;
    size: string;
    type: string;
    // ...other file properties
}

interface FolderFileListProps {
    folder: FileData;
    // In a real app, you might fetch file items from an API
    files: FileItem[];
    onClose: () => void;
}

const FolderFileList: React.FC<FolderFileListProps> = ({ folder, files, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg max-w-3xl w-full relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                    &times;
                </button>
                <h2 className="mb-4 text-xl font-bold">
                    Files in {folder.title}
                </h2>
                <div className="overflow-auto max-h-[60vh]">
                    <table className="w-full border-collapse">
                        <thead>
                        <tr>
                            <th className="border-b p-2 text-left">Name</th>
                            <th className="border-b p-2 text-left">Type</th>
                            <th className="border-b p-2 text-left">Size</th>
                            <th className="border-b p-2 text-left">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {files.map((file) => (
                            <tr key={file.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                <td className="p-2">{file.name}</td>
                                <td className="p-2">{file.type}</td>
                                <td className="p-2">{file.size}</td>
                                <td className="p-2 flex gap-2">
                                    <button
                                        className="bg-red-500 text-white px-2 py-1 text-xs rounded"
                                        onClick={() => alert(`Deleting ${file.name}`)}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        className="bg-blue-500 text-white px-2 py-1 text-xs rounded"
                                        onClick={() => alert(`Downloading ${file.name}`)}
                                    >
                                        Download
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FolderFileList;