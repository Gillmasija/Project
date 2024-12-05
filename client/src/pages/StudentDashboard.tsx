import DashboardLayout from "../components/layout/DashboardLayout";
import Stats from "../components/dashboard/Stats";
import AssignmentCard from "../components/dashboard/AssignmentCard";
import { useQuery } from "@tanstack/react-query";

export default function StudentDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["studentStats"],
    queryFn: async () => {
      const res = await fetch("/api/student/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    }
  });

  const { data: assignments } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const res = await fetch("/api/assignments");
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    }
  });

  const { data: teacher } = useQuery({
    queryKey: ["assignedTeacher"],
    queryFn: async () => {
      const res = await fetch("/api/student/teacher");
      if (!res.ok) throw new Error("Failed to fetch teacher");
      return res.json();
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-primary">Student Dashboard</h2>

        <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
          <Stats data={stats || { assignments: 0, submissions: 0, completed: 0, pending: 0 }} />
          <div className="bg-cover bg-center rounded-lg h-[200px]" 
               style={{ backgroundImage: "url('https://images.unsplash.com/photo-1547226706-af7e2c20bcea')" }} />
        </div>

        <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-4">Your Assignments</h3>
            <div className="space-y-4">
              {assignments?.map((assignment: any) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold mb-4">Your Teacher</h3>
            {teacher && (
              <div className="bg-card p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <img 
                    src={teacher.avatar} 
                    alt={teacher.fullName}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <h4 className="font-bold">{teacher.fullName}</h4>
                    <p className="text-sm text-muted-foreground">Your Mentor</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                  <img 
                    src="https://images.unsplash.com/photo-1655720357872-ce227e4164ba"
                    alt="Teacher student interaction"
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                  <p className="text-sm text-center text-muted-foreground">
                    "Education is the most powerful weapon which you can use to change the world."
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
