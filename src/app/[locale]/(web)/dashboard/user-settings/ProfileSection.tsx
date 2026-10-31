import { SectionCard } from '@/components/ui/SectionCard';
import type { ValidationDict } from '@/lib/validation';
import { getMessages, getTranslations } from 'next-intl/server';
import { ProfileAvatarSettings } from './ProfileAvatarSettings';
import { ProfileFormClient } from './ProfileFormClient';

export async function ProfileSection() {
  const [avatarT, pageT, allMessages] = await Promise.all([
    getTranslations('dashboard.userSettings.avatar'),
    getTranslations('dashboard.userSettings.page'),
    getMessages(),
  ]);

  const avatarMessages = {
    fallbackName: pageT('fallbackName'),
    fallbackEmail: pageT('fallbackEmail'),
    title: avatarT('title'),
    description: avatarT('description'),
    changeAria: avatarT('changeAria'),
    uploadAria: avatarT('uploadAria'),
    save: avatarT('save'),
    saving: avatarT('saving'),
    cancel: avatarT('cancel'),
    change: avatarT('change'),
    upload: avatarT('upload'),
    remove: avatarT('remove'),
    limit: avatarT('limit'),
    previewTitle: avatarT('previewTitle'),
    visibility: avatarT('visibility'),
    saved: avatarT('saved'),
    removed: avatarT('removed'),
    errors: {
      unsupportedType: avatarT('errors.unsupportedType'),
      fileTooLarge: avatarT('errors.fileTooLarge'),
      uploadFailed: avatarT('errors.uploadFailed'),
      removeFailed: avatarT('errors.removeFailed'),
    },
  };

  const profileT = allMessages.dashboard.userSettings.profile;
  const profileMessages = {
    fields: {
      bio: profileT.fields.bio,
      interests: profileT.fields.interests,
    },
    actions: profileT.actions,
    successMessage: profileT.successMessage,
    errors: profileT.errors,
  };
  const validation = allMessages.Validation as ValidationDict;

  return (
    <>
      <ProfileAvatarSettings messages={avatarMessages} />

      <SectionCard title={profileT.title} description={profileT.description}>
        <ProfileFormClient messages={profileMessages} validation={validation} />
      </SectionCard>
    </>
  );
}
