import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface StatsProps {
  data: {
    assignments: number;
    submissions: number;
    completed: number;
    pending: number;
  };
}

export default function Stats({ data }: StatsProps) {
  const chartData = [
    { name: "Assignments", value: data.assignments },
    { name: "Submissions", value: data.submissions },
    { name: "Completed", value: data.completed },
    { name: "Pending", value: data.pending }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(24, 80%, 40%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
