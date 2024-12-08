import { pgTable, serial, timestamp, boolean, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("api_user", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 10 }).notNull().default("student"),
  fullName: varchar("full_name", { length: 255 }),
  avatar: varchar("avatar", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  lastLogin: timestamp("last_login"),
  email: varchar("email", { length: 254 }),
  dateJoined: timestamp("date_joined").defaultNow(),
  isActive: boolean("is_active").default(true),
  isSuperuser: boolean("is_superuser").default(false),
  isStaff: boolean("is_staff").default(false),
  firstName: varchar("first_name", { length: 150 }).default(""),
  lastName: varchar("last_name", { length: 150 }).default("")
});

export const teacherStudents = pgTable("api_teacherstudent", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  studentId: integer("student_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

export const assignments = pgTable("api_assignment", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date").notNull(),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  studentId: integer("student_id").references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow()
});

export const submissions = pgTable("api_submission", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => assignments.id),
  studentId: integer("student_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
  isReviewed: boolean("is_reviewed").default(false),
  reviewContent: text("review_content"),
  reviewedAt: timestamp("reviewed_at")
});

export const teacherSchedule = pgTable("api_teacherschedule", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: varchar("start_time", { length: 5 }).notNull(),
  endTime: varchar("end_time", { length: 5 }).notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  title: varchar("title", { length: 255 }),
  description: text("description"),
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
  email: z.string().email().optional(),
  isActive: z.boolean().default(true),
  isStaff: z.boolean().default(false),
  isSuperuser: z.boolean().default(false),
  firstName: z.string().default(""),
  lastName: z.string().default("")
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
export const insertTeacherScheduleSchema = createInsertSchema(teacherSchedule);
export const selectTeacherScheduleSchema = createSelectSchema(teacherSchedule);
export type InsertTeacherSchedule = z.infer<typeof insertTeacherScheduleSchema>;
export type TeacherSchedule = z.infer<typeof selectTeacherScheduleSchema>;
