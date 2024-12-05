import { type Express } from "express";
import { db } from "../db";
import { setupAuth, isAuthenticated, isTeacher, isStudent } from "./auth";
import { users, assignments, submissions, teacherStudents, teacherSchedule } from "@db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";

export function registerRoutes(app: Express) {
  // Set up authentication routes
  setupAuth(app);

  // Teacher routes
  app.get("/api/teacher/stats", isAuthenticated, isTeacher, async (req, res) => {
    const [assignmentCount] = await db
      .select({ count: count(assignments.id) })
      .from(assignments)
      .where(eq(assignments.teacherId, req.user!.id));

    const [submissionCount] = await db
      .select({ count: count(submissions.id) })
      .from(submissions)
      .innerJoin(assignments, eq(assignments.id, submissions.assignmentId))
      .where(eq(assignments.teacherId, req.user!.id));

    res.json({
      assignments: assignmentCount?.count || 0,
      submissions: submissionCount?.count || 0,
      completed: submissionCount?.count || 0,
      pending: (assignmentCount?.count || 0) - (submissionCount?.count || 0)
    });
  });

  app.get("/api/teacher/students", isAuthenticated, isTeacher, async (req, res) => {
    const students = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        avatar: users.avatar,
        submissions: count(submissions.id),
        completedAssignments: count()
      })
      .from(teacherStudents)
      .innerJoin(users, eq(users.id, teacherStudents.studentId))
      .leftJoin(submissions, eq(submissions.studentId, users.id))
      .where(eq(teacherStudents.teacherId, req.user!.id))
      .groupBy(users.id, users.fullName, users.avatar);

    res.json(students);
  });

  // Student routes
  app.get("/api/student/stats", isAuthenticated, isStudent, async (req, res) => {
    const [assignmentCount] = await db
      .select({ count: count(assignments.id) })
      .from(teacherStudents)
      .innerJoin(assignments, eq(assignments.teacherId, teacherStudents.teacherId))
      .where(eq(teacherStudents.studentId, req.user!.id));

    const [submissionCount] = await db
      .select({ count: count(submissions.id) })
      .from(submissions)
      .where(eq(submissions.studentId, req.user!.id));

    res.json({
      assignments: assignmentCount?.count || 0,
      submissions: submissionCount?.count || 0,
      completed: submissionCount?.count || 0,
      pending: (assignmentCount?.count || 0) - (submissionCount?.count || 0)
    });
  });

  app.get("/api/student/teacher", isAuthenticated, isStudent, async (req, res) => {
    const [teacher] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        avatar: users.avatar
      })
      .from(teacherStudents)
      .innerJoin(users, eq(users.id, teacherStudents.teacherId))
      .where(eq(teacherStudents.studentId, req.user!.id))
      .limit(1);

    res.json(teacher);
  });

  // Assignment routes
  app.get("/api/assignments", isAuthenticated, async (req, res) => {
    const userAssignments = req.user!.role === "teacher"
      ? await db
          .select({
            id: assignments.id,
            title: assignments.title,
            description: assignments.description,
            dueDate: assignments.dueDate,
            teacherId: assignments.teacherId,
            createdAt: assignments.createdAt
          })
          .from(assignments)
          .where(eq(assignments.teacherId, req.user!.id))
          .orderBy(desc(assignments.createdAt))
      : await db
          .select({
            id: assignments.id,
            title: assignments.title,
            description: assignments.description,
            dueDate: assignments.dueDate,
            teacherId: assignments.teacherId,
            createdAt: assignments.createdAt,
            submission: {
              content: submissions.content,
              submittedAt: submissions.submittedAt
            }
          })
          .from(teacherStudents)
          .innerJoin(assignments, eq(assignments.teacherId, teacherStudents.teacherId))
          .leftJoin(submissions, and(
            eq(submissions.assignmentId, assignments.id),
            eq(submissions.studentId, req.user!.id)
          ))
          .where(eq(teacherStudents.studentId, req.user!.id))
          .orderBy(desc(assignments.createdAt));

    res.json(userAssignments);
  });

  app.post("/api/assignments", isAuthenticated, isTeacher, async (req, res) => {
    const { title, description, dueDate } = req.body;
    const [newAssignment] = await db
      .insert(assignments)
      .values({
        title,
        description,
        dueDate: new Date(dueDate),
        teacherId: req.user!.id
      })
      .returning();

    res.json(newAssignment);
  });

  app.post("/api/assignments/:id/submit", isAuthenticated, isStudent, async (req, res) => {
    const { content } = req.body;
    const assignmentId = parseInt(req.params.id);

    const [submission] = await db
      .insert(submissions)
      .values({
        content,
        assignmentId,
        studentId: req.user!.id
      })
      .returning();

    res.json(submission);
  });

  // Teacher Schedule Routes
  app.get("/api/teacher/schedule", isAuthenticated, isTeacher, async (req, res) => {
    const schedules = await db
      .select()
      .from(teacherSchedule)
      .where(eq(teacherSchedule.teacherId, req.user!.id))
      .orderBy(teacherSchedule.dayOfWeek, teacherSchedule.startTime);

    res.json(schedules);
  });

  app.post("/api/teacher/schedule", isAuthenticated, isTeacher, async (req, res) => {
    const { dayOfWeek, startTime, endTime } = req.body;
    
    const [newSchedule] = await db
      .insert(teacherSchedule)
      .values({
        teacherId: req.user!.id,
        dayOfWeek,
        startTime,
        endTime,
        isAvailable: true
      })
      .returning();

    res.json(newSchedule);
  });

  app.put("/api/teacher/schedule/:id", isAuthenticated, isTeacher, async (req, res) => {
    const scheduleId = parseInt(req.params.id);
    const { isAvailable } = req.body;

    const [updatedSchedule] = await db
      .update(teacherSchedule)
      .set({ isAvailable })
      .where(and(
        eq(teacherSchedule.id, scheduleId),
        eq(teacherSchedule.teacherId, req.user!.id)
      ))
      .returning();

    res.json(updatedSchedule);
  });

  app.get("/api/student/teacher-schedule", isAuthenticated, isStudent, async (req, res) => {
    const [teacher] = await db
      .select({
        teacherId: teacherStudents.teacherId
      })
      .from(teacherStudents)
      .where(eq(teacherStudents.studentId, req.user!.id))
      .limit(1);

    if (!teacher) {
      return res.status(404).send("No assigned teacher found");
    }

    const schedule = await db
      .select()
      .from(teacherSchedule)
      .where(and(
        eq(teacherSchedule.teacherId, teacher.teacherId),
        eq(teacherSchedule.isAvailable, true)
      ))
      .orderBy(teacherSchedule.dayOfWeek, teacherSchedule.startTime);

    res.json(schedule);
  });
}