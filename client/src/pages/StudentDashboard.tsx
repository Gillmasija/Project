import DashboardLayout from "../components/layout/DashboardLayout";
import type { TeacherSchedule } from "@db/schema";
import Stats from "../components/dashboard/Stats";
import AssignmentCard from "../components/dashboard/AssignmentCard";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
  
  const { data: teacherSchedule } = useQuery({
    queryKey: ["studentSchedule"],
    queryFn: async () => {
      const res = await fetch("/api/student/teacher-schedule");
      if (!res.ok) throw new Error("Failed to fetch schedule");
      return res.json();
    }
  });

  const { toast } = useToast();
  
  const handleWhatsAppContact = () => {
    if (teacher?.phoneNumber) {
      // Preserve the plus sign but remove other non-numeric characters
      const formattedNumber = teacher.phoneNumber.replace(/[^\d+]/g, '');
      const whatsappUrl = `https://wa.me/${formattedNumber}`;
      window.open(whatsappUrl, '_blank');
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Teacher's contact information is not available"
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-primary">Student Dashboard</h2>

        <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
          <Stats data={stats || { assignments: 0, submissions: 0, completed: 0, pending: 0 }} />
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Your Scheduled Classes</h3>
            <div className="space-y-2">
              {teacherSchedule?.map((schedule: TeacherSchedule) => (
                <div key={schedule.id} className="bg-card p-4 rounded-lg border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold">{schedule.title || "Class Session"}</h4>
                      <p className="text-sm text-muted-foreground">
                        {DAYS[schedule.dayOfWeek]}, {schedule.startTime} - {schedule.endTime}
                      </p>
                    </div>
                  </div>
                  {schedule.description && (
                    <p className="mt-2 text-sm">{schedule.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-2"
                      onClick={handleWhatsAppContact}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message on WhatsApp
                    </Button>
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
