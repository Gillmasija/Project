import { mysqlTable, int, timestamp, boolean, text, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("student"),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  avatar: varchar("avatar", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow()
});

export const teacherStudents = mysqlTable("teacher_students", {
  id: int("id").primaryKey().autoincrement(),
  teacherId: int("teacher_id").notNull().references(() => users.id),
  studentId: int("student_id").notNull().references(() => users.id)
});

export const assignments = mysqlTable("assignments", {
  id: int("id").primaryKey().autoincrement(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date").notNull(),
  teacherId: int("teacher_id").notNull().references(() => users.id),
  studentId: int("student_id").references(() => users.id),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow()
});

export const submissions = mysqlTable("submissions", {
  id: int("id").primaryKey().autoincrement(),
  assignmentId: int("assignment_id").notNull().references(() => assignments.id),
  studentId: int("student_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
  isReviewed: boolean("is_reviewed").default(false),
  reviewContent: text("review_content"),
  reviewedAt: timestamp("reviewed_at")
});

export const teacherSchedule = mysqlTable("teacher_schedule", {
  id: int("id").primaryKey().autoincrement(),
  teacherId: int("teacher_id").references(() => users.id).notNull(),
  dayOfWeek: int("day_of_week").notNull(), // 0-6 for Sunday-Saturday
  startTime: text("start_time").notNull(), // Format: "HH:MM"
  endTime: text("end_time").notNull(), // Format: "HH:MM"
  isAvailable: boolean("is_available").notNull().default(true),
  title: text("title"),
  description: text("description"),
  cancellationReason: text("cancellation_reason"),
  studentId: int("student_id").references(() => users.id),
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

export const insertSubmissionSchema = createInsertSchema(submissions);
export const selectSubmissionSchema = createSelectSchema(submissions);
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = z.infer<typeof selectSubmissionSchema>;

export const insertTeacherStudentSchema = createInsertSchema(teacherStudents);
export const selectTeacherStudentSchema = createSelectSchema(teacherStudents);
export type InsertTeacherStudent = z.infer<typeof insertTeacherStudentSchema>;
export type TeacherStudent = z.infer<typeof selectTeacherStudentSchema>;
