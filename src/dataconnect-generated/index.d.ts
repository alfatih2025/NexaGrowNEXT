import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AddMemberData {
  projectMember_insert: ProjectMember_Key;
}

export interface AddMemberVariables {
  projectId: UUIDString;
  userId: UUIDString;
}

export interface CreateProjectData {
  project_insert: Project_Key;
}

export interface CreateProjectVariables {
  name: string;
  description?: string | null;
}

export interface CreateTaskData {
  task_insert: Task_Key;
}

export interface CreateTaskVariables {
  title: string;
  projectId: UUIDString;
  assignedUserId?: UUIDString | null;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface DeleteProjectData {
  project_delete?: Project_Key | null;
}

export interface DeleteProjectVariables {
  id: UUIDString;
}

export interface DeleteTaskData {
  task_delete?: Task_Key | null;
}

export interface DeleteTaskVariables {
  id: UUIDString;
}

export interface DeleteUserData {
  user_delete?: User_Key | null;
}

export interface GetCurrentUserData {
  user?: {
    id: UUIDString;
    email: string;
    displayName: string;
  } & User_Key;
}

export interface GetProjectData {
  project?: {
    name: string;
    description?: string | null;
    owner: {
      displayName: string;
    };
  };
}

export interface GetProjectMemberData {
  projectMember?: {
    role: string;
    user: {
      displayName: string;
    };
  };
}

export interface GetProjectMemberVariables {
  projectId: UUIDString;
  userId: UUIDString;
}

export interface GetProjectVariables {
  id: UUIDString;
}

export interface GetTaskData {
  task?: {
    title: string;
    status: string;
    project: {
      name: string;
    };
  };
}

export interface GetTaskVariables {
  id: UUIDString;
}

export interface ListAllUsersData {
  users: ({
    id: UUIDString;
    displayName: string;
  } & User_Key)[];
}

export interface ListProjectMembersData {
  projectMembers: ({
    user: {
      displayName: string;
    };
    role: string;
  })[];
}

export interface ListProjectMembersVariables {
  projectId: UUIDString;
}

export interface ListProjectsData {
  projects: ({
    id: UUIDString;
    name: string;
  } & Project_Key)[];
}

export interface ListTasksData {
  tasks: ({
    id: UUIDString;
    title: string;
  } & Task_Key)[];
}

export interface ProjectMember_Key {
  projectId: UUIDString;
  userId: UUIDString;
  __typename?: 'ProjectMember_Key';
}

export interface Project_Key {
  id: UUIDString;
  __typename?: 'Project_Key';
}

export interface RemoveMemberData {
  projectMember_delete?: ProjectMember_Key | null;
}

export interface RemoveMemberVariables {
  projectId: UUIDString;
  userId: UUIDString;
}

export interface Task_Key {
  id: UUIDString;
  __typename?: 'Task_Key';
}

export interface UpdateMemberRoleData {
  projectMember_update?: ProjectMember_Key | null;
}

export interface UpdateMemberRoleVariables {
  projectId: UUIDString;
  userId: UUIDString;
  role: string;
}

export interface UpdateProjectData {
  project_update?: Project_Key | null;
}

export interface UpdateProjectVariables {
  id: UUIDString;
  name?: string | null;
}

export interface UpdateTaskData {
  task_update?: Task_Key | null;
}

export interface UpdateTaskVariables {
  id: UUIDString;
  status: string;
}

export interface UpdateUserData {
  user_update?: User_Key | null;
}

export interface UpdateUserVariables {
  displayName: string;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(): MutationPromise<CreateUserData, undefined>;
export function createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface UpdateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateUserVariables): MutationRef<UpdateUserData, UpdateUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateUserVariables): MutationRef<UpdateUserData, UpdateUserVariables>;
  operationName: string;
}
export const updateUserRef: UpdateUserRef;

export function updateUser(vars: UpdateUserVariables): MutationPromise<UpdateUserData, UpdateUserVariables>;
export function updateUser(dc: DataConnect, vars: UpdateUserVariables): MutationPromise<UpdateUserData, UpdateUserVariables>;

interface DeleteUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<DeleteUserData, undefined>;
  operationName: string;
}
export const deleteUserRef: DeleteUserRef;

export function deleteUser(): MutationPromise<DeleteUserData, undefined>;
export function deleteUser(dc: DataConnect): MutationPromise<DeleteUserData, undefined>;

