import { ReactNode } from "react";
import { useUser } from "../../hooks/use-user";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useUser();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={user?.avatar} alt={user?.fullName} />
              <AvatarFallback>{user?.fullName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{user?.fullName}</h1>
              <p className="text-sm opacity-80 capitalize">{user?.role}</p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            onClick={async (e) => {
              e.preventDefault();
              try {
                await logout();
              } catch (error) {
                console.error('Logout failed:', error);
              }
            }}
          >
            Logout
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto py-8">
        {children}
      </main>
      
      <footer className="bg-primary/10 py-4 mt-auto">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © 2024 African Education Dashboard. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
