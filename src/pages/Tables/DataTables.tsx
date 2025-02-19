import React, { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne from "../../components/tables/DataTables/TableOne/DataTableOne";
import AddClientModal from "../../components/modal/CreateClientModal";
import Button from "../../components/ui/button/Button";
import InviteClientModal from "../../components/modal/InviteClient";

export default function DataTables() {
    // Define separate state variables for each modal
    const [isNewClientModalOpen, setNewClientModalOpen] = useState(false);
    const [isInviteModalOpen, setInviteModalOpen] = useState(false);

    return (
        <>
            <PageMeta
                title="AkesoMind - Client List"
                description="This is your client list"
            />
            <PageBreadcrumb pageTitle="Client List" />
            <div className="space-y-5 sm:space-y-6">
                <div className="flex justify-start space-x-4">
                    <Button size="sm" onClick={() => setNewClientModalOpen(true)}>
                        New Client
                    </Button>
                    <Button size="sm" onClick={() => setInviteModalOpen(true)}>
                        Invite Client
                    </Button>
                </div>
                <ComponentCard title="Your Client List">
                    <DataTableOne />
                </ComponentCard>
            </div>
            <AddClientModal
                isOpen={isNewClientModalOpen}
                onClose={() => setNewClientModalOpen(false)}
            />
            <InviteClientModal
                isOpen={isInviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
            />
        </>
    );
}