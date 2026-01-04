import { Role } from "@/constants/role";

export const mapRoleToEnum = (role: string): Role => {
  const normalized = role.toLowerCase();
  switch (normalized) {
    case Role.TRANSLATOR:
      return Role.TRANSLATOR;
    case Role.ADMINISTRATOR:
      return Role.ADMINISTRATOR;
    case Role.CUSTOMER:
      return Role.CUSTOMER;
    default:
      throw new Error(`Unknown role: ${role}`);
  }
};
