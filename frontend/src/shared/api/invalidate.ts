// filepath: /shared/api/invalidate.ts
import { useQueryClient } from "@tanstack/react-query";

export type QueryKeyType = (string | object | undefined)[];

export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return (queryKeys: readonly QueryKeyType[]) => {
    queryKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  };
};