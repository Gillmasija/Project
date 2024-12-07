import { useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Stats from "../components/dashboard/Stats";
import StudentList from "../components/dashboard/StudentList";
import AssignmentCard from "../components/dashboard/AssignmentCard";
import TeacherSchedule from "../components/dashboard/TeacherSchedule";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface NewAssignment {
  title: string;
  description: string;
  dueDate: string;
  studentId?: number;
}

interface Student {
  id: number;
  fullName: string;
  avatar: string;
  submissions?: number;
  completedAssignments?: number;
}

interface Schedule {
  id: number;
  title?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  cancellationReason?: string;
}

interface AvailabilityForm {
  isAvailable: boolean;
  cancellationReason?: string;
  scheduleId?: number;
}

export default function TeacherDashboard() {
  const [isNewAssignmentOpen, setIsNewAssignmentOpen] = useState(false);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Assignment form
  const assignmentForm = useForm<NewAssignment>({
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      studentId: undefined
    }
  });

  // Availability form
  const availabilityForm = useForm<AvailabilityForm>({
    defaultValues: {
      isAvailable: true,
      cancellationReason: ""
    }
  });

  const updateAvailability = useMutation({
    mutationFn: async (data: AvailabilityForm) => {
      const res = await fetch(`/api/teacher/schedule/${data.scheduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isAvailable: data.isAvailable,
          cancellationReason: data.cancellationReason
        })
      });
      if (!res.ok) throw new Error("Failed to update availability");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherSchedule"] });
      setIsAvailabilityOpen(false);
      availabilityForm.reset();
      toast({
        title: "Success",
        description: "Schedule updated successfully"
      });
    }
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/students");
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    }
  });

  const form = useForm<NewAssignment>({
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      studentId: undefined
    }
  });

  const { data: stats } = useQuery({
    queryKey: ["teacherStats"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/stats");
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

  const { data: schedule } = useQuery<Schedule[]>({
    queryKey: ["teacherSchedule"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/schedule");
      if (!res.ok) throw new Error("Failed to fetch schedule");
      return res.json();
    }
  });

  const createAssignment = useMutation({
    mutationFn: async (data: NewAssignment) => {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create assignment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setIsNewAssignmentOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Assignment created successfully"
      });
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-primary">Teacher Dashboard</h2>
          <Dialog open={isNewAssignmentOpen} onOpenChange={setIsNewAssignmentOpen}>
            <DialogTrigger asChild>
              <Button>Create Assignment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Assignment</DialogTitle>
              </DialogHeader>
              <Form {...assignmentForm}>
                <form onSubmit={assignmentForm.handleSubmit(data => createAssignment.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign to Student</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a student" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {students?.map((student) => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">Create</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
          <Stats data={stats || { assignments: 0, submissions: 0, completed: 0, pending: 0 }} />
          <div className="bg-cover bg-center rounded-lg h-[200px]" 
               style={{ backgroundImage: "url('https://images.unsplash.com/photo-1547226633-bb220b1b972c')" }} />
        </div>

        <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-4">Recent Assignments</h3>
            <div className="space-y-4">
              {assignments?.map((assignment: any) => (
                <AssignmentCard key={assignment.id} assignment={assignment} isTeacher />
              ))}
            </div>
          </div>
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Your Students</h3>
              <StudentList />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">Schedule Management</h3>
              <div className="space-y-4">
                <Dialog open={isAvailabilityOpen} onOpenChange={setIsAvailabilityOpen}>
                  <DialogTrigger asChild>
                    <Button>Manage Availability</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Manage Availability</DialogTitle>
                    </DialogHeader>
                    <Form {...availabilityForm}>
                      <form onSubmit={availabilityForm.handleSubmit((data) => updateAvailability.mutate(data))} className="space-y-4">
                        <FormField
                          control={availabilityForm.control}
                          name="cancellationReason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason for Cancellation</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="Please provide a reason for cancelling this slot" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full">Cancel Slot</Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <div className="space-y-4">
                  {schedule?.map((slot) => (
                    <div key={slot.id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow">
                      <div>
                        <p className="font-medium">{slot.title || "Class Session"}</p>
                        <p className="text-sm text-gray-500">
                          {slot.dayOfWeek}, {slot.startTime} - {slot.endTime}
                        </p>
                        {!slot.isAvailable && (
                          <p className="text-sm text-red-500">
                            Cancelled: {slot.cancellationReason}
                          </p>
                        )}
                      </div>
                      {slot.isAvailable && (
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setSelectedSlot(slot.id);
                            setIsAvailabilityOpen(true);
                            availabilityForm.reset({
                              isAvailable: false,
                              scheduleId: slot.id,
                              cancellationReason: ""
                            });
                          }}
                        >
                          Cancel Slot
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
