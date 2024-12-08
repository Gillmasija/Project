import { pgTable, serial, timestamp, boolean, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("student"),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  avatar: varchar("avatar", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login")
});

export const teacherStudents = pgTable("teacher_students", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  studentId: integer("student_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date").notNull(),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  studentId: integer("student_id").references(() => users.id),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow()
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => assignments.id),
  studentId: integer("student_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
  isReviewed: boolean("is_reviewed").default(false),
  reviewContent: text("review_content"),
  reviewedAt: timestamp("reviewed_at")
});

export const teacherSchedule = pgTable("teacher_schedule", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 for Sunday-Saturday
  startTime: varchar("start_time", { length: 5 }).notNull(), // Format: "HH:MM"
  endTime: varchar("end_time", { length: 5 }).notNull(), // Format: "HH:MM"
  isAvailable: boolean("is_available").notNull().default(true),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  cancellationReason: text("cancellation_reason"),
  studentId: integer("student_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

// User schemas
export const insertUserSchema = createInsertSchema(users, {
  role: z.enum(["student", "teacher"]),
  username: z.string().min(3).max(255),
  password: z.string().min(6).max(255),
  fullName: z.string().min(1).max(255),
  avatar: z.string().url().optional(),
  phoneNumber: z.string().optional(),
});

export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;

// Assignment schemas
export const insertAssignmentSchema = createInsertSchema(assignments);
export const selectAssignmentSchema = createSelectSchema(assignments);
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = z.infer<typeof selectAssignmentSchema>;

// Submission schemas
export const insertSubmissionSchema = createInsertSchema(submissions);
export const selectSubmissionSchema = createSelectSchema(submissions);
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = z.infer<typeof selectSubmissionSchema>;

// TeacherStudent schemas
export const insertTeacherStudentSchema = createInsertSchema(teacherStudents);
export const selectTeacherStudentSchema = createSelectSchema(teacherStudents);
export type InsertTeacherStudent = z.infer<typeof insertTeacherStudentSchema>;
export type TeacherStudent = z.infer<typeof selectTeacherStudentSchema>;

// TeacherSchedule schemas
export const insertTeacherScheduleSchema = createInsertSchema(teacherSchedule, {
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
});
export const selectTeacherScheduleSchema = createSelectSchema(teacherSchedule);
export type InsertTeacherSchedule = z.infer<typeof insertTeacherScheduleSchema>;
export type TeacherSchedule = z.infer<typeof selectTeacherScheduleSchema>;
