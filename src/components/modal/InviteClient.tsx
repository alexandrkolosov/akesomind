import React, { useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import Form from "../form/Form";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../../components/ui/button/Button";

interface InviteClientModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Simulate an API call to send an invitation email
function simulateInviteClient(email: string): Promise<{ success: boolean; data?: any; error?: string }> {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log("Mock API call: invitation sent to", email);
            resolve({ success: true, data: { email, invitationSent: true } });
        }, 2000); // 2-second delay to simulate network latency
    });
}

export default function InviteClientModal({ isOpen, onClose }: InviteClientModalProps) {
    const [email, setEmail] = useState("");

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            alert("Please enter a valid email address.");
            return;
        }

        try {
            const response = await simulateInviteClient(email);
            if (response.success) {
                console.log("Invitation sent successfully:", response.data);
                alert("Invitation sent successfully!");
                onClose();
                setEmail("");
            } else {
                alert("Error sending invitation: " + response.error);
            }
        } catch (err) {
            console.error("Error sending invitation:", err);
            alert("Error sending invitation");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <ComponentCard title="Invite Client">
                <Form onSubmit={handleInvite}>
                    <div className="grid grid-cols-1 gap-6">
                        {/* Email (Required) */}
                        <div className="col-span-2">
                            <Label htmlFor="clientEmail">
                                Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="email"
                                placeholder="Enter email address"
                                id="clientEmail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {/* Action Buttons */}
                        <div className="flex justify-end gap-4">
                            <Button size="sm" onClick={onClose} className="bg-gray-500">
                                Cancel
                            </Button>
                            <Button size="sm" onClick={onClose}>
                                Invite
                            </Button>
                        </div>
                    </div>
                </Form>
            </ComponentCard>
        </div>
    );
}