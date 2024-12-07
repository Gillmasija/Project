from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    avatar = models.URLField(max_length=255, null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    full_name = models.CharField(max_length=255, blank=True)

    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='api_users'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='api_users_permissions'
    )

    def __str__(self):
        return self.username

class TeacherStudent(models.Model):
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='teaching')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('teacher', 'student')

class Assignment(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    due_date = models.DateTimeField()
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_assignments')
    student = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='assigned_assignments')
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

class Submission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE)
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

class TeacherSchedule(models.Model):
    teacher = models.ForeignKey(User, on_delete=models.CASCADE)
    day_of_week = models.IntegerField()  # 0-6 for Sunday-Saturday
    start_time = models.CharField(max_length=5)  # Format: "HH:MM"
    end_time = models.CharField(max_length=5)    # Format: "HH:MM"
    is_available = models.BooleanField(default=True)
    title = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    student = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='scheduled_sessions')
    created_at = models.DateTimeField(auto_now_add=True)
