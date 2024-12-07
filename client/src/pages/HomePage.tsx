import { useUser } from "../hooks/use-user";
import { Link } from "wouter";

export default function HomePage() {
  const { user, logout } = useUser();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-orange-600">
                {user?.role === 'teacher' ? 'Teacher Dashboard' : 'Student Dashboard'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.fullName}</span>
              <button 
                onClick={handleLogout}
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {user?.role === 'teacher' ? (
          <div>Teacher content will go here</div>
        ) : (
          <div>Student content will go here</div>
        )}
      </div>
    </div>
  );
}
