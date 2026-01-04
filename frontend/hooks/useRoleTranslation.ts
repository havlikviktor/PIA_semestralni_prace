import { useTranslations } from "next-intl";
import { Role } from "@/constants/role";
import { mapRoleToEnum } from "@/utils/RoleMapper";

export const useRoleTranslation = () => {
  const t = useTranslations("Roles");
  return (state: string | Role) => {
      const mappedState = mapRoleToEnum(state);
      return t(mappedState);
    };
};
