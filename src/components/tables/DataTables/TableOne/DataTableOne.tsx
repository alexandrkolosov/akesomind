"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../ui/table";
import { AngleDownIcon, AngleUpIcon } from "../../../../icons";
import PaginationWithIcon from "./PaginationWithIcon";
import { Link } from "react-router-dom";

// Shape of each client item inside the "list"
interface ClientItem {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  birthday: string;      // e.g., "2025-02-19T19:28:58.303Z"
  lastSession: string;   // e.g., "2025-02-19T19:28:58.303Z"
  avatar: string;
  // "tags" is omitted here because we are not displaying it in the table,
  // but you could add it if needed:
  // tags: {
  //   list: { id: number; name: string }[];
  //   total: number;
  // };
}

// Sorting keys
type SortKey = "firstName" | "lastName" | "email" | "birthday" | "lastSession";
type SortOrder = "asc" | "desc";

export default function DataTableOne() {
  // State to hold the array of client items
  const [tableRowData, setTableRowData] = useState<ClientItem[]>([]);

  // State for pagination, sorting, and searching
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>("firstName");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch data on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("https://api.akesomind.com/api/therapist/clients", {
          method: "GET",
          credentials: "include", // Include cookies if your backend uses cookie-based auth
        });
        if (!response.ok) {
          throw new Error("Failed to fetch clients");
        }

        // The returned JSON structure:
        // {
        //   "list": [... array of client items ...],
        //   "total": 0
        // }
        const data = await response.json();

        // Extract the list of clients from data.list
        setTableRowData(data.list || []);
        // If you need the total from the server, you can store data.total in a separate state
        // or simply rely on local filtering/sorting as shown below.
      } catch (error) {
        console.error(error);
      }
    };

    fetchClients();
  }, []);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();

    // 1) Filter by any relevant field
    const filtered = tableRowData.filter((item) => {
      const { avatar, firstName, lastName, email, birthday, lastSession } = item;
      return (
          avatar?.toLowerCase().includes(lowerSearchTerm) ||
          firstName?.toLowerCase().includes(lowerSearchTerm) ||
          lastName?.toLowerCase().includes(lowerSearchTerm) ||
          email?.toLowerCase().includes(lowerSearchTerm) ||
          birthday?.toLowerCase().includes(lowerSearchTerm) ||
          lastSession?.toLowerCase().includes(lowerSearchTerm)
      );
    });

    // 2) Sort
    const sorted = filtered.sort((a, b) => {
      if (sortKey === "birthday" || sortKey === "lastSession") {
        // Compare as dates
        const dateA = new Date(a[sortKey]);
        const dateB = new Date(b[sortKey]);
        return sortOrder === "asc"
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime();
      } else {
        // Compare as strings
        const aValue = String(a[sortKey]).toLowerCase();
        const bValue = String(b[sortKey]).toLowerCase();
        return sortOrder === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
      }
    });

    return sorted;
  }, [tableRowData, sortKey, sortOrder, searchTerm]);

  // Pagination logic
  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentData = filteredAndSortedData.slice(startIndex, endIndex);

  // Handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return (
      <div className="overflow-hidden bg-white dark:bg-white/[0.03] rounded-xl">
        {/* Top Bar: Items per page & Search */}
        <div className="flex flex-col gap-2 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
          {/* Items per page */}
          <div className="flex items-center gap-3">
            <span className="text-gray-500 dark:text-gray-400"> Show </span>
            <div className="relative z-20 bg-transparent">
              <select
                  className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                {[2, 5, 10].map((value) => (
                    <option
                        key={value}
                        value={value}
                        className="text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                    >
                      {value}
                    </option>
                ))}
              </select>
              <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-2 top-1/2 dark:text-gray-400">
              <svg
                  className="stroke-current"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
              >
                <path
                    d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                    stroke=""
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
              </svg>
            </span>
            </div>
            <span className="text-gray-500 dark:text-gray-400"> entries </span>
          </div>

          {/* Search */}
          <div className="relative">
            <button className="absolute text-gray-500 -translate-y-1/2 left-4 top-1/2 dark:text-gray-400">
              <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
              >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                    fill=""
                />
              </svg>
            </button>

            <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // reset to first page on search
                }}
                placeholder="Search..."
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {[
                  { key: "avatar", label: "Avatar", sortable: false },
                  { key: "firstName", label: "First Name", sortable: true },
                  { key: "lastName", label: "Last Name", sortable: true },
                  { key: "email", label: "Email", sortable: true },
                  { key: "birthday", label: "Birthday", sortable: true },
                  { key: "lastSession", label: "Last Session", sortable: true },
                ].map(({ key, label, sortable }) => (
                    <TableCell
                        key={key}
                        isHeader
                        className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                    >
                      <div
                          className={`flex items-center ${
                              sortable ? "justify-between cursor-pointer" : ""
                          }`}
                          onClick={() => sortable && handleSort(key as SortKey)}
                      >
                        <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                          {label}
                        </p>
                        {sortable && (
                            <button className="flex flex-col gap-0.5">
                              <AngleUpIcon
                                  className={`text-gray-300 dark:text-gray-700 ${
                                      sortKey === key && sortOrder === "asc"
                                          ? "text-brand-500"
                                          : ""
                                  }`}
                              />
                              <AngleDownIcon
                                  className={`text-gray-300 dark:text-gray-700 ${
                                      sortKey === key && sortOrder === "desc"
                                          ? "text-brand-500"
                                          : ""
                                  }`}
                              />
                            </button>
                        )}
                      </div>
                    </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentData.map((item) => (
                  <TableRow key={item.id}>
                    {/* Avatar */}
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 overflow-hidden rounded-full">
                          <Link to="/userprofile">
                            <img
                                src={item.avatar}
                                className="size-10"
                                alt="avatar"
                            />
                          </Link>
                        </div>
                      </div>
                    </TableCell>

                    {/* First Name */}
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                      {item.firstName}
                    </TableCell>

                    {/* Last Name */}
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                      {item.lastName}
                    </TableCell>

                    {/* Email */}
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                      {item.email}
                    </TableCell>

                    {/* Birthday */}
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                      {item.birthday
                          ? new Date(item.birthday).toLocaleDateString()
                          : ""}
                    </TableCell>

                    {/* Last Session */}
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                      {item.lastSession
                          ? new Date(item.lastSession).toLocaleString()
                          : ""}
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Footer: Pagination */}
        <div className="border border-t-0 rounded-b-xl border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
            {/* Left side: Showing entries */}
            <div className="pb-3 xl:pb-0">
              <p className="pb-3 text-sm font-medium text-center text-gray-500 border-b border-gray-100 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">
                Showing {startIndex + 1} to {endIndex} of {totalItems} entries
              </p>
            </div>
            <PaginationWithIcon
                totalPages={totalPages}
                initialPage={currentPage}
                onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
  );
}