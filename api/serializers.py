from rest_framework import serializers
from .models import User, TeacherStudent, Assignment, Submission, TeacherSchedule

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'avatar', 'phone_number', 'full_name']
        read_only_fields = ['id']

class TeacherStudentSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    teacher = UserSerializer(read_only=True)

    class Meta:
        model = TeacherStudent
        fields = ['id', 'teacher', 'student', 'created_at']

class AssignmentSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    student = UserSerializer(read_only=True)

    class Meta:
        model = Assignment
        fields = ['id', 'title', 'description', 'due_date', 'teacher', 'student', 'status', 'created_at']

class SubmissionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)

    class Meta:
        model = Submission
        fields = ['id', 'assignment', 'student', 'content', 'submitted_at']

class TeacherScheduleSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    student = UserSerializer(read_only=True)

    class Meta:
        model = TeacherSchedule
        fields = ['id', 'teacher', 'day_of_week', 'start_time', 'end_time', 
                 'is_available', 'title', 'description', 'student', 'created_at']
