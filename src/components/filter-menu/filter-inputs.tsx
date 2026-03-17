import * as React from 'react'
import type { FilterOperator } from '@/types/data-grid'
import { CalendarIcon, Check } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { useDebouncedCallback } from '@/hooks/use-debounced-callback'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useFilterContext, TEXT, type FilterConfig } from './index'

export function FilterInput({
  filterId,
  variant,
  operator,
  value,
  onChange,
  placeholder = TEXT.VALUE_PLACEHOLDER,
}: {
  filterId: string
  variant: string
  operator: FilterOperator
  value: unknown
  onChange: (val: unknown) => void
  placeholder?: string
}) {
  const { table, filterOptionsMap } = useFilterContext()

  const selectOptions = React.useMemo(() => {
    const override = filterOptionsMap.get(filterId)
    if (override?.length) return override
    const colMeta = table.getColumn(filterId)?.columnDef.meta?.cell
    return colMeta?.variant === 'select' || colMeta?.variant === 'multi-select'
      ? (colMeta.options ?? [])
      : []
  }, [filterId, filterOptionsMap, table])

  if (variant === 'number')
    return (
      <NumberFilterInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    )
  if (variant === 'date')
    return (
      <DateFilterInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    )

  if (
    (variant === 'select' || variant === 'multi-select') &&
    selectOptions.length > 0
  ) {
    const isMulti = operator === 'isAnyOf' || operator === 'isNoneOf'
    return isMulti ? (
      <MultiSelectFilterInput
        value={value}
        options={selectOptions}
        onChange={onChange}
        placeholder={placeholder}
      />
    ) : (
      <SingleSelectFilterInput
        value={value}
        options={selectOptions}
        onChange={onChange}
        placeholder={placeholder}
      />
    )
  }

  return (
    <TextFilterInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  )
}

function NumberFilterInput({ value, onChange, placeholder }: any) {
  const [local, setLocal] = React.useState(value)
  React.useEffect(() => {
    setLocal(value)
  }, [value])
  const debounced = useDebouncedCallback(onChange, 300)

  return (
    <Input
      type='number'
      inputMode='numeric'
      placeholder={placeholder}
      value={(local as number | undefined) ?? ''}
      onChange={(e) => {
        const val = e.target.value === '' ? undefined : Number(e.target.value)
        setLocal(val)
        debounced(val)
      }}
      className='h-8 rounded-md text-xs'
    />
  )
}

function TextFilterInput({ value, onChange, placeholder }: any) {
  const [local, setLocal] = React.useState(value)
  React.useEffect(() => {
    setLocal(value)
  }, [value])
  const debounced = useDebouncedCallback(onChange, 300)

  return (
    <Input
      type='text'
      placeholder={placeholder}
      className='h-8 rounded-md text-xs'
      value={(local as string | undefined) ?? ''}
      onChange={(e) => {
        const val = e.target.value === '' ? undefined : e.target.value
        setLocal(val)
        debounced(val)
      }}
    />
  )
}

function DateFilterInput({ value, onChange, placeholder }: any) {
  const [open, setOpen] = React.useState(false)
  const dateObj = typeof value === 'string' ? new Date(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className={cn(
            'h-8 w-full justify-start gap-1.5 rounded-md px-2.5 text-xs font-normal',
            !dateObj && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className='h-3.5 w-3.5' />
          <span className='truncate'>
            {dateObj ? formatDate(dateObj) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-auto p-0'>
        <Calendar
          autoFocus
          captionLayout='dropdown'
          mode='single'
          selected={dateObj}
          onSelect={(date) => {
            onChange(date?.toISOString())
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

function SingleSelectFilterInput({
  value,
  options,
  onChange,
  placeholder,
}: any) {
  const [open, setOpen] = React.useState(false)
  const selected = options.find((o: any) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='h-8 w-full justify-start gap-1.5 rounded-md px-2.5 text-xs font-normal'
        >
          {selected ? (
            <>
              {selected.icon && <selected.icon className='h-3.5 w-3.5' />}
              <span className='truncate'>{selected.label}</span>
            </>
          ) : (
            <span className='text-muted-foreground'>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-52 p-0'>
        <OptionCommand
          options={options}
          onSelect={(val) => {
            onChange(val)
            setOpen(false)
          }}
          isSelected={(val) => value === val}
        />
      </PopoverContent>
    </Popover>
  )
}

function MultiSelectFilterInput({
  value,
  options,
  onChange,
  placeholder,
}: any) {
  const [open, setOpen] = React.useState(false)
  const selectedArr = Array.isArray(value) ? (value as string[]) : []
  const displayOpts = options.filter((o: any) => selectedArr.includes(o.value))

  const toggle = (val: string) => {
    const next = selectedArr.includes(val)
      ? selectedArr.filter((v) => v !== val)
      : [...selectedArr, val]
    onChange(next.length > 0 ? next : undefined)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='h-8 w-full justify-start gap-1.5 rounded-md px-2.5 text-xs font-normal'
        >
          {displayOpts.length === 0 ? (
            <span className='text-muted-foreground'>{placeholder}</span>
          ) : (
            <>
              <StackedIcons opts={displayOpts} />
              <span className='truncate'>
                {displayOpts.length > 1
                  ? `${displayOpts.length} 项已选`
                  : displayOpts[0]?.label}
              </span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-52 p-0'>
        <OptionCommand
          options={options}
          onSelect={toggle}
          isSelected={(val) => selectedArr.includes(val)}
          multiSelect
        />
      </PopoverContent>
    </Popover>
  )
}

function OptionCommand({
  options,
  onSelect,
  isSelected,
  multiSelect = false,
}: {
  options: NonNullable<FilterConfig['options']>
  onSelect: (val: string) => void
  isSelected: (val: string) => boolean
  multiSelect?: boolean
}) {
  return (
    <Command>
      <CommandInput placeholder={TEXT.SEARCH_OPTION} className='h-8 text-xs' />
      <CommandList>
        <CommandEmpty className='text-muted-foreground py-4 text-center text-xs'>
          {TEXT.NO_OPTION_FOUND}
        </CommandEmpty>
        <CommandGroup>
          {options.map((opt) => (
            <CommandItem
              key={opt.value}
              value={opt.value}
              className='text-xs'
              onSelect={() => onSelect(opt.value)}
            >
              {opt.icon && <opt.icon className='mr-1.5 h-3.5 w-3.5' />}
              <span className='truncate'>{opt.label}</span>
              {opt.count !== undefined && (
                <span className='text-muted-foreground ml-auto font-mono text-[10px]'>
                  {opt.count}
                </span>
              )}
              {multiSelect && (
                <Check
                  className={cn(
                    'ml-1.5 h-3.5 w-3.5',
                    isSelected(opt.value) ? 'opacity-100' : 'opacity-0'
                  )}
                />
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

function StackedIcons({
  opts,
}: {
  opts: NonNullable<FilterConfig['options']>
}) {
  const withIcons = opts.filter((o) => o.icon).slice(0, 3)
  if (withIcons.length === 0) return null
  return (
    <div className='flex items-center'>
      {withIcons.map((opt, i) => {
        const Icon = opt.icon!
        return (
          <div
            key={opt.value}
            className='bg-background rounded-full border p-0.5'
            style={{ marginLeft: i > 0 ? '-4px' : 0 }}
          >
            <Icon className='size-3' />
          </div>
        )
      })}
    </div>
  )
}
