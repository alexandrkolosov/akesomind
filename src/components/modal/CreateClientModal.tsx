import React, { useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import Form from "../form/Form";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../../components/ui/button/Button";

interface ClientData {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    type: string;
    therapistCode: string;
    zoneId?: string;
}

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
}
export {};

// API request for client registration
async function createClient(clientData: ClientData): Promise<Response> {
    return fetch("https://api.akesomind.com/api/user", {
        method: "POST",
        mode: "cors", // ensure using CORS mode
        credentials: "include", // send cookies along with the request
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(clientData),
    });
}

export default function CreateClientModal({ isOpen, onClose }: AddClientModalProps) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    // Now allow manual entry for therapist code (required)
    const [therapistCode, setTherapistCode] = useState("");
    // Now allow the user to select the type
    const [userType, setUserType] = useState("Client");
    const [zoneId, setZoneId] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validate required fields
        if (
            !firstName.trim() ||
            !lastName.trim() ||
            !email.trim() ||
            !password.trim() ||
            !userType.trim() ||
            !therapistCode.trim()
        ) {
            alert("Please fill in all required fields: First Name, Last Name, Email, Password, Type, and Therapist Code");
            return;
        }
        const clientData: ClientData = {
            email,
            firstName,
            lastName,
            password,
            type: userType,
            therapistCode,
            zoneId: zoneId.trim() ? zoneId : undefined,
        };

        console.log("Submitting client data:", clientData);
        try {
            const response = await createClient(clientData);
            if (response.status === 200) {
                const data = await response.json();
                console.log("Client created successfully:", data);
                alert("Client created successfully!");
                onClose();
                // Reset form fields
                setFirstName("");
                setLastName("");
                setEmail("");
                setPassword("");
                setUserType("Client");
                setTherapistCode("");
                setZoneId("");
            } else if (response.status === 400) {
                alert("Error: Email is already taken or the therapist code is incorrect.");
            } else if (response.status === 402) {
                alert("Error: The therapist has a free account and already has 5 clients. Please upgrade your subscription.");
            } else {
                alert("An unexpected error occurred.");
            }
        } catch (err) {
            console.error("Error creating client:", err);
            alert("Error creating client");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 pt-20">
            <ComponentCard title="Create New Client">
                <Form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-6">
                        {/* First Name (Required) */}
                        <div>
                            <Label htmlFor="firstName">
                                First Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="text"
                                placeholder="Enter first name"
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </div>
                        {/* Last Name (Required) */}
                        <div>
                            <Label htmlFor="lastName">
                                Last Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="text"
                                placeholder="Enter last name"
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </div>
                        {/* Email (Required) */}
                        <div>
                            <Label htmlFor="email">
                                Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="email"
                                placeholder="Enter email address"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {/* Password (Required) */}
                        <div>
                            <Label htmlFor="password">
                                Password <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="password"
                                placeholder="Enter password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {/* Therapist Code (Required) */}
                        <div>
                            <Label htmlFor="therapistCode">
                                Therapist Code <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="text"
                                placeholder="Enter therapist code"
                                id="therapistCode"
                                value={therapistCode}
                                onChange={(e) => setTherapistCode(e.target.value)}
                            />
                        </div>
                        {/* Type (Required) */}
                        <div>
                            <Label htmlFor="userType">
                                Type <span className="text-red-500">*</span>
                            </Label>
                            <select
                                id="userType"
                                value={userType}
                                onChange={(e) => setUserType(e.target.value)}
                                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                required
                            >
                                <option value="Client">Client</option>
                                <option value="Therapist">Therapist</option>
                            </select>
                        </div>
                        {/* Zone ID (Optional) */}
                        <div>
                            <Label htmlFor="zoneId">Zone ID</Label>
                            <Input
                                type="text"
                                placeholder="Enter Zone ID (optional)"
                                id="zoneId"
                                value={zoneId}
                                onChange={(e) => setZoneId(e.target.value)}
                            />
                        </div>
                        {/* Action Buttons */}
                        <div className="flex justify-end gap-4">
                            <Button size="sm" onClick={onClose} className="bg-gray-500">
                                Cancel
                            </Button>
                            <Button size="sm">
                                Create Client
                            </Button>
                        </div>
                    </div>
                </Form>
            </ComponentCard>
        </div>
    );
}