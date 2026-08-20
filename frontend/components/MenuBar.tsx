import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { FloatingMenu } from "./FloatingMenu";

// --- Types ---

export interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  separator?: boolean; // renders a divider line
  submenu?: MenuItem[];
}

export interface MenuDefinition {
  id: string;
  label: string;
  items: MenuItem[];
}

interface MenuBarProps {
  menus: MenuDefinition[];
  rightContent?: React.ReactNode;
}

// --- Component ---

export function MenuBar({ menus, rightContent }: MenuBarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [hoverMenuId, setHoverMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { menuLabel: string; item: MenuItem }[]
  >([]);
  const [highlightedResult, setHighlightedResult] = useState(0);
  const menuBarRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const searchInputRef = useRef<HTMLInputElement>(null);

  // The active open menu (follow hover once a menu is open)
  const activeMenuId = openMenuId ? hoverMenuId || openMenuId : null;

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuBarRef.current &&
        !menuBarRef.current.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) {
        setOpenMenuId(null);
        setHoverMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenuId(null);
        setHoverMenuId(null);
        setSearchQuery("");
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Search all menu items
  const searchAllItems = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      const q = query.toLowerCase();
      const results: { menuLabel: string; item: MenuItem }[] = [];
      for (const menu of menus) {
        for (const item of menu.items) {
          if (item.separator) continue;
          if (item.label.toLowerCase().includes(q)) {
            results.push({ menuLabel: menu.label, item });
          }
          if (item.submenu) {
            for (const sub of item.submenu) {
              if (sub.separator) continue;
              if (sub.label.toLowerCase().includes(q)) {
                results.push({
                  menuLabel: `${menu.label} > ${item.label}`,
                  item: sub,
                });
              }
            }
          }
        }
      }
      setSearchResults(results);
      setHighlightedResult(0);
    },
    [menus],
  );

  useEffect(() => {
    searchAllItems(searchQuery);
  }, [searchQuery, searchAllItems]);

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled || !item.action) return;
    item.action();
    setOpenMenuId(null);
    setHoverMenuId(null);
  };

  const handleSearchResultClick = (item: MenuItem) => {
    if (item.disabled || !item.action) return;
    item.action();
    setSearchQuery("");
    setOpenMenuId(null);
    setHoverMenuId(null);
  };

  // Handle search keyboard navigation
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedResult((prev) =>
        Math.min(prev + 1, searchResults.length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedResult((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && searchResults[highlightedResult]) {
      e.preventDefault();
      handleSearchResultClick(searchResults[highlightedResult].item);
    }
  };

  const renderMenuItem = (item: MenuItem, index: number) => {
    if (item.separator) {
      return (
        <div key={`sep-${index}`} className="mx-2 my-1 h-px bg-border" />
      );
    }

    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item)}
        disabled={item.disabled}
        className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-[13px] transition-colors ${
          item.disabled
            ? "cursor-not-allowed text-subtle"
            : "text-foreground hover:bg-blue-600 hover:text-white"
        }`}
      >
        <span>{item.label}</span>
        {item.shortcut && (
          <span
            className={`ml-8 text-[11px] ${item.disabled ? "text-subtle" : "text-muted"}`}
          >
            {item.shortcut}
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      ref={menuBarRef}
      className="relative z-60 flex select-none items-center border-b border-border bg-card"
    >
      <div className="flex items-center flex-1">
        {menus.map((menu) => {
          const isActive = activeMenuId === menu.id;
          const isHelpMenu = menu.id === "help";

          return (
            <div key={menu.id} className="relative">
              <button
                ref={(node) => {
                  if (node) triggerRefs.current.set(menu.id, node);
                  else triggerRefs.current.delete(menu.id);
                }}
                onMouseDown={() => {
                  if (openMenuId === menu.id) {
                    setOpenMenuId(null);
                    setHoverMenuId(null);
                  } else {
                    setOpenMenuId(menu.id);
                    setHoverMenuId(null);
                    if (isHelpMenu) {
                      setTimeout(() => searchInputRef.current?.focus(), 50);
                    }
                  }
                }}
                onMouseEnter={() => {
                  if (openMenuId) setHoverMenuId(menu.id);
                }}
                className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-surface-selected text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {menu.label}
              </button>

              {/* Dropdown */}
              {isActive && (
                <FloatingMenu
                  ref={dropdownRef}
                  anchorRef={{
                    current: triggerRefs.current.get(menu.id) ?? null,
                  }}
                  placement="bottom-start"
                  gap={0}
                  role="menu"
                  className="min-w-[240px] overflow-y-auto rounded-b-lg border border-border bg-popover py-1 shadow-xl"
                >
                  {/* Help menu has search */}
                  {isHelpMenu && (
                    <div className="border-b border-border px-2 py-1.5">
                      <div className="flex items-center gap-2 rounded-sm bg-input px-2 py-1">
                        <Search className="h-3.5 w-3.5 shrink-0 text-muted" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search menus..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={handleSearchKeyDown}
                          className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted outline-hidden"
                          autoFocus
                        />
                      </div>
                      {/* Search results */}
                      {searchQuery && (
                        <div className="mt-1 max-h-48 overflow-y-auto">
                          {searchResults.length === 0 ? (
                            <div className="px-2 py-2 text-center text-[12px] text-muted">
                              No results
                            </div>
                          ) : (
                            searchResults.map((result, i) => (
                              <button
                                key={`${result.item.id}-${i}`}
                                onClick={() =>
                                  handleSearchResultClick(result.item)
                                }
                                className={`w-full flex items-center justify-between px-2 py-1.5 text-left text-[12px] rounded transition-colors ${
                                  i === highlightedResult
                                    ? "bg-blue-600 text-white"
                                    : "text-foreground hover:bg-surface-hover"
                                }`}
                              >
                                <div>
                                  <span>{result.item.label}</span>
                                  <span className="ml-2 text-2xs text-muted">
                                    {result.menuLabel}
                                  </span>
                                </div>
                                {result.item.shortcut && (
                                  <span className="text-2xs text-muted">
                                    {result.item.shortcut}
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Regular menu items */}
                  {menu.items.map((item, i) => renderMenuItem(item, i))}
                </FloatingMenu>
              )}
            </div>
          );
        })}
      </div>
      {rightContent && (
        <div className="flex items-center mr-2">{rightContent}</div>
      )}
    </div>
  );
}