interface GetCurrentUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetCurrentUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetCurrentUserData, undefined>;
  operationName: string;
}
export const getCurrentUserRef: GetCurrentUserRef;

export function getCurrentUser(options?: ExecuteQueryOptions): QueryPromise<GetCurrentUserData, undefined>;
export function getCurrentUser(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetCurrentUserData, undefined>;

interface ListAllUsersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllUsersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAllUsersData, undefined>;
  operationName: string;
}
export const listAllUsersRef: ListAllUsersRef;

export function listAllUsers(options?: ExecuteQueryOptions): QueryPromise<ListAllUsersData, undefined>;
export function listAllUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListAllUsersData, undefined>;

interface CreateProjectRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateProjectVariables): MutationRef<CreateProjectData, CreateProjectVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateProjectVariables): MutationRef<CreateProjectData, CreateProjectVariables>;
  operationName: string;
}
export const createProjectRef: CreateProjectRef;

export function createProject(vars: CreateProjectVariables): MutationPromise<CreateProjectData, CreateProjectVariables>;
export function createProject(dc: DataConnect, vars: CreateProjectVariables): MutationPromise<CreateProjectData, CreateProjectVariables>;

interface UpdateProjectRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateProjectVariables): MutationRef<UpdateProjectData, UpdateProjectVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateProjectVariables): MutationRef<UpdateProjectData, UpdateProjectVariables>;
  operationName: string;
}
export const updateProjectRef: UpdateProjectRef;

export function updateProject(vars: UpdateProjectVariables): MutationPromise<UpdateProjectData, UpdateProjectVariables>;
export function updateProject(dc: DataConnect, vars: UpdateProjectVariables): MutationPromise<UpdateProjectData, UpdateProjectVariables>;

interface DeleteProjectRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteProjectVariables): MutationRef<DeleteProjectData, DeleteProjectVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteProjectVariables): MutationRef<DeleteProjectData, DeleteProjectVariables>;
  operationName: string;
}
export const deleteProjectRef: DeleteProjectRef;

export function deleteProject(vars: DeleteProjectVariables): MutationPromise<DeleteProjectData, DeleteProjectVariables>;
export function deleteProject(dc: DataConnect, vars: DeleteProjectVariables): MutationPromise<DeleteProjectData, DeleteProjectVariables>;

interface GetProjectRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetProjectVariables): QueryRef<GetProjectData, GetProjectVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetProjectVariables): QueryRef<GetProjectData, GetProjectVariables>;
  operationName: string;
}
export const getProjectRef: GetProjectRef;

export function getProject(vars: GetProjectVariables, options?: ExecuteQueryOptions): QueryPromise<GetProjectData, GetProjectVariables>;
export function getProject(dc: DataConnect, vars: GetProjectVariables, options?: ExecuteQueryOptions): QueryPromise<GetProjectData, GetProjectVariables>;

interface ListProjectsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProjectsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListProjectsData, undefined>;
  operationName: string;
}
export const listProjectsRef: ListProjectsRef;

export function listProjects(options?: ExecuteQueryOptions): QueryPromise<ListProjectsData, undefined>;
export function listProjects(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListProjectsData, undefined>;

interface CreateTaskRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateTaskVariables): MutationRef<CreateTaskData, CreateTaskVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateTaskVariables): MutationRef<CreateTaskData, CreateTaskVariables>;
  operationName: string;
}
export const createTaskRef: CreateTaskRef;

export function createTask(vars: CreateTaskVariables): MutationPromise<CreateTaskData, CreateTaskVariables>;
export function createTask(dc: DataConnect, vars: CreateTaskVariables): MutationPromise<CreateTaskData, CreateTaskVariables>;

interface UpdateTaskRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateTaskVariables): MutationRef<UpdateTaskData, UpdateTaskVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateTaskVariables): MutationRef<UpdateTaskData, UpdateTaskVariables>;
  operationName: string;
}
export const updateTaskRef: UpdateTaskRef;

export function updateTask(vars: UpdateTaskVariables): MutationPromise<UpdateTaskData, UpdateTaskVariables>;
export function updateTask(dc: DataConnect, vars: UpdateTaskVariables): MutationPromise<UpdateTaskData, UpdateTaskVariables>;

interface DeleteTaskRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteTaskVariables): MutationRef<DeleteTaskData, DeleteTaskVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteTaskVariables): MutationRef<DeleteTaskData, DeleteTaskVariables>;
  operationName: string;
}
export const deleteTaskRef: DeleteTaskRef;

