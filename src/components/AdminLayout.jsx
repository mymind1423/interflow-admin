import { useState } from "react";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex bg-slate-50 dark:bg-[#020617] min-h-screen text-slate-900 dark:text-slate-200 transition-colors duration-300">
            {/* Sidebar - Pass state/toggle for mobile */}
            <AdminSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Navbar - Pass toggle function */}
                <AdminNavbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

                <main className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full pb-20">
                    {children}
                </main>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
