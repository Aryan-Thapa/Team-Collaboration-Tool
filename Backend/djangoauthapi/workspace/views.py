from rest_framework import viewsets
from workspace.models import Workspace,Project,Task
from workspace.serializers import WorkspaceSerializer, ProjectSerializer, WorkspaceDropdownSerializer, TaskSerializer
from rest_framework.permissions import IsAuthenticated,AllowAny,IsAdminUser
from account.models import User
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from account.renderers import UserRenderer
from account.serializers import UserProfileSerializer
from django.db.models import Q
from django.db.models import Count, Case, When

# View for workspace management
class WorkspaceViewSet(viewsets.ModelViewSet):
    queryset = Workspace.objects.all()
    serializer_class = WorkspaceSerializer
    permission_classes = [IsAuthenticated]
    
    # Adding a custom action to fetch workspace names for the dropdown
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        user = self.request.user
        if user.is_admin:
            # Admins see all workspaces
            workspaces = Workspace.objects.all()
        else:
            workspaces = Workspace.objects.filter(owner=user)
        serializer = WorkspaceDropdownSerializer(workspaces, many=True)
        return Response(serializer.data)
    
    def get_queryset(self):
        # only returns workspace that belongs to the authenticated user
        user=self.request.user
        # Return workspaces the user owns or is a member of
        if user.is_admin:
            return Workspace.objects.all()  # Admins can view all workspaces
        return Workspace.objects.filter(Q(owner=user) | Q(members=user)).distinct()
    
    def perform_create(self,serializer):\
        # Automatically set the owner to the current user when creating a workspace
        serializer.save(owner=self.request.user)
        
    def perform_update(self, serializer):
        # Allow only the owner to update
        workspace = self.get_object()
        if self.request.user.is_admin or workspace.owner == self.request.user:
            serializer.save()  # Admin or owner can update
        else:
            raise PermissionDenied("You are not allowed to edit this workspace.")
    
    def perform_destroy(self, instance):
        # Allow only the owner to delete
        if self.request.user.is_admin or instance.owner == self.request.user:
            instance.delete()
        else: 
            raise PermissionDenied("You are not allowed to delete this workspace.")

# View for Project Management
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only return projects within the workspaces owned by the authenticated user
        user = self.request.user
        if user.is_admin:
            return Project.objects.all() #admin can view all the projects
        return Project.objects.filter(Q(workspace__owner=user) | Q(workspace__members=user)).distinct()

    def perform_create(self, serializer):
        # Check if the current user is the owner of the workspace
        workspace = serializer.validated_data['workspace']
        if workspace.owner != self.request.user:
            raise PermissionDenied("You are not the owner of this workspace.")
        # Save the project with the workspace if the user is the owner
        serializer.save()
    
    def perform_update(self, serializer):
        project = self.get_object()
        if self.request.user.is_admin or project.workspace.owner == self.request.user:
            serializer.save() #admin or owner can update project
        else:
            raise PermissionDenied("You are not allowed to edit this project.")
        

    def perform_destroy(self, instance):
        if self.request.user.is_admin or instance.workspace.owner == self.request.user:
            instance.delete()
        else:
            raise PermissionDenied("You are not allowed to delete this project.")
        
        

# View for Task Management
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Task.objects.all()
        # Return tasks within the projects of the workspaces owned by the user
        return Task.objects.filter(Q(project__workspace__owner=user) | Q(assigned_user=user))

    def perform_create(self, serializer):
        user = self.request.user
        project = serializer.validated_data['project']
        # Ensure that the user is the owner of the workspace associated with the project
        if project.workspace.owner != user:
            raise PermissionDenied("You are not authorized to create tasks in this project.")
        serializer.save()
    
    def perform_destroy(self, instance):
        if self.request.user.is_admin or instance.project.workspace.owner == self.request.user:
            instance.delete()
        else:
            raise PermissionDenied("You are not allowed to delete this project.")
        
        
    @action(detail=False, methods=['get'], url_path='workspace-members/(?P<project_id>[^/.]+)')
    def get_workspace_members(self, request, project_id=None):
        try:
            project = Project.objects.get(id=project_id)
            workspace = project.workspace
            members = workspace.members.all()
            member_data = [{'id': member.id, 'name': member.name} for member in members]  
            return Response(member_data)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)

    @action(detail=False, methods=['get'], url_path='my-projects')
    def get_user_projects(self, request):
        user = request.user
        if user.is_admin:
            # Admins see all projects
            projects = Project.objects.all()
        else:
            projects = Project.objects.filter(workspace__owner=user)
        project_data = [{'id': project.id, 'name': project.name} for project in projects]
        return Response(project_data)
    
    # task report generation
    @action(detail=False, methods=['get'], url_path='report',permission_classes=[IsAdminUser])
    def get_progress_report(self, request):
        # Get all tasks and calculate completion rates
        tasks = Task.objects.values('project__name').annotate(
            total_tasks=Count('id'),
            completed_tasks=Count(Case(When(status='completed', then=1))),
            in_progress_tasks=Count(Case(When(status='in_progress', then=1))),
            pending_tasks=Count(Case(When(status='pending', then=1))),
        )
        return Response(tasks)
    
# view to fetch user data for Admin
class UserViewSET(viewsets.ModelViewSet):
    queryset = User.objects.all()  # Fetch all users;
    serializer_class = UserProfileSerializer  
    permission_classes = [IsAdminUser] 
    
    def perform_destroy(self, instance):
        if self.request.user.is_admin:
            instance.delete()
        else:
            raise PermissionDenied("Only admins can delete users.")
    