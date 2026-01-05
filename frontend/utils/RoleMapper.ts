import { Role } from "@/constants/role";

export const mapRoleToEnum = (
  role: string
): Role => {
  if (!role) return Role.CUSTOMER;
  const normalized = role.toLowerCase();
  switch (normalized) {
    case Role.TRANSLATOR:
      return Role.TRANSLATOR;
    case Role.ADMINISTRATOR:
      return Role.ADMINISTRATOR;
    case Role.CUSTOMER:
      return Role.CUSTOMER;
    default:
      return Role.CUSTOMER;
  }
};
