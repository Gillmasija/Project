import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"),
  fullName: text("full_name").notNull(),
  avatar: text("avatar").notNull(),
  phoneNumber: text("phone_number"),
  createdAt: timestamp("created_at").defaultNow()
});

export const teacherStudents = pgTable("teacher_students", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull()
});

export const assignments = pgTable("assignments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date").notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  studentId: integer("student_id").references(() => users.id),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow()
});

export const submissions = pgTable("submissions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  assignmentId: integer("assignment_id").references(() => assignments.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow()
});

export const teacherSchedule = pgTable("teacher_schedule", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 for Sunday-Saturday
  startTime: text("start_time").notNull(), // Format: "HH:MM"
  endTime: text("end_time").notNull(), // Format: "HH:MM"
  isAvailable: boolean("is_available").notNull().default(true),
  title: text("title"),
  description: text("description"),
  cancellationReason: text("cancellation_reason"),
  studentId: integer("student_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertTeacherScheduleSchema = createInsertSchema(teacherSchedule);
export const selectTeacherScheduleSchema = createSelectSchema(teacherSchedule);
export type InsertTeacherSchedule = z.infer<typeof insertTeacherScheduleSchema>;
export type TeacherSchedule = z.infer<typeof selectTeacherScheduleSchema>;

export interface User extends z.infer<typeof selectUserSchema> {
  id: number;
  role: string;
  username: string;
  fullName: string;
  avatar: string;
}
