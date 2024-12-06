import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Schedule {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  title?: string;
  description?: string;
  studentId?: number;
}

export default function TeacherSchedule() {
  const [dayOfWeek, setDayOfWeek] = useState<string>("1");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedule } = useQuery<Schedule[]>({
    queryKey: ["teacherSchedule"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/schedule");
      if (!res.ok) throw new Error("Failed to fetch schedule");
      return res.json();
    }
  });

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/students");
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    }
  });

  const createSchedule = useMutation({
    mutationFn: async (data: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      title?: string;
      description?: string;
      studentId?: number;
    }) => {
      const res = await fetch("/api/teacher/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create schedule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherSchedule"] });
      setStartTime("");
      setEndTime("");
      toast({
        title: "Success",
        description: "Schedule created successfully"
      });
    }
  });

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: number; isAvailable: boolean }) => {
      const res = await fetch(`/api/teacher/schedule/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable })
      });
      if (!res.ok) throw new Error("Failed to update schedule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherSchedule"] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSchedule.mutate({
      dayOfWeek: parseInt(dayOfWeek),
      startTime,
      endTime,
      title: title || undefined,
      description: description || undefined,
      studentId: selectedStudent && selectedStudent !== "none" ? parseInt(selectedStudent) : undefined
    });
    setTitle("");
    setDescription("");
    setSelectedStudent("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teaching Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="Start time"
              />
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="End time"
              />
            </div>
            
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Class Title"
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Class Description"
            />
            
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Select student (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No student assigned</SelectItem>
                {students?.map((student: any) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">Add Time Slot</Button>
        </form>

        <div className="space-y-4">
          {DAYS.map((day, dayIndex) => {
            const daySchedules = schedule?.filter(s => s.dayOfWeek === dayIndex);
            if (!daySchedules?.length) return null;

            return (
              <div key={dayIndex} className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">{day}</h3>
                <div className="space-y-2">
                  {daySchedules.map((slot) => (
                    <div key={slot.id} className="bg-secondary/20 p-4 rounded space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{slot.title || "Available Time Slot"}</p>
                          <p className="text-sm text-muted-foreground">
                            {slot.startTime} - {slot.endTime}
                          </p>
                        </div>
                        <Button
                          variant={slot.isAvailable ? "default" : "secondary"}
                          onClick={() => toggleAvailability.mutate({
                            id: slot.id,
                            isAvailable: !slot.isAvailable
                          })}
                        >
                          {slot.isAvailable ? "Available" : "Unavailable"}
                        </Button>
                      </div>
                      {slot.description && (
                        <p className="text-sm">{slot.description}</p>
                      )}
                      {slot.studentId && students && (
                        <div className="text-sm text-muted-foreground">
                          Assigned to: {students.find((s: any) => s.id === slot.studentId)?.fullName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
