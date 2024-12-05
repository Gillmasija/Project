import { format } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status?: "pending" | "submitted" | "graded";
  submission?: {
    content: string;
    submittedAt: string;
  };
}

interface AssignmentCardProps {
  assignment: Assignment;
  isTeacher?: boolean;
}

export default function AssignmentCard({ assignment, isTeacher }: AssignmentCardProps) {
  const [submission, setSubmission] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitAssignment = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/assignments/${assignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: submission })
      });
      if (!res.ok) throw new Error("Failed to submit assignment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setSubmission("");
      toast({
        title: "Success",
        description: "Assignment submitted successfully"
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{assignment.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Due: {format(new Date(assignment.dueDate), "PPP")}
            </p>
          </div>
          <Badge variant={assignment.status === "submitted" ? "secondary" : "outline"}>
            {assignment.status || "pending"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{assignment.description}</p>
        
        {assignment.submission && (
          <div className="mt-4 p-4 bg-secondary/20 rounded-lg">
            <p className="text-sm font-medium">Submission</p>
            <p className="text-sm mt-2">{assignment.submission.content}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Submitted: {format(new Date(assignment.submission.submittedAt), "PPp")}
            </p>
          </div>
        )}

        {!isTeacher && !assignment.submission && (
          <div className="mt-4">
            <Textarea
              placeholder="Type your submission here..."
              value={submission}
              onChange={(e) => setSubmission(e.target.value)}
            />
          </div>
        )}
      </CardContent>
      
      {!isTeacher && !assignment.submission && (
        <CardFooter>
          <Button 
            onClick={() => submitAssignment.mutate()}
            disabled={!submission.trim()}
            className="w-full"
          >
            Submit Assignment
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
