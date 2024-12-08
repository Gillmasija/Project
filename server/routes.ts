import { type Express } from "express";
import express from "express";
import { db } from "../db";
import { setupAuth, isAuthenticated, isTeacher, isStudent } from "./auth";
import { users, assignments, submissions, teacherStudents, teacherSchedule } from "@db/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { eq, and, desc, count, sql } from "drizzle-orm";

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req: Express.Request, file: Express.Multer.File, cb: Function) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req: Express.Request, file: Express.Multer.File, cb: Function) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: Function) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

export function registerRoutes(app: Express) {
  setupAuth(app);

  // Avatar upload route
  app.post("/api/user/avatar", isAuthenticated, upload.single('avatar'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send("No file uploaded");
      }

      const avatarUrl = `/uploads/${req.file.filename}`;
      
      await db
        .update(users)
        .set({ avatar: avatarUrl })
        .where(eq(users.id, req.user!.id));

      res.json({ avatar: avatarUrl });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  // Update user profile
  app.put("/api/user/profile", isAuthenticated, async (req, res) => {
    const { fullName, phoneNumber } = req.body;

    const [updatedUser] = await db
      .update(users)
      .set({
        fullName: fullName || req.user!.fullName,
        phoneNumber: phoneNumber || req.user!.phoneNumber,
      })
      .where(eq(users.id, req.user!.id))
      .returning();

    res.json(updatedUser);
  });

  // Delete user account
  app.delete("/api/user", isAuthenticated, async (req, res) => {
    await db
      .delete(users)
      .where(eq(users.id, req.user!.id));

    req.logout((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }
      res.json({ message: "Account deleted successfully" });
    });
  });

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
        avatar: users.avatar,
        phoneNumber: users.phoneNumber
      })
      .from(teacherStudents)
      .innerJoin(users, eq(users.id, teacherStudents.teacherId))
      .where(eq(teacherStudents.studentId, req.user!.id))
      .limit(1);

    res.json(teacher);
  });

  // Assignment routes
  // Get all assignments
  app.get("/api/assignments", isAuthenticated, async (req, res) => {
    const userAssignments = req.user!.role === "teacher"
      ? await db
          .select({
            id: assignments.id,
            title: assignments.title,
            description: assignments.description,
            dueDate: assignments.dueDate,
            teacherId: assignments.teacherId,
            studentId: assignments.studentId,
            status: assignments.status,
            createdAt: assignments.createdAt,
            student: {
              id: users.id,
              fullName: users.fullName,
              avatar: users.avatar
            },
            submission: {
              content: submissions.content,
              submittedAt: submissions.submittedAt,
              isReviewed: submissions.isReviewed,
              reviewContent: submissions.reviewContent,
              reviewedAt: submissions.reviewedAt
            }
          })
          .from(assignments)
          .leftJoin(users, eq(assignments.studentId, users.id))
          .leftJoin(submissions, eq(submissions.assignmentId, assignments.id))
          .where(eq(assignments.teacherId, req.user!.id))
          .orderBy(desc(assignments.createdAt))
      : await db
          .select({
            id: assignments.id,
            title: assignments.title,
            description: assignments.description,
            dueDate: assignments.dueDate,
            teacherId: assignments.teacherId,
            status: assignments.status,
            createdAt: assignments.createdAt,
            submission: {
              content: submissions.content,
              submittedAt: submissions.submittedAt,
              isReviewed: submissions.isReviewed,
              reviewContent: submissions.reviewContent,
              reviewedAt: submissions.reviewedAt
            }
          })
          .from(assignments)
          .where(eq(assignments.studentId, req.user!.id))
          .leftJoin(submissions, and(
            eq(submissions.assignmentId, assignments.id),
            eq(submissions.studentId, req.user!.id)
          ))
          .orderBy(desc(assignments.createdAt));

    res.json(userAssignments);
  });

  // Get a single assignment
  app.get("/api/assignments/:id", isAuthenticated, async (req, res) => {
    const assignmentId = parseInt(req.params.id);
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    if (!assignment) {
      return res.status(404).send("Assignment not found");
    }

    if (req.user!.role === "student" && assignment.studentId !== req.user!.id) {
      return res.status(403).send("Not authorized to view this assignment");
    }

    if (req.user!.role === "teacher" && assignment.teacherId !== req.user!.id) {
      return res.status(403).send("Not authorized to view this assignment");
    }

    res.json(assignment);
  });

  // Update an assignment
  app.put("/api/assignments/:id", isAuthenticated, isTeacher, async (req, res) => {
    const assignmentId = parseInt(req.params.id);
    const { title, description, dueDate, studentId } = req.body;

    const [assignment] = await db
      .select()
      .from(assignments)
      .where(and(
        eq(assignments.id, assignmentId),
        eq(assignments.teacherId, req.user!.id)
      ))
      .limit(1);

    if (!assignment) {
      return res.status(404).send("Assignment not found or not authorized");
    }

    const [updatedAssignment] = await db
      .update(assignments)
      .set({
        title,
        description,
        dueDate: new Date(dueDate),
        studentId: studentId || null
      })
      .where(eq(assignments.id, assignmentId))
      .returning();

    res.json(updatedAssignment);
  });

  // Delete an assignment
  app.delete("/api/assignments/:id", isAuthenticated, isTeacher, async (req, res) => {
    const assignmentId = parseInt(req.params.id);

    const [assignment] = await db
      .select()
      .from(assignments)
      .where(and(
        eq(assignments.id, assignmentId),
        eq(assignments.teacherId, req.user!.id)
      ))
      .limit(1);

    if (!assignment) {
      return res.status(404).send("Assignment not found or not authorized");
    }

    await db
      .delete(assignments)
      .where(eq(assignments.id, assignmentId));

    res.json({ message: "Assignment deleted successfully" });
  });

  app.post("/api/assignments", isAuthenticated, isTeacher, async (req, res) => {
    const { title, description, dueDate, studentId } = req.body;
    
    // Verify if the student is assigned to this teacher
    if (studentId) {
      const [studentTeacher] = await db
        .select()
        .from(teacherStudents)
        .where(and(
          eq(teacherStudents.teacherId, req.user!.id),
          eq(teacherStudents.studentId, studentId)
        ))
        .limit(1);

      if (!studentTeacher) {
        return res.status(400).send("Student not found in your class");
      }
    }

    const [newAssignment] = await db
      .insert(assignments)
      .values({
        title,
        description,
        dueDate: new Date(dueDate),
        teacherId: req.user!.id,
        studentId: studentId || null,
        status: "pending"
      })
      .returning();

    res.json(newAssignment);
  });

  // Submit assignment
  app.post("/api/assignments/:id/submit", isAuthenticated, isStudent, async (req, res) => {
    const { content } = req.body;
    const assignmentId = parseInt(req.params.id);

    const [submission] = await db
      .insert(submissions)
      .values({
        content,
        assignmentId,
        studentId: req.user!.id,
        isReviewed: false,
        submittedAt: new Date()
      })
      .returning();

    // Update assignment status
    await db
      .update(assignments)
      .set({ status: "submitted" })
      .where(eq(assignments.id, assignmentId));

    res.json(submission);
  });

  // Review submission
  app.post("/api/assignments/:id/review", isAuthenticated, isTeacher, async (req, res) => {
    const assignmentId = parseInt(req.params.id);
    const { reviewContent } = req.body;

    // Verify teacher owns this assignment
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(and(
        eq(assignments.id, assignmentId),
        eq(assignments.teacherId, req.user!.id)
      ))
      .limit(1);

    if (!assignment) {
      return res.status(403).send("Not authorized to review this assignment");
    }

    // Update the submission with review
    const [updatedSubmission] = await db
      .update(submissions)
      .set({
        isReviewed: true,
        reviewContent,
        reviewedAt: new Date()
      })
      .where(eq(submissions.assignmentId, assignmentId))
      .returning();

    // Update assignment status
    await db
      .update(assignments)
      .set({ status: "reviewed" })
      .where(eq(assignments.id, assignmentId));

    res.json(updatedSubmission);
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
    const { dayOfWeek, startTime, endTime, title, description, studentId } = req.body;
    
    const [newSchedule] = await db
      .insert(teacherSchedule)
      .values({
        teacherId: req.user!.id,
        dayOfWeek,
        startTime,
        endTime,
        title,
        description,
        studentId: studentId ? parseInt(studentId) : undefined,
        isAvailable: true
      })
      .returning();

    res.json(newSchedule);
  });

  // Update schedule
  app.put("/api/teacher/schedule/:id", isAuthenticated, isTeacher, async (req, res) => {
    const scheduleId = parseInt(req.params.id);
    const { isAvailable, startTime, endTime, title, description, studentId } = req.body;

    const [schedule] = await db
      .select()
      .from(teacherSchedule)
      .where(and(
        eq(teacherSchedule.id, scheduleId),
        eq(teacherSchedule.teacherId, req.user!.id)
      ))
      .limit(1);

    if (!schedule) {
      return res.status(404).send("Schedule not found or not authorized");
    }

    const [updatedSchedule] = await db
      .update(teacherSchedule)
      .set({
        isAvailable,
        startTime: startTime || schedule.startTime,
        endTime: endTime || schedule.endTime,
        title: title || schedule.title,
        description: description || schedule.description,
        studentId: studentId || schedule.studentId
      })
      .where(eq(teacherSchedule.id, scheduleId))
      .returning();

    res.json(updatedSchedule);
  });

  // Delete schedule
  app.delete("/api/teacher/schedule/:id", isAuthenticated, isTeacher, async (req, res) => {
    const scheduleId = parseInt(req.params.id);

    const [schedule] = await db
      .select()
      .from(teacherSchedule)
      .where(and(
        eq(teacherSchedule.id, scheduleId),
        eq(teacherSchedule.teacherId, req.user!.id)
      ))
      .limit(1);

    if (!schedule) {
      return res.status(404).send("Schedule not found or not authorized");
    }

    await db
      .delete(teacherSchedule)
      .where(eq(teacherSchedule.id, scheduleId));

    res.json({ message: "Schedule deleted successfully" });
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