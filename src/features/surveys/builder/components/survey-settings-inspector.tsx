import { builderSettingsRoot } from '../ui'
import { SurveyEndPagePanel } from './survey-settings/survey-end-page-panel'
import { SurveyMetaCoverPanel } from './survey-settings/survey-meta-cover-panel'
import { SurveyPublishInfoCard } from './survey-settings/survey-publish-info-card'
import { SurveySubmissionPanel } from './survey-settings/survey-submission-panel'
import { SurveyThemePanel } from './survey-settings/survey-theme-panel'
import { SurveyTimeWindowPanel } from './survey-settings/survey-time-window-panel'

/** 问卷级设置 — 组合各设置面板 */
export function SurveySettingsInspector() {
  return (
    <div className={builderSettingsRoot}>
      <SurveyTimeWindowPanel />
      <SurveyMetaCoverPanel />
      <SurveyEndPagePanel />
      <SurveySubmissionPanel />
      <SurveyThemePanel />
      <SurveyPublishInfoCard />
    </div>
  )
}
