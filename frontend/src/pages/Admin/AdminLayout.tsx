import React from "react";
import { Link } from "react-router-dom";
import { adminStyles } from "./adminStyles";

type AdminLayoutProps = Readonly<{
    title?: string;
    active?: "dashboard" | "users" | "tools" | "analytics" | "home";
    children: React.ReactNode;
}>;

export default function AdminLayout({ title = "Admin", active = "dashboard", children }: AdminLayoutProps) {
    const makeLink = (to: string, key: AdminLayoutProps["active"], label: string) => (
        <Link
            to={to}
            style={{
                ...adminStyles.navLink,
                ...(active === key ? adminStyles.navLinkActive : {}),
            }}
        >
            {label}
        </Link>
    );

    return (
        <div style={adminStyles.container}>
            <header style={adminStyles.header}>
                <h1 style={adminStyles.title}>{title}</h1>
                <nav style={adminStyles.nav}>
                    {makeLink("/admin", "dashboard", "Dashboard")}
                    {makeLink("/admin/users", "users", "Users")}
                    {makeLink("/admin/tools", "tools", "Tools")}
                    {makeLink("/admin/analytics", "analytics", "Analytics")}
                    {makeLink("/", "home", "Home")}
                </nav>
            </header>

            <main style={adminStyles.content}>{children}</main>
        </div>
    );
}
