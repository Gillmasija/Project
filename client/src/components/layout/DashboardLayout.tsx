import { ReactNode, useRef } from "react";
import { useUser } from "../../hooks/use-user";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to upload avatar');

      toast({
        title: "Success",
        description: "Profile photo updated successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload profile photo"
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
      toast({
        title: "Success",
        description: "Successfully logged out"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to logout. Please try again."
      });
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <AvatarImage src={user?.avatar} alt={user?.fullName} />
                <AvatarFallback>{user?.fullName[0]}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                   onClick={() => fileInputRef.current?.click()}>
                <span className="text-white text-xs">Change</span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold">{user?.fullName}</h1>
              <p className="text-sm opacity-80 capitalize">{user?.role}</p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            onClick={handleLogout}
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
