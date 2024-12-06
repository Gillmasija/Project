from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from django.shortcuts import get_object_or_404
from .models import User, TeacherStudent, Assignment, Submission, TeacherSchedule
from .serializers import (
    UserSerializer, TeacherStudentSerializer, AssignmentSerializer,
    SubmissionSerializer, TeacherScheduleSerializer
)

class IsTeacherOrStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['teacher', 'student']

class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'teacher'

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'student'

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsTeacher])
    def teacher_stats(self, request):
        assignment_count = Assignment.objects.filter(teacher=request.user).count()
        submission_count = Submission.objects.filter(
            assignment__teacher=request.user
        ).count()

        return Response({
            'assignments': assignment_count,
            'submissions': submission_count,
            'completed': submission_count,
            'pending': assignment_count - submission_count
        })

    @action(detail=False, methods=['get'], permission_classes=[IsStudent])
    def student_stats(self, request):
        assignment_count = Assignment.objects.filter(student=request.user).count()
        submission_count = Submission.objects.filter(student=request.user).count()

        return Response({
            'assignments': assignment_count,
            'submissions': submission_count,
            'completed': submission_count,
            'pending': assignment_count - submission_count
        })

class TeacherStudentViewSet(viewsets.ModelViewSet):
    serializer_class = TeacherStudentSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrStudent]

    def get_queryset(self):
        if self.request.user.role == 'teacher':
            return TeacherStudent.objects.filter(teacher=self.request.user)
        return TeacherStudent.objects.filter(student=self.request.user)

class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrStudent]

    def get_queryset(self):
        if self.request.user.role == 'teacher':
            return Assignment.objects.filter(teacher=self.request.user)
        return Assignment.objects.filter(student=self.request.user)

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

class SubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrStudent]

    def get_queryset(self):
        if self.request.user.role == 'teacher':
            return Submission.objects.filter(assignment__teacher=self.request.user)
        return Submission.objects.filter(student=self.request.user)

    def perform_create(self, serializer):
        assignment = get_object_or_404(
            Assignment, 
            id=self.request.data.get('assignment'),
            student=self.request.user
        )
        serializer.save(student=self.request.user, assignment=assignment)

class TeacherScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = TeacherScheduleSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrStudent]

    def get_queryset(self):
        if self.request.user.role == 'teacher':
            return TeacherSchedule.objects.filter(teacher=self.request.user)
        return TeacherSchedule.objects.filter(
            teacher__teacherstudent__student=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)
