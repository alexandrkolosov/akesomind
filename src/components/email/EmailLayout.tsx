import React from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import EmailSidebar from "./EmailSidebar";
import { Outlet } from "react-router";

export default function EmailLayout() {
  return (
    <>
      <PageBreadcrumb pageTitle="Inbox" />
      <div className="sm:h-[calc(100vh-174px)] xl:h-[calc(100vh-186px)]">
        <div className="flex flex-col gap-6 xl:h-full sm:gap-5 xl:flex-row">
          <EmailSidebar />
          <div className="flex  flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:h-full xl:w-4/5">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}
