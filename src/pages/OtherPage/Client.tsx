import React from "react";
import { useParams } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ClientProfileTabs from "../../components/clientprofile/ClientProfileTabs"
import PageMeta from "../../components/common/PageMeta";

type ClientParams = {
    id: string;
};

const Client = (): JSX.Element => {
    const { id } = useParams<{ id: string }>();

    if (!id) {
        return <div>No client ID provided</div>;
    }

    return (
        <>
            <PageMeta
                title="Client Profile"
                description="View client profile details"
            />
            <PageBreadcrumb pageTitle="Client Profile" />
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <ClientProfileTabs clientId={id} />
            </div>
        </>
    );
};

export default Client;