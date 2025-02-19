import React from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";

export default function Maintenance() {
  return (
    <>
      <PageMeta
        title="React.js Maintenance Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Maintenance Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden z-1">
        <GridShape />

        <div className="mx-auto w-full max-w-[242px] text-center sm:max-w-[562px]">
          <h1 className="mb-8 font-bold text-gray-800 text-title-md dark:text-white/90 xl:text-title-2xl">
            ERROR
          </h1>

          <img src="./images/error/500.svg" alt="500" className="dark:hidden" />
          <img
            src="./images/error/500-dark.svg"
            alt="500"
            className="hidden dark:block"
          />

          <p className="mt-10 mb-6 text-base text-gray-700 dark:text-gray-400 sm:text-lg">
            We can’t seem to find the page you are looking for!
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            Back to Home Page
          </Link>
        </div>

        {/* <!-- Footer --> */}
        <p className="absolute text-sm text-center text-gray-500 -translate-x-1/2 bottom-6 left-1/2 dark:text-gray-400">
          &copy; {new Date().getFullYear()} - TailAdmin
        </p>
      </div>
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden z-1">
        <GridShape />

        <div>
          <div className="mx-auto w-full max-w-[274px] text-center sm:max-w-[555px]">
            <div className="mx-auto mb-10 w-full max-w-[155px] text-center sm:max-w-[204px]">
              <img
                src="/images/error/maintenance.svg"
                alt="maintenance"
                className="dark:hidden"
              />
              <img
                src="/images/error/maintenance-dark.svg"
                alt="maintenance"
                className="hidden dark:block"
              />
            </div>

            <h1 className="mb-2 font-bold text-gray-800 text-title-md dark:text-white/90 xl:text-title-2xl">
              MAINTENANCE
            </h1>

            <p className="mt-6 mb-6 text-base text-gray-700 dark:text-gray-400 sm:text-lg">
              Our Site is Currently under maintenance We will be back Shortly
              Thank You For Patience
            </p>

            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              Back to Home Page
            </Link>
          </div>
          {/* <!-- Footer --> */}
          <p className="absolute text-sm text-center text-gray-500 -translate-x-1/2 bottom-6 left-1/2 dark:text-gray-400">
            &copy; {new Date().getFullYear()} - TailAdmin
          </p>
        </div>
      </div>
    </>
  );
}
