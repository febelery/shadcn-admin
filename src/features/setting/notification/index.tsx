import { ContentSection } from '../components/content-section'
import { NotificationForm } from './notification-form'

export function SettingNotification() {
  return (
    <ContentSection
      title='Notification'
      desc='Configure how you receive notifications.'
    >
      <NotificationForm />
    </ContentSection>
  )
}
