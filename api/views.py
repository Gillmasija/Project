from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.contrib import messages
from django.db.models import Count
from django.shortcuts import get_object_or_404
from .models import User, TeacherStudent, Assignment, Submission, TeacherSchedule

def home(request):
    if not request.user.is_authenticated:
        return redirect('login')
    
    if request.user.role == 'teacher':
        return redirect('teacher_dashboard')
    elif request.user.role == 'student':
        return redirect('student_dashboard')
    else:
        messages.error(request, 'Invalid user role')
        return redirect('login')

@require_http_methods(["GET", "POST"])
def register(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        role = request.POST.get('role')
        full_name = request.POST.get('full_name')
        
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists')
            return redirect('register')
        
        if role not in ['teacher', 'student']:
            messages.error(request, 'Invalid role selected')
            return redirect('register')
        
        user = User.objects.create_user(
            username=username,
            password=password,
            role=role,
            full_name=full_name
        )
        login(request, user)
        return redirect('home')
    
    return render(request, 'registration/register.html')

@login_required
def teacher_dashboard(request):
    if request.user.role != 'teacher':
        messages.error(request, 'Access denied. Teacher privileges required.')
        return redirect('home')
    
    context = {
        'students': TeacherStudent.objects.filter(teacher=request.user).select_related('student'),
        'assignments': Assignment.objects.filter(teacher=request.user),
        'schedule': TeacherSchedule.objects.filter(teacher=request.user),
        'stats': {
            'total_students': TeacherStudent.objects.filter(teacher=request.user).count(),
            'total_assignments': Assignment.objects.filter(teacher=request.user).count(),
            'total_submissions': Submission.objects.filter(
                assignment__teacher=request.user
            ).count(),
        }
    }
    return render(request, 'teacher/dashboard.html', context)

@login_required
def student_dashboard(request):
    if request.user.role != 'student':
        messages.error(request, 'Access denied. Student privileges required.')
        return redirect('home')
    
    teacher_student = TeacherStudent.objects.filter(student=request.user).first()
    
    context = {
        'teacher': teacher_student.teacher if teacher_student else None,
        'assignments': Assignment.objects.filter(student=request.user),
        'schedule': TeacherSchedule.objects.filter(
            teacher=teacher_student.teacher if teacher_student else None,
            is_available=True
        ),
        'stats': {
            'total_assignments': Assignment.objects.filter(student=request.user).count(),
            'completed_assignments': Assignment.objects.filter(
                student=request.user,
                status='completed'
            ).count(),
            'pending_assignments': Assignment.objects.filter(
                student=request.user,
                status='pending'
            ).count(),
        }
    }
    return render(request, 'student/dashboard.html', context)

# Remove REST framework specific code as we're using pure Django views now