export function deleteTask(vars: DeleteTaskVariables): MutationPromise<DeleteTaskData, DeleteTaskVariables>;
export function deleteTask(dc: DataConnect, vars: DeleteTaskVariables): MutationPromise<DeleteTaskData, DeleteTaskVariables>;

interface GetTaskRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetTaskVariables): QueryRef<GetTaskData, GetTaskVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetTaskVariables): QueryRef<GetTaskData, GetTaskVariables>;
  operationName: string;
}
export const getTaskRef: GetTaskRef;

export function getTask(vars: GetTaskVariables, options?: ExecuteQueryOptions): QueryPromise<GetTaskData, GetTaskVariables>;
export function getTask(dc: DataConnect, vars: GetTaskVariables, options?: ExecuteQueryOptions): QueryPromise<GetTaskData, GetTaskVariables>;

interface ListTasksRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListTasksData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListTasksData, undefined>;
  operationName: string;
}
export const listTasksRef: ListTasksRef;

export function listTasks(options?: ExecuteQueryOptions): QueryPromise<ListTasksData, undefined>;
export function listTasks(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListTasksData, undefined>;

interface AddMemberRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddMemberVariables): MutationRef<AddMemberData, AddMemberVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddMemberVariables): MutationRef<AddMemberData, AddMemberVariables>;
  operationName: string;
}
export const addMemberRef: AddMemberRef;

export function addMember(vars: AddMemberVariables): MutationPromise<AddMemberData, AddMemberVariables>;
export function addMember(dc: DataConnect, vars: AddMemberVariables): MutationPromise<AddMemberData, AddMemberVariables>;

interface UpdateMemberRoleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateMemberRoleVariables): MutationRef<UpdateMemberRoleData, UpdateMemberRoleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateMemberRoleVariables): MutationRef<UpdateMemberRoleData, UpdateMemberRoleVariables>;
  operationName: string;
}
export const updateMemberRoleRef: UpdateMemberRoleRef;

export function updateMemberRole(vars: UpdateMemberRoleVariables): MutationPromise<UpdateMemberRoleData, UpdateMemberRoleVariables>;
export function updateMemberRole(dc: DataConnect, vars: UpdateMemberRoleVariables): MutationPromise<UpdateMemberRoleData, UpdateMemberRoleVariables>;

interface RemoveMemberRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RemoveMemberVariables): MutationRef<RemoveMemberData, RemoveMemberVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RemoveMemberVariables): MutationRef<RemoveMemberData, RemoveMemberVariables>;
  operationName: string;
}
export const removeMemberRef: RemoveMemberRef;

export function removeMember(vars: RemoveMemberVariables): MutationPromise<RemoveMemberData, RemoveMemberVariables>;
export function removeMember(dc: DataConnect, vars: RemoveMemberVariables): MutationPromise<RemoveMemberData, RemoveMemberVariables>;

interface GetProjectMemberRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetProjectMemberVariables): QueryRef<GetProjectMemberData, GetProjectMemberVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetProjectMemberVariables): QueryRef<GetProjectMemberData, GetProjectMemberVariables>;
  operationName: string;
}
export const getProjectMemberRef: GetProjectMemberRef;

export function getProjectMember(vars: GetProjectMemberVariables, options?: ExecuteQueryOptions): QueryPromise<GetProjectMemberData, GetProjectMemberVariables>;
export function getProjectMember(dc: DataConnect, vars: GetProjectMemberVariables, options?: ExecuteQueryOptions): QueryPromise<GetProjectMemberData, GetProjectMemberVariables>;

interface ListProjectMembersRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListProjectMembersVariables): QueryRef<ListProjectMembersData, ListProjectMembersVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListProjectMembersVariables): QueryRef<ListProjectMembersData, ListProjectMembersVariables>;
  operationName: string;
}
export const listProjectMembersRef: ListProjectMembersRef;

export function listProjectMembers(vars: ListProjectMembersVariables, options?: ExecuteQueryOptions): QueryPromise<ListProjectMembersData, ListProjectMembersVariables>;
export function listProjectMembers(dc: DataConnect, vars: ListProjectMembersVariables, options?: ExecuteQueryOptions): QueryPromise<ListProjectMembersData, ListProjectMembersVariables>;

