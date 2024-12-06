import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "../hooks/use-user";
import { insertUserSchema, type InsertUser } from "@db/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useUser();
  const { toast } = useToast();

  const registerSchema = insertUserSchema.extend({
    confirmPassword: z.string(),
    phoneNumber: z.string()
      .optional()
      .refine((val) => {
        if (!val) return true;
        // Validate international phone number format with country code
        return /^\+\d{1,3}\d{6,14}$/.test(val);
      }, {
        message: "Invalid phone number format. Include country code (e.g., +1234567890)",
      })
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  type RegisterFormData = z.infer<typeof registerSchema>;

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(isLogin ? insertUserSchema : registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      role: "student",
      fullName: "",
      avatar: "/edudash.png",
      phoneNumber: ""
    }
  });

  async function onSubmit(data: InsertUser) {
    try {
      console.log('Attempting to', isLogin ? 'login' : 'register', 'with:', { ...data, password: '***' });
      const result = await (isLogin ? login(data) : register(data));
      if (!result.ok) {
        console.error('Auth error:', result.message);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: result.message
        });
      } else {
        toast({
          title: "Success",
          description: `Successfully ${isLogin ? 'logged in' : 'registered'}!`
        });
        // Redirect will happen automatically through the useUser hook
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred"
      });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" 
         style={{ backgroundImage: `url(${isLogin ? 
           'https://images.unsplash.com/photo-1668927276505-ab7126bad420' : 
           'https://images.unsplash.com/photo-1529390079861-591de354faf5'})` }}>
      <Card className="w-[400px] backdrop-blur-sm bg-white/90">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">
            {isLogin ? "Welcome Back" : "Join Our Community"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!isLogin && (
                <>
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === "teacher") {
                              form.setValue("phoneNumber", "+");
                            } else {
                              form.setValue("phoneNumber", "");
                            }
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("role") === "teacher" && (
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (with country code)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="+1234567890"
                              onChange={(e) => {
                                let value = e.target.value;
                                if (!value.startsWith('+')) {
                                  value = '+' + value;
                                }
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isLogin && (
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="space-y-2">
                <Button type="submit" className="w-full">
                  {isLogin ? "Login" : "Register"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Need an account? Register" : "Already have an account? Login"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
