// UserInfoCard.tsx
import React, { useState, useEffect } from "react";

interface UserInfoProps {
    clientId?: string;
}

export default function UserInfo({ clientId }: UserInfoProps) {
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchClientDetails = async () => {
            try {
                const response = await fetch(
                    `https://api.akesomind.com/api/therapist/clients/${clientId}`,
                    {
                        method: "GET",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                    }
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch client details");
                }
                const data = await response.json();
                setProfileData(data);
            } catch (err) {
                console.error(err);
                setError("An error occurred while fetching client details.");
            } finally {
                setLoading(false);
            }
        };

        if (clientId) {
            fetchClientDetails();
        }
    }, [clientId]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!profileData) return null;

    return (
        <div>
            <h4 className="text-2xl font-semibold">
                {profileData.firstName} {profileData.lastName}
            </h4>
            <p>Email: {profileData.email}</p>
            <p>Birthday: {new Date(profileData.birthday).toLocaleDateString()}</p>
            <p>Last Session: {new Date(profileData.lastSession).toLocaleString()}</p>
            {/* Render other details as needed */}
        </div>
    );
}