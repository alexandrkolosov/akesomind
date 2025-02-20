import React, { useState, useEffect } from "react";

interface MaterialFile {
    url: string;
    name: string;
}

interface Material {
    id: number;
    name: string;
    description: string;
    isAssigned: boolean;
    files: MaterialFile[];
}

interface ClientProfileTabsProps {
    clientId: string;
}

const ClientProfileTabs = ({ clientId }: ClientProfileTabsProps): JSX.Element => {
    const [activeTab, setActiveTab] = useState<string>("recordings");
    const [recordings, setRecordings] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [personalDetails, setPersonalDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch recordings
    useEffect(() => {
        const fetchRecordings = async () => {
            try {
                const response = await fetch('https://api.akesomind.com/api/test/recordings', {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setRecordings(data.list || []);
                }
            } catch (error) {
                console.error('Error fetching recordings:', error);
            }
        };
        fetchRecordings();
    }, [clientId]);

    // Fetch payments
    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const response = await fetch('https://api.akesomind.com/api/test/payments', {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setPayments(data.list || []);
                }
            } catch (error) {
                console.error('Error fetching payments:', error);
            }
        };
        fetchPayments();
    }, [clientId]);

    // Fetch materials
    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const response = await fetch('https://api.akesomind.com/api/material', {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    const assignedMaterials = data.list.filter((material: Material) => material.isAssigned);
                    setMaterials(assignedMaterials);
                }
            } catch (error) {
                console.error('Error fetching materials:', error);
            }
        };
        fetchMaterials();
    }, [clientId]);

    // Fetch personal details
    useEffect(() => {
        const fetchPersonalDetails = async () => {
            try {
                const response = await fetch(`https://api.akesomind.com/api/therapist/clients/${clientId}`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setPersonalDetails(data);
                }
            } catch (error) {
                console.error('Error fetching personal details:', error);
            }
        };
        fetchPersonalDetails();
    }, [clientId]);

    return (
        <div className="p-6 border border-gray-200 rounded-xl dark:border-gray-800">
            <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
                {/* Sidebar Navigation */}
                <div className="overflow-x-auto pb-2 sm:w-[200px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-100 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-track]:bg-white dark:[&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5">
                    <nav className="flex flex-row w-full sm:flex-col sm:space-y-2">
                        {['recordings', 'payments', 'personal', 'materials'].map((tab) => (
                            <button
                                key={tab}
                                className={`inline-flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ease-in-out sm:p-3 ${
                                    activeTab === tab
                                        ? "text-brand-500 dark:bg-brand-400/20 dark:text-brand-400 bg-brand-50"
                                        : "bg-transparent text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                }`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="flex-1">
                    {activeTab === "recordings" && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-medium text-gray-800 dark:text-white/90">
                                    Recordings
                                </h3>
                                <button className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                                    Show all
                                </button>
                            </div>
                            <div className="space-y-4">
                                {recordings.map((recording) => (
                                    <div key={recording.id} className="p-4 border rounded-lg dark:border-gray-700">
                                        {recording.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "payments" && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-medium text-gray-800 dark:text-white/90">
                                    Payments
                                </h3>
                                <button className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                                    Show all
                                </button>
                            </div>
                            <div className="space-y-4">
                                {payments.map((payment) => (
                                    <div key={payment.id} className="p-4 border rounded-lg dark:border-gray-700">
                                        <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">
                        Amount: ${payment.amount}
                      </span>
                                            <span className="text-gray-600 dark:text-gray-400">
                        {new Date(payment.date).toLocaleDateString()}
                      </span>
                                            <span className={`px-3 py-1 rounded-full text-sm ${
                                                payment.status === 'paid'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
                                            }`}>
                        {payment.status}
                      </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "personal" && personalDetails && (
                        <div>
                            <h3 className="text-xl font-medium text-gray-800 dark:text-white/90 mb-4">
                                Personal Details
                            </h3>
                            <div className="p-4 border rounded-lg dark:border-gray-700 space-y-3">
                                <p className="text-gray-600 dark:text-gray-400">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Name: </span>
                                    {personalDetails.firstName} {personalDetails.lastName}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Email: </span>
                                    {personalDetails.email}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Last Session: </span>
                                    {personalDetails.lastSession
                                        ? new Date(personalDetails.lastSession).toLocaleString()
                                        : 'No sessions yet'
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === "materials" && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-medium text-gray-800 dark:text-white/90">
                                    Materials
                                </h3>
                                <button className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                                    Show all
                                </button>
                            </div>
                            <div className="space-y-4">
                                {materials.map((material) => (
                                    <div key={material.id} className="p-4 border rounded-lg dark:border-gray-700">
                                        <h4 className="font-medium text-gray-800 dark:text-white/90 mb-2">
                                            {material.name}
                                        </h4>
                                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                                            {material.description}
                                        </p>
                                        {material.files.length > 0 && (
                                            <div>
                                                <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Files:</p>
                                                <ul className="space-y-1">
                                                    {material.files.map((file: MaterialFile, index: number) => (
                                                        <li key={index}>
                                                            <a
                                                                href={file.url}
                                                                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {file.name}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export type { ClientProfileTabsProps };
export default ClientProfileTabs;