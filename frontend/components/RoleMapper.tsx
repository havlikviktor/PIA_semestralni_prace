import { useTranslations } from "next-intl";

// Enum definition matching backend User entity
export enum Role {
  CUSTOMER = "customer",
  TRANSLATOR = "translator",
  ADMINISTRATOR = "administrator",
}

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

interface RoleMapperProps {
  role: string;
}

export default function RoleMapper({ role }: RoleMapperProps) {
  const t = useTranslations("Roles");
  const roleKey = mapRoleToEnum(role);

  return <>{t(roleKey)}</>;
}
