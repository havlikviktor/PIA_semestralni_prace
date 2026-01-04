import { Role } from "@/constants/role";

export const mapRoleToEnum = (
  role: string | undefined | null
): Role | undefined => {
  if (!role) return undefined;
  const normalized = role.toLowerCase();
  switch (normalized) {
    case Role.TRANSLATOR:
      return Role.TRANSLATOR;
    case Role.ADMINISTRATOR:
      return Role.ADMINISTRATOR;
    case Role.CUSTOMER:
      return Role.CUSTOMER;
    default:
      return undefined;
  }
};
