
import Link from 'next/link';
import Image from 'next/image';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Router, Bell, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { UserNav } from '@/components/dashboard/UserNav';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { BottomNav } from '@/components/dashboard/BottomNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex">
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Image src="/Aquamate.png" alt="AquaMate Logo" width={24} height={24} className="rounded-full" />
              <span className="text-lg font-semibold">AquaMate</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/devices">
                    <Router />
                    Device Management
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/notifications">
                    <Bell />
                    Notifications
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/settings">
                    <Settings />
                    Settings
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        {/* Main content with fixed header and bottom nav for mobile */}
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center border-b bg-background px-4 lg:h-[60px]">
            <div className="flex h-full w-full items-center justify-between">
              {/* Mobile Header: Title + Actions */}
              <div className="flex items-center gap-2 md:hidden">
                <Image src="/Aquamate.png" alt="AquaMate Logo" width={24} height={24} className="rounded-full" />
                <h1 className="text-lg font-semibold">AquaMate</h1>
              </div>
              {/* Desktop Header: Title */}
              <h1 className="hidden text-xl font-semibold md:block">Dashboard</h1>

              <div className="flex items-center gap-4">
                <ThemeToggle />
                <NotificationBell />
                <UserNav />
              </div>
            </div>
          </header>
          {/* Scrollable content area */}
          <main className="flex-1 overflow-y-auto bg-muted/40">
            {children}
          </main>
          
          {/* Mobile Bottom Navigation */}
          <BottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
}
