import { CreateUserData, UpdateUserData, UpdateUserVariables, DeleteUserData, GetCurrentUserData, ListAllUsersData, CreateProjectData, CreateProjectVariables, UpdateProjectData, UpdateProjectVariables, DeleteProjectData, DeleteProjectVariables, GetProjectData, GetProjectVariables, ListProjectsData, CreateTaskData, CreateTaskVariables, UpdateTaskData, UpdateTaskVariables, DeleteTaskData, DeleteTaskVariables, GetTaskData, GetTaskVariables, ListTasksData, AddMemberData, AddMemberVariables, UpdateMemberRoleData, UpdateMemberRoleVariables, RemoveMemberData, RemoveMemberVariables, GetProjectMemberData, GetProjectMemberVariables, ListProjectMembersData, ListProjectMembersVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;

export function useUpdateUser(options?: useDataConnectMutationOptions<UpdateUserData, FirebaseError, UpdateUserVariables>): UseDataConnectMutationResult<UpdateUserData, UpdateUserVariables>;
export function useUpdateUser(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateUserData, FirebaseError, UpdateUserVariables>): UseDataConnectMutationResult<UpdateUserData, UpdateUserVariables>;

export function useDeleteUser(options?: useDataConnectMutationOptions<DeleteUserData, FirebaseError, void>): UseDataConnectMutationResult<DeleteUserData, undefined>;
export function useDeleteUser(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteUserData, FirebaseError, void>): UseDataConnectMutationResult<DeleteUserData, undefined>;

export function useGetCurrentUser(options?: useDataConnectQueryOptions<GetCurrentUserData>): UseDataConnectQueryResult<GetCurrentUserData, undefined>;
export function useGetCurrentUser(dc: DataConnect, options?: useDataConnectQueryOptions<GetCurrentUserData>): UseDataConnectQueryResult<GetCurrentUserData, undefined>;

export function useListAllUsers(options?: useDataConnectQueryOptions<ListAllUsersData>): UseDataConnectQueryResult<ListAllUsersData, undefined>;
export function useListAllUsers(dc: DataConnect, options?: useDataConnectQueryOptions<ListAllUsersData>): UseDataConnectQueryResult<ListAllUsersData, undefined>;

export function useCreateProject(options?: useDataConnectMutationOptions<CreateProjectData, FirebaseError, CreateProjectVariables>): UseDataConnectMutationResult<CreateProjectData, CreateProjectVariables>;
export function useCreateProject(dc: DataConnect, options?: useDataConnectMutationOptions<CreateProjectData, FirebaseError, CreateProjectVariables>): UseDataConnectMutationResult<CreateProjectData, CreateProjectVariables>;

export function useUpdateProject(options?: useDataConnectMutationOptions<UpdateProjectData, FirebaseError, UpdateProjectVariables>): UseDataConnectMutationResult<UpdateProjectData, UpdateProjectVariables>;
export function useUpdateProject(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateProjectData, FirebaseError, UpdateProjectVariables>): UseDataConnectMutationResult<UpdateProjectData, UpdateProjectVariables>;

export function useDeleteProject(options?: useDataConnectMutationOptions<DeleteProjectData, FirebaseError, DeleteProjectVariables>): UseDataConnectMutationResult<DeleteProjectData, DeleteProjectVariables>;
export function useDeleteProject(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteProjectData, FirebaseError, DeleteProjectVariables>): UseDataConnectMutationResult<DeleteProjectData, DeleteProjectVariables>;

export function useGetProject(vars: GetProjectVariables, options?: useDataConnectQueryOptions<GetProjectData>): UseDataConnectQueryResult<GetProjectData, GetProjectVariables>;
export function useGetProject(dc: DataConnect, vars: GetProjectVariables, options?: useDataConnectQueryOptions<GetProjectData>): UseDataConnectQueryResult<GetProjectData, GetProjectVariables>;

export function useListProjects(options?: useDataConnectQueryOptions<ListProjectsData>): UseDataConnectQueryResult<ListProjectsData, undefined>;
export function useListProjects(dc: DataConnect, options?: useDataConnectQueryOptions<ListProjectsData>): UseDataConnectQueryResult<ListProjectsData, undefined>;

export function useCreateTask(options?: useDataConnectMutationOptions<CreateTaskData, FirebaseError, CreateTaskVariables>): UseDataConnectMutationResult<CreateTaskData, CreateTaskVariables>;
export function useCreateTask(dc: DataConnect, options?: useDataConnectMutationOptions<CreateTaskData, FirebaseError, CreateTaskVariables>): UseDataConnectMutationResult<CreateTaskData, CreateTaskVariables>;

export function useUpdateTask(options?: useDataConnectMutationOptions<UpdateTaskData, FirebaseError, UpdateTaskVariables>): UseDataConnectMutationResult<UpdateTaskData, UpdateTaskVariables>;
export function useUpdateTask(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateTaskData, FirebaseError, UpdateTaskVariables>): UseDataConnectMutationResult<UpdateTaskData, UpdateTaskVariables>;

export function useDeleteTask(options?: useDataConnectMutationOptions<DeleteTaskData, FirebaseError, DeleteTaskVariables>): UseDataConnectMutationResult<DeleteTaskData, DeleteTaskVariables>;
export function useDeleteTask(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteTaskData, FirebaseError, DeleteTaskVariables>): UseDataConnectMutationResult<DeleteTaskData, DeleteTaskVariables>;

export function useGetTask(vars: GetTaskVariables, options?: useDataConnectQueryOptions<GetTaskData>): UseDataConnectQueryResult<GetTaskData, GetTaskVariables>;
export function useGetTask(dc: DataConnect, vars: GetTaskVariables, options?: useDataConnectQueryOptions<GetTaskData>): UseDataConnectQueryResult<GetTaskData, GetTaskVariables>;

export function useListTasks(options?: useDataConnectQueryOptions<ListTasksData>): UseDataConnectQueryResult<ListTasksData, undefined>;
export function useListTasks(dc: DataConnect, options?: useDataConnectQueryOptions<ListTasksData>): UseDataConnectQueryResult<ListTasksData, undefined>;

export function useAddMember(options?: useDataConnectMutationOptions<AddMemberData, FirebaseError, AddMemberVariables>): UseDataConnectMutationResult<AddMemberData, AddMemberVariables>;
export function useAddMember(dc: DataConnect, options?: useDataConnectMutationOptions<AddMemberData, FirebaseError, AddMemberVariables>): UseDataConnectMutationResult<AddMemberData, AddMemberVariables>;

export function useUpdateMemberRole(options?: useDataConnectMutationOptions<UpdateMemberRoleData, FirebaseError, UpdateMemberRoleVariables>): UseDataConnectMutationResult<UpdateMemberRoleData, UpdateMemberRoleVariables>;
export function useUpdateMemberRole(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateMemberRoleData, FirebaseError, UpdateMemberRoleVariables>): UseDataConnectMutationResult<UpdateMemberRoleData, UpdateMemberRoleVariables>;

export function useRemoveMember(options?: useDataConnectMutationOptions<RemoveMemberData, FirebaseError, RemoveMemberVariables>): UseDataConnectMutationResult<RemoveMemberData, RemoveMemberVariables>;
export function useRemoveMember(dc: DataConnect, options?: useDataConnectMutationOptions<RemoveMemberData, FirebaseError, RemoveMemberVariables>): UseDataConnectMutationResult<RemoveMemberData, RemoveMemberVariables>;

export function useGetProjectMember(vars: GetProjectMemberVariables, options?: useDataConnectQueryOptions<GetProjectMemberData>): UseDataConnectQueryResult<GetProjectMemberData, GetProjectMemberVariables>;
export function useGetProjectMember(dc: DataConnect, vars: GetProjectMemberVariables, options?: useDataConnectQueryOptions<GetProjectMemberData>): UseDataConnectQueryResult<GetProjectMemberData, GetProjectMemberVariables>;

export function useListProjectMembers(vars: ListProjectMembersVariables, options?: useDataConnectQueryOptions<ListProjectMembersData>): UseDataConnectQueryResult<ListProjectMembersData, ListProjectMembersVariables>;
export function useListProjectMembers(dc: DataConnect, vars: ListProjectMembersVariables, options?: useDataConnectQueryOptions<ListProjectMembersData>): UseDataConnectQueryResult<ListProjectMembersData, ListProjectMembersVariables>;
