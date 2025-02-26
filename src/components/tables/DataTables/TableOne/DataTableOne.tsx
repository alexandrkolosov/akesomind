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
import { Link, useNavigate } from "react-router-dom";
import { fetchWithAuth, getUserData, logout } from "../../../../utils/auth";

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

// Define the request body interface
interface ClientRequestBody {
  state: string;
  pageRequest: { offset: number; limit: number };
  name?: string; // Optional name property for search
}

// Sorting keys
type SortKey = "firstName" | "lastName" | "email" | "birthday" | "lastSession";
type SortOrder = "asc" | "desc";

// Mock data for development/testing
const MOCK_CLIENTS: ClientItem[] = [
  {
    id: 1,
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    phone: "+1 (555) 123-4567",
    birthday: "1985-06-15T00:00:00.000Z",
    lastSession: "2023-05-10T14:30:00.000Z",
    avatar: "/images/user/user-01.png"
  },
  {
    id: 2,
    email: "jane.smith@example.com",
    firstName: "Jane",
    lastName: "Smith",
    phone: "+1 (555) 987-6543",
    birthday: "1990-03-22T00:00:00.000Z",
    lastSession: "2023-05-15T10:00:00.000Z",
    avatar: "/images/user/user-02.png"
  },
  {
    id: 3,
    email: "michael.johnson@example.com",
    firstName: "Michael",
    lastName: "Johnson",
    phone: "+1 (555) 456-7890",
    birthday: "1978-11-30T00:00:00.000Z",
    lastSession: "2023-05-12T16:15:00.000Z",
    avatar: "/images/user/user-03.png"
  },
  {
    id: 4,
    email: "emily.williams@example.com",
    firstName: "Emily",
    lastName: "Williams",
    phone: "+1 (555) 789-0123",
    birthday: "1992-08-05T00:00:00.000Z",
    lastSession: "2023-05-08T09:30:00.000Z",
    avatar: "/images/user/user-04.png"
  },
  {
    id: 5,
    email: "david.brown@example.com",
    firstName: "David",
    lastName: "Brown",
    phone: "+1 (555) 234-5678",
    birthday: "1983-04-17T00:00:00.000Z",
    lastSession: "2023-05-11T13:45:00.000Z",
    avatar: "/images/user/user-05.png"
  }
];

export default function DataTableOne() {
  const navigate = useNavigate();
  // State to hold the array of client items
  const [tableRowData, setTableRowData] = useState<ClientItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [authDetails, setAuthDetails] = useState<string>('');
  
  // State for pagination, sorting, and searching
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>("firstName");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [searchTerm, setSearchTerm] = useState("");

  // Update the state definitions
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserData();
        if (userData && userData.role) {
          setUserRole(userData.role);
          setAuthDetails(`Logged in as: ${userData.email || 'Unknown'} (${userData.role || 'No role'})`);
        } else {
          setAuthDetails("No user data found in local storage. You may need to log in again.");
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setAuthDetails("Error fetching user data. Please try logging in again.");
      }
    };

    fetchUserData();
  }, []);

  // Function to fetch clients
  const fetchClients = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userData = await getUserData();
      if (!userData) {
        setError('User data not found. Please log in again.');
        setIsLoading(false);
        return;
      }

      // First, check if we can access the user profile to verify our session
      const profileResponse = await fetch('https://api.akesomind.com/api/user', {
        credentials: 'include',
      });

      if (!profileResponse.ok) {
        setError('Session expired. Please log in again.');
        setIsLoading(false);
        return;
      }
      
      // Simple GET request with no parameters
      const simpleResponse = await fetch('https://api.akesomind.com/api/therapist/clients', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      });
      
      if (simpleResponse.ok) {
        const data = await simpleResponse.json();
        
        // Extract the data based on the response structure
        if (data.list && Array.isArray(data.list)) {
          setTableRowData(data.list);
          setTotalItems(data.total || data.list.length);
        } else if (Array.isArray(data)) {
          setTableRowData(data);
          setTotalItems(data.length);
        }
      } else {
        // If simple request failed, try with just the state parameter
        const stateOnlyUrl = new URL("https://api.akesomind.com/api/therapist/clients");
        stateOnlyUrl.searchParams.append("state", "all");
        
        const stateOnlyResponse = await fetch(stateOnlyUrl.toString(), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          }
        });
        
        if (stateOnlyResponse.ok) {
          const data = await stateOnlyResponse.json();
          
          // Extract the data based on the response structure
          if (data.list && Array.isArray(data.list)) {
            setTableRowData(data.list);
            setTotalItems(data.total || data.list.length);
          } else if (Array.isArray(data)) {
            setTableRowData(data);
            setTotalItems(data.length);
          }
        } else {
          const errorStatus = stateOnlyResponse.status;
          setError(`Unable to load client data (Error ${errorStatus}). This may be due to permission issues or browser cookie settings. Please try again later or contact support.`);
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to fetch clients. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchClients();
  }, [currentPage, itemsPerPage, searchTerm]);

  // Pagination logic - simplified since backend handles pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentData = tableRowData; // Use data directly from the API

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

  // Handle logout and redirect to login
  const handleLoginRedirect = () => {
    logout(); // Clear any existing auth data
    navigate('/signin');
  };

  // Force refresh the page to reload authentication
  const handleForceRefresh = () => {
    window.location.reload();
  };

  return (
      <div className="overflow-hidden bg-white dark:bg-white/[0.03] rounded-xl">
        {/* Show auth details if there's an error */}
        {error && authDetails && (
          <div className="p-4 mx-4 mt-4 text-sm text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 rounded">
            <p>{authDetails}</p>
          </div>
        )}
        
        {/* Show error if there is one */}
        {error && (
          <div className="p-4 m-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded">
            <p className="mb-3">{error}</p>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleLoginRedirect}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
              >
                Go to Login Page
              </button>
              <button 
                onClick={handleForceRefresh}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
          </div>
        )}

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
              {currentData.length > 0 ? (
                currentData.map((item) => (
                  <TableRow key={item.id}>
                    {/* Avatar */}
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 overflow-hidden rounded-full">
                          <Link to="/userprofile">
                            <img
                                src={item.avatar || "/images/user/user-01.png"}
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
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/[0.05]"
                  >
                    <div className="w-full text-center" style={{ gridColumn: 'span 6 / span 6' }}>
                      {isLoading ? "Loading clients..." : error ? "Error loading clients" : "No clients found"}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer: Pagination */}
        <div className="border border-t-0 rounded-b-xl border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
            {/* Left side: Showing entries */}
            <div className="pb-3 xl:pb-0">
              <p className="pb-3 text-sm font-medium text-center text-gray-500 border-b border-gray-100 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">
                {totalItems > 0 
                  ? `Showing ${startIndex + 1} to ${endIndex} of ${totalItems} entries` 
                  : "No entries to display"}
              </p>
            </div>
            {totalPages > 0 && (
              <PaginationWithIcon
                totalPages={totalPages}
                initialPage={currentPage}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>
  );
}