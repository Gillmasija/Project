from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'teacher-students', views.TeacherStudentViewSet, basename='teacher-students')
router.register(r'assignments', views.AssignmentViewSet, basename='assignments')
router.register(r'submissions', views.SubmissionViewSet, basename='submissions')
router.register(r'teacher-schedules', views.TeacherScheduleViewSet, basename='teacher-schedules')

urlpatterns = [
    path('', include(router.urls)),
]
