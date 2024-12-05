import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: number;
  fullName: string;
  avatar: string;
  submissions: number;
  completedAssignments: number;
}

export default function StudentList() {
  const { data: students } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/students");
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    }
  });

  if (!students?.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No students assigned yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] w-full">
          <div className="p-4">
            <div className="space-y-4">
              {students.map((student) => (
                <div key={student.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent">
                  <Avatar>
                    <AvatarImage src={student.avatar} />
                    <AvatarFallback>{student.fullName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{student.fullName}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {student.submissions} submissions
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {student.completedAssignments} completed
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
