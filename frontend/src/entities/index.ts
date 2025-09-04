export * from "./deal";
export * from "./kanban";
export * from "./appointment";
export * from "./contact";
export * from "./user";
export * from "./note";
// Group exports (avoiding User type conflict)
export type { Group, GroupsResponse, CreateGroupDTO, UpdateGroupDTO, GroupMember, GroupRole } from "./group";
export {
  useGetGroupsQuery,
  useGetGroupByIdQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useAddGroupMemberMutation,
  useRemoveGroupMemberMutation,
  groupKeys
} from "./group";