import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

// Assume these icons are imported from an icon library
import {
  BoxCubeIcon,
  CalenderIcon,
  ChatIcon,
  ChevronDownIcon,
  DocsIcon, FileIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  MailIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  TaskIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <UserCircleIcon />,
    name: "User Profile",
    path: "/profile",
  },
  {
    icon: <CalenderIcon />,
    name: "Calendar",
    path: "/calendar",
  },
  {
    name: "Client List",
    icon: <TaskIcon />,
    subItems: [
      { name: "User Base", path: "/data-tables", pro: false },
    ],
  },
  {
    name: "File Manager",
    icon: <FileIcon />,
    subItems: [
      { name: "Files", path: "/file-manager", pro: false },
    ],
  },
  {
    name: "Task",
    icon: <ListIcon />,
    subItems: [
      { name: "User Base", path: "/task-list", pro: false },
      { name: "Kanban", path: "/task-kanban", pro: false },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  // We now only need to track the open submenu for the main menu items.
  const [openSubmenu, setOpenSubmenu] = useState<{ index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
      (path: string) => location.pathname === path,
      [location.pathname]
  );

  // Check if any subItem in the main menu is active and update openSubmenu accordingly.
  useEffect(() => {
    let submenuMatched = false;
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ index });
            submenuMatched = true;
          }
        });
      }
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  // Update submenu height for animation.
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `main-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (prevOpenSubmenu && prevOpenSubmenu.index === index) {
        return null;
      }
      return { index };
    });
  };

  // Render the menu items from navItems.
  const renderMenuItems = (items: NavItem[]) => (
      <ul className="flex flex-col gap-4">
        {items.map((nav, index) => (
            <li key={nav.name}>
              {nav.subItems ? (
                  <>
                    <button
                        onClick={() => handleSubmenuToggle(index)}
                        className={`menu-item group ${
                            openSubmenu?.index === index ? "menu-item-active" : "menu-item-inactive"
                        } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
                    >
                <span
                    className={`${
                        openSubmenu?.index === index ? "menu-item-icon-active" : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                      {(isExpanded || isHovered || isMobileOpen) && (
                          <span className="menu-item-text">{nav.name}</span>
                      )}
                      {(isExpanded || isHovered || isMobileOpen) && (
                          <ChevronDownIcon
                              className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                                  openSubmenu?.index === index ? "rotate-180 text-brand-500" : ""
                              }`}
                          />
                      )}
                    </button>
                    {(isExpanded || isHovered || isMobileOpen) && (
                        <div
                            ref={(el) => {
                              subMenuRefs.current[`main-${index}`] = el;
                            }}
                            className="overflow-hidden transition-all duration-300"
                            style={{
                              height:
                                  openSubmenu?.index === index
                                      ? `${subMenuHeight[`main-${index}`]}px`
                                      : "0px",
                            }}
                        >
                          <ul className="mt-2 space-y-1 ml-9">
                            {nav.subItems.map((subItem) => (
                                <li key={subItem.name}>
                                  <Link
                                      to={subItem.path}
                                      className={`menu-dropdown-item ${
                                          isActive(subItem.path)
                                              ? "menu-dropdown-item-active"
                                              : "menu-dropdown-item-inactive"
                                      }`}
                                  >
                                    {subItem.name}
                                    <span className="flex items-center gap-1 ml-auto">
                            {subItem.new && (
                                <span
                                    className={`ml-auto ${
                                        isActive(subItem.path)
                                            ? "menu-dropdown-badge-active"
                                            : "menu-dropdown-badge-inactive"
                                    } menu-dropdown-badge`}
                                >
                                new
                              </span>
                            )}
                                      {subItem.pro && (
                                          <span
                                              className={`ml-auto ${
                                                  isActive(subItem.path)
                                                      ? "menu-dropdown-badge-active"
                                                      : "menu-dropdown-badge-inactive"
                                              } menu-dropdown-badge`}
                                          >
                                pro
                              </span>
                                      )}
                          </span>
                                  </Link>
                                </li>
                            ))}
                          </ul>
                        </div>
                    )}
                  </>
              ) : (
                  nav.path && (
                      <Link
                          to={nav.path}
                          className={`menu-item group ${
                              isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                          }`}
                      >
                <span
                    className={`${
                        isActive(nav.path)
                            ? "menu-item-icon-active"
                            : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                        {(isExpanded || isHovered || isMobileOpen) && (
                            <span className="menu-item-text">{nav.name}</span>
                        )}
                      </Link>
                  )
              )}
            </li>
        ))}
      </ul>
  );

  return (
      <aside
          className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
              isExpanded || isMobileOpen
                  ? "w-[290px]"
                  : isHovered
                      ? "w-[290px]"
                      : "w-[90px]"
          }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
          onMouseEnter={() => !isExpanded && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
      >
        <div
            className={`py-8 flex ${
                !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
            }`}
        >
          <Link to="/">
            {isExpanded || isHovered || isMobileOpen ? (
                <>
                  <img
                      className="dark:hidden"
                      src="/images/logo/logo.svg"
                      alt="Logo"
                      width={150}
                      height={40}
                  />
                  <img
                      className="hidden dark:block"
                      src="/images/logo/logo-dark.svg"
                      alt="Logo"
                      width={150}
                      height={40}
                  />
                </>
            ) : (
                <img
                    src="/images/logo/logo-icon.svg"
                    alt="Logo"
                    width={32}
                    height={32}
                />
            )}
          </Link>
        </div>
        <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
          <nav className="mb-6">
            <div className="flex flex-col gap-4">
              <div>
                <h2
                    className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                        !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                    }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots />}
                </h2>
                {renderMenuItems(navItems)}
              </div>
            </div>
          </nav>
          {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
        </div>
      </aside>
  );
};

export default AppSidebar;