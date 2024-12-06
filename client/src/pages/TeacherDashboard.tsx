import { useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Stats from "../components/dashboard/Stats";
import StudentList from "../components/dashboard/StudentList";
import AssignmentCard from "../components/dashboard/AssignmentCard";
import TeacherSchedule from "../components/dashboard/TeacherSchedule";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

export default function TeacherDashboard() {
  const [isNewAssignmentOpen, setIsNewAssignmentOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
              <Form {...form}>
                <form onSubmit={form.handleSubmit(data => createAssignment.mutate(data))} className="space-y-4">
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
              <TeacherSchedule />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
