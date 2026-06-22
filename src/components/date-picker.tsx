import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  addHours,
  endOfDay,
  endOfHour,
  endOfMinute,
  format,
  parse,
  setHours,
  setMilliseconds,
  setMinutes,
  setSeconds,
  startOfDay,
  startOfHour,
  startOfMinute,
  subHours,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  Calendar as CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  Clock,
  XCircle,
} from 'lucide-react'
import type { Matcher } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

const AM_VALUE = 0
const PM_VALUE = 1

/** 本地时间字符串：yyyy-MM-dd'T'HH:mm:ss */
export type LocalDateTimeString = string

const LOCAL_DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss"
const LOCAL_DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/

export function formatLocalDateTime(date: Date): LocalDateTimeString {
  return format(date, LOCAL_DATETIME_FORMAT)
}

export function parseLocalDateTime(
  value?: LocalDateTimeString
): Date | undefined {
  if (!value) return undefined
  const match = LOCAL_DATETIME_RE.exec(value)
  if (!match) return undefined
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
    0
  )
  return Number.isNaN(date.getTime()) ? undefined : date
}

export type DatePickerCalendarProps = Omit<
  React.ComponentProps<typeof Calendar>,
  'mode'
> & {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: Matcher | Matcher[]
}

/** 日历面板（供 DatePicker 复用） */
export function DatePickerCalendar({
  selected,
  onSelect,
  disabled,
  ...props
}: DatePickerCalendarProps) {
  return (
    <Calendar
      mode='single'
      locale={zhCN}
      captionLayout='dropdown'
      selected={selected}
      onSelect={onSelect}
      disabled={disabled}
      {...props}
    />
  )
}

type TimePickerUnit = 'hour' | 'minute' | 'second'

type TimePickerConfig = {
  hour?: boolean
  minute?: boolean
  second?: boolean
}

export type DatePickerRenderTriggerProps = {
  value: Date | undefined
  open: boolean
  disabled?: boolean
  use12HourFormat?: boolean
  setOpen: (open: boolean) => void
}

type DatePickerBaseProps = {
  value?: Date
  onChange: (value: Date | undefined) => void
  placeholder?: string
  min?: Date
  max?: Date
  /** 禁用整个选择器 */
  disabled?: boolean
  /** 日历不可选日期 */
  disabledDates?: Matcher | Matcher[]
  clearable?: boolean
  className?: string
  classNames?: { trigger?: string }
  modal?: boolean
}

type DateOnlyPickerProps = DatePickerBaseProps & {
  includeTime?: false
}

type DateTimePickerProps = DatePickerBaseProps & {
  includeTime: true
  use12HourFormat?: boolean
  timePicker?: TimePickerConfig
  renderTrigger?: (props: DatePickerRenderTriggerProps) => ReactNode
}

export type DatePickerProps = DateOnlyPickerProps | DateTimePickerProps

function isTimeUnitEnabled(
  timePicker: TimePickerConfig | undefined,
  unit: TimePickerUnit
) {
  return timePicker?.[unit] !== false
}

function mergeDateWithTime(
  day: Date,
  timeSource: Date,
  minDate?: Date,
  maxDate?: Date
): Date {
  const next = new Date(day)
  next.setHours(
    timeSource.getHours(),
    timeSource.getMinutes(),
    timeSource.getSeconds(),
    0
  )
  if (minDate && next < minDate) {
    next.setHours(
      minDate.getHours(),
      minDate.getMinutes(),
      minDate.getSeconds(),
      0
    )
  }
  if (maxDate && next > maxDate) {
    next.setHours(
      maxDate.getHours(),
      maxDate.getMinutes(),
      maxDate.getSeconds(),
      0
    )
  }
  return next
}

function buildCalendarDisabled(
  disabledDates: Matcher | Matcher[] | undefined,
  minDate?: Date,
  maxDate?: Date
) {
  const matchers: Matcher[] = []
  if (disabledDates) {
    matchers.push(
      ...(Array.isArray(disabledDates) ? disabledDates : [disabledDates])
    )
  }
  if (minDate) matchers.push({ before: minDate })
  if (maxDate) matchers.push({ after: maxDate })
  return matchers.length > 0 ? matchers : undefined
}

