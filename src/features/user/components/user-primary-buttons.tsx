import { MailPlus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from './user-provider'

export function UserPrimaryButtons() {
  const { setOpen } = useUser()
  return (
    <div className='flex gap-2'>
      <Button
        variant='outline'
        className='space-x-1'
        onClick={() => setOpen('invite')}
      >
        <span>邀请用户</span> <MailPlus size={18} />
      </Button>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>添加用户</span> <UserPlus size={18} />
      </Button>
    </div>
  )
}
