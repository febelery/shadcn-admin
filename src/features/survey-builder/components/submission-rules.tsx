import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useSchemaStore } from '@/features/survey-builder/state'

/**
 * 子组件：各个具体的规则编辑逻辑
 */

function DailyLimitEditor({ rules, update }: any) {
  return (
    <div className='mt-2 space-y-2'>
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground w-14 shrink-0 text-[11px]'>
          每日上限
        </span>
        <Input
          type='number'
          min={1}
          value={rules.dailyLimit.limit}
          onChange={(e) => update('dailyLimit', { limit: +e.target.value })}
          className='h-7 w-14 font-mono text-xs'
        />
        <span className='text-muted-foreground text-[11px]'>次 / 天</span>
      </div>
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground w-14 shrink-0 text-[11px]'>
          识别方式
        </span>
        <Select
          value={rules.dailyLimit.identifyBy}
          onValueChange={(v) => update('dailyLimit', { identifyBy: v })}
        >
          <SelectTrigger className='h-7 flex-1 text-xs'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ip'>IP 地址</SelectItem>
            <SelectItem value='device'>设备指纹</SelectItem>
            <SelectItem value='account'>登录账号</SelectItem>
            <SelectItem value='ip_device'>IP + 设备</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function QuotaEditor({ rules, update }: any) {
  return (
    <div className='mt-2 space-y-2'>
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground w-14 shrink-0 text-[11px]'>
          总上限
        </span>
        <Input
          type='number'
          min={1}
          value={rules.quota.total}
          onChange={(e) => update('quota', { total: +e.target.value })}
          className='h-7 w-20 font-mono text-xs'
        />
        <span className='text-muted-foreground text-[11px]'>次（总量）</span>
      </div>
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground w-14 shrink-0 text-[11px]'>
          超额后
        </span>
        <Select
          value={rules.quota.onExceed}
          onValueChange={(v) => update('quota', { onExceed: v })}
        >
          <SelectTrigger className='h-7 flex-1 text-xs'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='close'>关闭问卷</SelectItem>
            <SelectItem value='show_message'>显示提示</SelectItem>
            <SelectItem value='redirect'>跳转链接</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function TimeWindowEditor({ rules, update }: any) {
  return (
    <div className='mt-2 space-y-2'>
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground w-10 shrink-0 text-[11px]'>
          开始
        </span>
        <Input
          type='datetime-local'
          value={rules.timeWindow.startAt ?? ''}
          onChange={(e) => update('timeWindow', { startAt: e.target.value })}
          className='h-7 flex-1 text-xs'
        />
      </div>
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground w-10 shrink-0 text-[11px]'>
          结束
        </span>
        <Input
          type='datetime-local'
          value={rules.timeWindow.endAt ?? ''}
          onChange={(e) => update('timeWindow', { endAt: e.target.value })}
          className='h-7 flex-1 text-xs'
        />
      </div>
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground w-10 shrink-0 text-[11px]'>
          超时后
        </span>
        <Select
          value={rules.timeWindow.onExpire}
          onValueChange={(v) => update('timeWindow', { onExpire: v })}
        >
          <SelectTrigger className='h-7 flex-1 text-xs'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='show_closed'>显示已关闭</SelectItem>
            <SelectItem value='redirect'>跳转链接</SelectItem>
            <SelectItem value='hide'>隐藏问卷</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function IpDedupEditor({ rules, update }: any) {
  return (
    <div className='mt-2 space-y-2'>
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground w-10 shrink-0 text-[11px]'>
          每 IP
        </span>
        <Input
          type='number'
          min={1}
          value={rules.ipDedup.limit}
          onChange={(e) => update('ipDedup', { limit: +e.target.value })}
          className='h-7 w-14 font-mono text-xs'
        />
        <span className='text-muted-foreground text-[11px]'>次（总）</span>
      </div>
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground w-10 shrink-0 text-[11px]'>
          超额后
        </span>
        <Select
          value={rules.ipDedup.onExceed}
          onValueChange={(v) => update('ipDedup', { onExceed: v })}
        >
          <SelectTrigger className='h-7 flex-1 text-xs'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='reject'>拒绝提交</SelectItem>
            <SelectItem value='show_message'>显示提示</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function LoginEditor({ rules, update }: any) {
  return (
    <div className='mt-2 space-y-2'>
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground w-16 shrink-0 text-[11px]'>
          登录方式
        </span>
        <Select
          value={rules.login.method}
          onValueChange={(v) => update('login', { method: v })}
        >
          <SelectTrigger className='h-7 flex-1 text-xs'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='system'>系统账号</SelectItem>
            <SelectItem value='sso'>SSO 单点登录</SelectItem>
            <SelectItem value='phone'>手机号验证码</SelectItem>
            <SelectItem value='email'>邮箱验证码</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className='flex items-center justify-between'>
        <span className='text-foreground text-xs'>同一账号仅能提交一次</span>
        <Switch
          checked={rules.login.oncePerAccount}
          onCheckedChange={(v) => update('login', { oncePerAccount: v })}
          className='scale-[0.8]'
        />
      </div>
    </div>
  )
}

/**
 * 规则配置数据定义
 */
const RULE_CONFIGS = [
  { key: 'dailyLimit', title: '每日提交次数', component: DailyLimitEditor },
  { key: 'quota', title: '总量配额', component: QuotaEditor },
  { key: 'timeWindow', title: '开放时间窗口', component: TimeWindowEditor },
  { key: 'ipDedup', title: 'IP 去重', component: IpDedupEditor },
  { key: 'login', title: '需要登录', component: LoginEditor },
]

export function SubmissionRules() {
  const meta = useSchemaStore((s) => s.meta)
  const updateMeta = useSchemaStore((s) => s.updateMeta)
  const rules = meta.submissionRules

  const updateRule = (key: string, patch: Record<string, unknown>) => {
    updateMeta({
      submissionRules: {
        ...rules,
        [key]: { ...(rules as any)[key], ...patch },
      },
    })
  }

  return (
    <div className='space-y-2'>
      {RULE_CONFIGS.map(({ key, title, component: Editor }) => {
        const enabled = (rules as any)[key].enabled
        return (
          <div
            key={key}
            className={`overflow-hidden rounded-md border transition-colors ${enabled ? 'border-border' : 'border-border/50'}`}
          >
            <div className='flex items-center gap-2 px-2.5 py-2'>
              <Switch
                checked={enabled}
                onCheckedChange={(v) => updateRule(key, { enabled: v })}
                className='scale-[0.75]'
              />
              <span className='flex-1 text-xs font-medium'>{title}</span>
              <span className='text-muted-foreground font-mono text-[10px]'>
                {enabled ? '已启用' : '未启用'}
              </span>
            </div>
            {enabled && (
              <div className='border-border/50 border-t px-2.5 pb-2.5'>
                <Editor rules={rules} update={updateRule} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