/** 日期 / 日期时间选择器（includeTime 控制是否含时间） */
export function DatePicker(props: DatePickerProps) {
  if (props.includeTime) {
    return <DateTimePickerPanel {...props} />
  }
  return <DateOnlyPickerPanel {...props} />
}

function DateOnlyPickerPanel({
  value,
  onChange,
  placeholder = '选择日期',
  disabled,
  disabledDates,
  className,
}: DateOnlyPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          disabled={disabled}
          data-empty={!value}
          className={
            className ??
            'data-[empty=true]:text-muted-foreground w-full justify-start text-start font-normal'
          }
        >
          {value ? (
            format(value, 'yyyy-MM-dd', { locale: zhCN })
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarIcon className='ms-auto size-4 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <DatePickerCalendar
          selected={value}
          onSelect={onChange}
          disabled={buildCalendarDisabled(disabledDates, undefined, undefined)}
        />
      </PopoverContent>
    </Popover>
  )
}

function DateTimePickerPanel({
  value,
  onChange,
  renderTrigger,
  min,
  max,
  placeholder = '选择日期时间',
  disabled,
  disabledDates,
  clearable,
  classNames,
  use12HourFormat,
  timePicker,
  modal = false,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const initDate = useMemo(() => value ?? new Date(), [value])
  const [date, setDate] = useState<Date>(initDate)

  const calendarDisabled = useMemo(
    () => buildCalendarDisabled(disabledDates, min, max),
    [disabledDates, min, max]
  )

  const onDaySelect = useCallback(
    (day: Date | undefined) => {
      if (!day) return
      setDate((prev) => mergeDateWithTime(day, prev, min, max))
    },
    [min, max]
  )

  const onSubmit = useCallback(() => {
    onChange(date)
    setOpen(false)
  }, [date, onChange])

  useEffect(() => {
    if (open) setDate(initDate)
  }, [open, initDate])

  const displayValue = useMemo(() => {
    if (!open && !value) return undefined
    return open ? date : initDate
  }, [date, value, open, initDate])

  const displayFormat = useMemo(() => {
    if (!displayValue) return placeholder
    return format(
      displayValue,
      use12HourFormat ? 'yyyy年M月d日 hh:mm a' : 'yyyy-MM-dd HH:mm',
      { locale: zhCN }
    )
  }, [displayValue, use12HourFormat, placeholder])

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger asChild>
        {renderTrigger ? (
          renderTrigger({
            value: displayValue,
            open,
            disabled,
            use12HourFormat,
            setOpen,
          })
        ) : (
          <div
            className={cn(
              'border-input flex h-9 w-full cursor-pointer items-center rounded-md border ps-3 pe-1 text-sm font-normal shadow-sm',
              !displayValue && 'text-muted-foreground',
              (!clearable || !value) && 'pe-3',
              disabled && 'cursor-not-allowed opacity-50',
              classNames?.trigger
            )}
            tabIndex={0}
          >
            <div className='flex grow items-center'>
              <CalendarIcon className='mr-2 size-4' />
              {displayFormat}
            </div>
            {clearable && value ? (
              <Button
                disabled={disabled}
                variant='ghost'
                size='sm'
                type='button'
                aria-label='清除'
                className='ms-1 size-6 p-1'
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onChange(undefined)
                  setOpen(false)
                }}
              >
                <XCircle className='size-4' />
              </Button>
            ) : null}
          </div>
        )}
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <DatePickerCalendar
          selected={date}
          onSelect={onDaySelect}
          disabled={calendarDisabled}
          defaultMonth={date}
        />
        <div className='flex flex-col gap-2 border-t p-3'>
          <TimePicker
            timePicker={timePicker}
            value={date}
            onChange={setDate}
            use12HourFormat={use12HourFormat}
            min={min}
            max={max}
          />
          <div className='flex justify-end'>
            <Button className='h-8 px-3' type='button' onClick={onSubmit}>
              确定
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface TimeOption {
  value: number
  label: string
  disabled: boolean
}

function TimePicker({
  value,
  onChange,
  use12HourFormat,
  min,
  max,
  timePicker,
}: {
  use12HourFormat?: boolean
  value: Date
  onChange: (date: Date) => void
  min?: Date
  max?: Date
  timePicker?: TimePickerConfig
}) {
  const formatStr = useMemo(
    () =>
      use12HourFormat
        ? 'yyyy-MM-dd hh:mm:ss.SSS a xxxx'
        : 'yyyy-MM-dd HH:mm:ss.SSS xxxx',
    [use12HourFormat]
  )
  const [ampm, setAmpm] = useState(
    format(value, 'a') === 'AM' ? AM_VALUE : PM_VALUE
  )
  const [hour, setHour] = useState(
    use12HourFormat ? +format(value, 'hh') : value.getHours()
  )
  const [minute, setMinute] = useState(value.getMinutes())
  const [second, setSecond] = useState(value.getSeconds())

  useEffect(() => {
    onChange(
      buildTime({
        use12HourFormat,
        value,
        formatStr,
        hour,
        minute,
        second,
        ampm,
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅随用户调整时分秒更新
  }, [hour, minute, second, ampm, formatStr, use12HourFormat])

  const hourIn24h = useMemo(
    () => (use12HourFormat ? (hour % 12) + ampm * 12 : hour),
    [hour, use12HourFormat, ampm]
  )

  const hours: TimeOption[] = useMemo(
    () =>
      Array.from({ length: use12HourFormat ? 12 : 24 }, (_, i) => {
        let disabled = false
        const hourValue = use12HourFormat ? (i === 0 ? 12 : i) : i
        const hDate = setHours(value, use12HourFormat ? i + ampm * 12 : i)
        const hStart = startOfHour(hDate)
        const hEnd = endOfHour(hDate)
        if (min && hEnd < min) disabled = true
        if (max && hStart > max) disabled = true
        return {
          value: hourValue,
          label: hourValue.toString().padStart(2, '0'),
          disabled,
        }
      }),
    [value, min, max, use12HourFormat, ampm]
  )

  const minutes: TimeOption[] = useMemo(() => {
    const anchorDate = setHours(value, hourIn24h)
    return Array.from({ length: 60 }, (_, i) => {
      let disabled = false
      const mDate = setMinutes(anchorDate, i)
      const mStart = startOfMinute(mDate)
      const mEnd = endOfMinute(mDate)
      if (min && mEnd < min) disabled = true
      if (max && mStart > max) disabled = true
      return {
        value: i,
        label: i.toString().padStart(2, '0'),
        disabled,
      }
    })
  }, [value, min, max, hourIn24h])

  const seconds: TimeOption[] = useMemo(() => {
    const anchorDate = setMilliseconds(
      setMinutes(setHours(value, hourIn24h), minute),
      0
    )
    const minBound = min ? setMilliseconds(min, 0) : undefined
    const maxBound = max ? setMilliseconds(max, 0) : undefined
    return Array.from({ length: 60 }, (_, i) => {
      let disabled = false
      const sDate = setSeconds(anchorDate, i)
      if (minBound && sDate < minBound) disabled = true
      if (maxBound && sDate > maxBound) disabled = true
      return {
        value: i,
        label: i.toString().padStart(2, '0'),
        disabled,
      }
    })
  }, [value, minute, min, max, hourIn24h])

  const ampmOptions = useMemo(() => {
    const startD = startOfDay(value)
    const endD = endOfDay(value)
    return [
      { value: AM_VALUE, label: '上午' },
      { value: PM_VALUE, label: '下午' },
    ].map((v) => {
      let disabled = false
      const start = addHours(startD, v.value * 12)
      const end = subHours(endD, (1 - v.value) * 12)
      if (min && end < min) disabled = true
      if (max && start > max) disabled = true
      return { ...v, disabled }
    })
  }, [value, min, max])

  const [timeOpen, setTimeOpen] = useState(false)
  const hourRef = useRef<HTMLDivElement>(null)
  const minuteRef = useRef<HTMLDivElement>(null)
  const secondRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!timeOpen) return
    const id = setTimeout(() => {
      hourRef.current?.scrollIntoView({ block: 'center' })
      minuteRef.current?.scrollIntoView({ block: 'center' })
      secondRef.current?.scrollIntoView({ block: 'center' })
    }, 1)
    return () => clearTimeout(id)
  }, [timeOpen])

  const display = useMemo(() => {
    const parts: string[] = []
    for (const element of ['hour', 'minute', 'second'] as const) {
      if (!isTimeUnitEnabled(timePicker, element)) continue
      parts.push(
        element === 'hour'
          ? use12HourFormat
            ? 'hh'
            : 'HH'
          : element === 'minute'
            ? 'mm'
            : 'ss'
      )
    }
    const pattern =
      parts.length > 0
        ? parts.join(':') + (use12HourFormat ? ' a' : '')
        : use12HourFormat
          ? 'hh:mm a'
          : 'HH:mm'
    return format(value, pattern, { locale: zhCN })
  }, [value, use12HourFormat, timePicker])

  return (
    <Popover open={timeOpen} onOpenChange={setTimeOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          className='w-full justify-between'
          aria-expanded={timeOpen}
        >
          <Clock className='mr-2 size-4' />
          {display}
          <ChevronDownIcon className='ml-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-2' side='top' align='start'>
        <div className='flex h-48 gap-1'>
          {isTimeUnitEnabled(timePicker, 'hour') ? (
            <ScrollArea className='h-48 w-14'>
              <div className='flex flex-col gap-0.5 pe-2 pb-32'>
                {hours.map((v) => (
                  <div
                    key={v.value}
                    ref={v.value === hour ? hourRef : undefined}
                  >
                    <TimeItem
                      option={v}
                      selected={v.value === hour}
                      onSelect={(opt) => setHour(opt.value)}
                      disabled={v.disabled}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : null}
          {isTimeUnitEnabled(timePicker, 'minute') ? (
            <ScrollArea className='h-48 w-14'>
              <div className='flex flex-col gap-0.5 pe-2 pb-32'>
                {minutes.map((v) => (
                  <div
                    key={v.value}
                    ref={v.value === minute ? minuteRef : undefined}
                  >
                    <TimeItem
                      option={v}
                      selected={v.value === minute}
                      onSelect={(opt) => setMinute(opt.value)}
                      disabled={v.disabled}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : null}
          {isTimeUnitEnabled(timePicker, 'second') ? (
            <ScrollArea className='h-48 w-14'>
              <div className='flex flex-col gap-0.5 pe-2 pb-32'>
                {seconds.map((v) => (
                  <div
                    key={v.value}
                    ref={v.value === second ? secondRef : undefined}
                  >
                    <TimeItem
                      option={v}
                      selected={v.value === second}
                      onSelect={(opt) => setSecond(opt.value)}
                      disabled={v.disabled}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : null}
          {use12HourFormat ? (
            <ScrollArea className='h-48 w-14'>
              <div className='flex flex-col gap-0.5'>
                {ampmOptions.map((v) => (
                  <TimeItem
                    key={v.value}
                    option={v}
                    selected={v.value === ampm}
                    onSelect={(opt) => setAmpm(opt.value)}
                    disabled={v.disabled}
                  />
                ))}
              </div>
            </ScrollArea>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function TimeItem({
  option,
  selected,
  onSelect,
  disabled,
}: {
  option: TimeOption
  selected: boolean
  onSelect: (option: TimeOption) => void
  disabled?: boolean
}) {
  return (
    <Button
      type='button'
      variant='ghost'
      size='sm'
      className='h-8 w-full justify-start px-2'
      onClick={() => onSelect(option)}
      disabled={disabled}
    >
      <span className='w-4'>
        {selected ? <CheckIcon className='size-4' /> : null}
      </span>
      <span className='ms-1 tabular-nums'>{option.label}</span>
    </Button>
  )
}

interface BuildTimeOptions {
  use12HourFormat?: boolean
  value: Date
  formatStr: string
  hour: number
  minute: number
  second: number
  ampm: number
}

function buildTime(options: BuildTimeOptions) {
  const { use12HourFormat, value, formatStr, hour, minute, second, ampm } =
    options
  if (use12HourFormat) {
    let dateStr = format(value, formatStr)
    dateStr =
      dateStr.slice(0, 11) +
      hour.toString().padStart(2, '0') +
      dateStr.slice(13)
    dateStr =
      dateStr.slice(0, 14) +
      minute.toString().padStart(2, '0') +
      dateStr.slice(16)
    dateStr =
      dateStr.slice(0, 17) +
      second.toString().padStart(2, '0') +
      dateStr.slice(19)
    dateStr =
      dateStr.slice(0, 24) +
      (ampm === AM_VALUE ? 'AM' : 'PM') +
      dateStr.slice(26)
    return parse(dateStr, formatStr, value)
  }
  return setHours(setMinutes(setSeconds(value, second), minute), hour)
}
