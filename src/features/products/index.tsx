'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { getFilterFn } from '@/lib/data-grid-filters'
import { useDataGrid } from '@/hooks/use-data-grid'
import { useWindowSize } from '@/hooks/use-window-size'
import { Skeleton } from '@/components/ui/skeleton'
import { ColumnVisibility } from '@/components/column-visibility'
import { DataGrid } from '@/components/data-grid/data-grid'
import { DataGridFilterMenu } from '@/components/data-grid/data-grid-filter-menu'
import { DataGridRowHeightMenu } from '@/components/data-grid/data-grid-row-height-menu'
import { DataGridSortMenu } from '@/components/data-grid/data-grid-sort-menu'
import { PageLayout } from '@/components/layout/page-layout'
import { getProducts, createProduct, deleteProducts } from './api'
import type { Product } from './data/schema'

export function Products() {
  const { data } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })

  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    if (data?.data) {
      setProducts(data.data)
      setIsLoading(false)
    }
  }, [data])

  const filterFn = React.useMemo(() => getFilterFn<Product>(), [])

  const columns = React.useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: '产品名称',
        filterFn,
        meta: {
          label: '产品名称',
          cell: {
            variant: 'short-text',
          },
        },
        minSize: 200,
      },
      {
        id: 'description',
        accessorKey: 'description',
        header: '描述',
        filterFn,
        meta: {
          label: '描述',
          cell: {
            variant: 'long-text',
          },
        },
        minSize: 250,
      },
      {
        id: 'category',
        accessorKey: 'category',
        header: '分类',
        filterFn,
        meta: {
          label: '分类',
          cell: {
            variant: 'select',
            options: [
              { label: '电子产品', value: 'electronics' },
              { label: '服装', value: 'clothing' },
              { label: '食品', value: 'food' },
              { label: '图书', value: 'books' },
              { label: '玩具', value: 'toys' },
              { label: '家具', value: 'furniture' },
            ],
          },
        },
        minSize: 120,
      },
      {
        id: 'brand',
        accessorKey: 'brand',
        header: '品牌',
        filterFn,
        meta: {
          label: '品牌',
          cell: {
            variant: 'short-text',
          },
        },
        minSize: 120,
      },
      {
        id: 'price',
        accessorKey: 'price',
        header: '价格',
        filterFn,
        meta: {
          label: '价格',
          cell: {
            variant: 'number',
            min: 0,
            max: 10000,
            step: 0.01,
          },
        },
        minSize: 100,
      },
      {
        id: 'stock',
        accessorKey: 'stock',
        header: '库存',
        filterFn,
        meta: {
          label: '库存',
          cell: {
            variant: 'number',
            min: 0,
            max: 10000,
          },
        },
        minSize: 100,
      },
      {
        id: 'inStock',
        accessorKey: 'inStock',
        header: '有货',
        filterFn,
        meta: {
          label: '有货',
          cell: {
            variant: 'checkbox',
          },
        },
        minSize: 80,
      },
      {
        id: 'tags',
        accessorKey: 'tags',
        header: '标签',
        filterFn,
        meta: {
          label: '标签',
          cell: {
            variant: 'multi-select',
            options: [
              { label: '新品', value: '新品' },
              { label: '热销', value: '热销' },
              { label: '推荐', value: '推荐' },
              { label: '限时', value: '限时' },
              { label: '特价', value: '特价' },
              { label: '环保', value: '环保' },
              { label: '优质', value: '优质' },
              { label: '经典', value: '经典' },
            ],
          },
        },
        minSize: 200,
      },
      {
        id: 'rating',
        accessorKey: 'rating',
        header: '评分',
        filterFn,
        meta: {
          label: '评分',
          cell: {
            variant: 'number',
            min: 1,
            max: 5,
            step: 0.1,
          },
        },
        minSize: 100,
      },
      {
        id: 'releaseDate',
        accessorKey: 'releaseDate',
        header: '发布日期',
        filterFn,
        meta: {
          label: '发布日期',
          cell: {
            variant: 'date',
          },
        },
        minSize: 130,
      },
      {
        id: 'imageUrl',
        accessorKey: 'imageUrl',
        header: '图片链接',
        filterFn,
        meta: {
          label: '图片链接',
          cell: {
            variant: 'url',
          },
        },
        minSize: 200,
      },
    ],
    [filterFn]
  )

  const queryClient = useQueryClient()

  useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const { mutateAsync: deleteProductsAsync } = useMutation({
    mutationFn: deleteProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const onRowsDelete = React.useCallback(
    async (rows: Product[]) => {
      // 先更新本地状态
      setProducts((prev) => prev.filter((row) => !rows.includes(row)))

      // 通过接口删除
      try {
        const ids = rows.map((row) => row.id)
        await deleteProductsAsync(ids)
      } catch (error) {
        // 如果删除失败，恢复本地状态
        setProducts((prev) => [...prev, ...rows])
        console.error('Failed to delete products:', error)
      }
    },
    [deleteProductsAsync]
  )

  const { table, ...dataGridProps } = useDataGrid({
    columns,
    data: products,
    onDataChange: setProducts,
    onRowsDelete,
    getRowId: (row) => row.id,
    enableSearch: true,
    readOnly: true,
  })

  const windowSize = useWindowSize({ defaultHeight: 760 })
  const height = Math.max(400, windowSize.height - 150)

  return (
    <PageLayout
      title='产品管理'
      description='管理和编辑产品信息'
      mainFixed
      mainClassName='flex flex-col gap-4 sm:gap-6'
    >
      {isLoading ? (
        <div className='flex min-h-0 flex-1 flex-col gap-4 rounded-md border p-4'>
          <div className='flex flex-1 flex-col gap-3'>
            {Array.from({ length: 26 }).map((_, rowIndex) => (
              <div key={rowIndex} className='flex gap-4'>
                {Array.from({ length: 6 }).map((_, colIndex) => (
                  <Skeleton key={colIndex} className='h-8 flex-1' />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div
            role='toolbar'
            aria-orientation='horizontal'
            className='flex items-center gap-2 self-end'
          >
            <DataGridFilterMenu table={table} align='end' />
            <DataGridSortMenu table={table} align='end' />
            <DataGridRowHeightMenu table={table} align='end' />
            <ColumnVisibility table={table} align='end' />
          </div>
          <div className='flex min-h-0 flex-1'>
            <DataGrid {...dataGridProps} table={table} height={height} />
          </div>
        </>
      )}
    </PageLayout>
  )
}
