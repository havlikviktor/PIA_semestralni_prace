import { useTranslations } from 'next-intl';
import type { UserInfo } from '@/types/user';
import InfoField from './InfoField';
import { Role } from '@/constants/role';
import { mapRoleToEnum } from '@/utils/RoleMapper';

interface UserInfoProps {
  titleKey: string;
  user: UserInfo;
  isCurrentUser: boolean;
  isAdmin: boolean;
}

export default function UserInfo({ titleKey, user, isCurrentUser, isAdmin }: UserInfoProps) {
  const t = useTranslations('ProjectDetails');

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">
        {t(titleKey)}
        {isCurrentUser && <span className="text-green-500 pl-2">({t('you')})</span>}
      </h2>
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
        <InfoField label={t('name')} value={user.name} />
        {(isCurrentUser || isAdmin) && <InfoField label={t('email')} value={user.email} />}
      </div>
    </div>
  );
}
