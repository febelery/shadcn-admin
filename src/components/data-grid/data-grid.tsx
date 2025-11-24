import * as React from 'react'
import { flexRender } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { getCommonPinningStyles } from '@/lib/data-table'
import { cn } from '@/lib/utils'
import type { useDataGrid } from '@/hooks/use-data-grid'
import { DataGridColumnHeader } from '@/components/data-grid/data-grid-column-header'
import { DataGridContextMenu } from '@/components/data-grid/data-grid-context-menu'
import { DataGridPasteDialog } from '@/components/data-grid/data-grid-paste-dialog'
import { DataGridRow } from '@/components/data-grid/data-grid-row'
import { DataGridSearch } from '@/components/data-grid/data-grid-search'

interface DataGridProps<TData>
  extends ReturnType<typeof useDataGrid<TData>>,
    React.ComponentProps<'div'> {
  height?: number
}

export function DataGrid<TData>({
  dataGridRef,
  headerRef,
  rowMapRef,
  footerRef,
  table,
  rowVirtualizer,
  height,
  searchState,
  columnSizeVars,
  onRowAdd,
  className,
  ...props
}: DataGridProps<TData>) {
  const rows = table.getRowModel().rows
  const columns = table.getAllColumns()

  const meta = table.options.meta
  const rowHeight = meta?.rowHeight ?? 'short'
  const focusedCell = meta?.focusedCell ?? null

  const onGridContextMenu = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
    },
    []
  )

  const onAddRowKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!onRowAdd) return

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onRowAdd()
      }
    },
    [onRowAdd]
  )

  // 当使用 flex 布局时，监听容器尺寸变化并触发虚拟滚动器重新测量
  React.useLayoutEffect(() => {
    if (height !== undefined) return // 如果提供了固定高度，不需要监听

    const gridElement = dataGridRef.current
    if (!gridElement) return

    // 使用 ResizeObserver 监听容器尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      // 延迟测量，确保布局已完成
      requestAnimationFrame(() => {
        rowVirtualizer.measure()
      })
    })

    resizeObserver.observe(gridElement)

    // 初始测量，使用双重 requestAnimationFrame 确保布局已完成
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        rowVirtualizer.measure()
      })
    })

    return () => {
      resizeObserver.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowVirtualizer, height])

  return (
    <div
      data-slot='grid-wrapper'
      className={cn('relative flex w-full flex-col', className)}
      {...props}
    >
      {searchState && <DataGridSearch {...searchState} />}
      <DataGridContextMenu table={table} />
      <DataGridPasteDialog table={table} />
      <div
        role='grid'
        aria-label='数据网格'
        aria-rowcount={rows.length + (onRowAdd ? 1 : 0)}
        aria-colcount={columns.length}
        data-slot='grid'
        tabIndex={0}
        ref={dataGridRef}
        className={cn(
          'relative grid overflow-auto rounded-md border select-none focus:outline-none',
          height === undefined && 'min-h-0 flex-1'
        )}
        style={{
          ...columnSizeVars,
          ...(height !== undefined && { maxHeight: `${height}px` }),
        }}
        onContextMenu={onGridContextMenu}
      >
        <div
          role='rowgroup'
          data-slot='grid-header'
          ref={headerRef}
          className='bg-background sticky top-0 z-10 grid border-b'
        >
          {table.getHeaderGroups().map((headerGroup, rowIndex) => (
            <div
              key={headerGroup.id}
              role='row'
              aria-rowindex={rowIndex + 1}
              data-slot='grid-header-row'
              tabIndex={-1}
              className='flex w-full'
            >
              {headerGroup.headers.map((header, colIndex) => {
                const sorting = table.getState().sorting
                const currentSort = sorting.find(
                  (sort) => sort.id === header.column.id
                )
                const isSortable = header.column.getCanSort()

                return (
                  <div
                    key={header.id}
                    role='columnheader'
                    aria-colindex={colIndex + 1}
                    aria-sort={
                      currentSort?.desc === false
                        ? 'ascending'
                        : currentSort?.desc === true
                          ? 'descending'
                          : isSortable
                            ? 'none'
                            : undefined
                    }
                    data-slot='grid-header-cell'
                    tabIndex={-1}
                    className={cn('relative', {
                      'border-r': header.column.id !== 'select',
                    })}
                    style={{
                      ...getCommonPinningStyles({ column: header.column }),
                      width: `calc(var(--header-${header.id}-size) * 1px)`,
                    }}
                  >
                    {header.isPlaceholder ? null : typeof header.column
                        .columnDef.header === 'function' ? (
                      <div className='size-full px-3 py-1.5'>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>
                    ) : (
                      <DataGridColumnHeader header={header} table={table} />
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div
          role='rowgroup'
          data-slot='grid-body'
          className='relative grid'
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {rowVirtualizer.getVirtualIndexes().map((virtualRowIndex) => {
            const row = rows[virtualRowIndex]
            if (!row) return null

            return (
              <DataGridRow
                key={row.id}
                row={row}
                rowMapRef={rowMapRef}
                virtualRowIndex={virtualRowIndex}
                rowVirtualizer={rowVirtualizer}
                rowHeight={rowHeight}
                focusedCell={focusedCell}
              />
            )
          })}
        </div>
        {onRowAdd && (
          <div
            role='rowgroup'
            data-slot='grid-footer'
            ref={footerRef}
            className='bg-background sticky bottom-0 z-10 grid border-t'
          >
            <div
              role='row'
              aria-rowindex={rows.length + 2}
              data-slot='grid-add-row'
              tabIndex={-1}
              className='flex w-full'
            >
              <div
                role='gridcell'
                tabIndex={0}
                className='bg-muted/30 hover:bg-muted/50 focus:bg-muted/50 relative flex h-9 grow items-center transition-colors focus:outline-none'
                style={{
                  width: table.getTotalSize(),
                  minWidth: table.getTotalSize(),
                }}
                onClick={onRowAdd}
                onKeyDown={onAddRowKeyDown}
              >
                <div className='text-muted-foreground sticky left-0 flex items-center gap-2 px-3'>
                  <Plus className='size-3.5' />
                  <span className='text-sm'>添加行</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
