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
}

export default function TeacherSchedule() {
  const [dayOfWeek, setDayOfWeek] = useState<string>("1");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
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

  const createSchedule = useMutation({
    mutationFn: async (data: { dayOfWeek: number; startTime: string; endTime: string }) => {
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
      endTime
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teaching Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
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
                    <div key={slot.id} className="flex items-center justify-between bg-secondary/20 p-2 rounded">
                      <span>
                        {slot.startTime} - {slot.endTime}
                      </span>
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
