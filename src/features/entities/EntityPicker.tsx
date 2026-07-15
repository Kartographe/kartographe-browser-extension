import { Button, Divider, Select, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { EntityRef } from './hooks'

interface EntityPickerProps {
  placeholder: string
  items: EntityRef[]
  loading?: boolean
  creating?: boolean
  value: EntityRef | null
  search: string
  onSearch: (q: string) => void
  onSelect: (ref: EntityRef | null) => void
  onCreate: (title: string) => void
}

/**
 * Searchable entity selector with an inline "create" action.
 * Server-side text search is not available, so filtering is client-side and the
 * create button appears whenever the search text has no exact title match.
 */
export function EntityPicker({
  placeholder,
  items,
  loading,
  creating,
  value,
  search,
  onSearch,
  onSelect,
  onCreate,
}: EntityPickerProps) {
  const trimmed = search.trim()
  const exactMatch = items.some(
    (i) => i.title.toLowerCase() === trimmed.toLowerCase(),
  )
  const canCreate = trimmed.length > 0 && !exactMatch

  return (
    <Select
      showSearch
      allowClear
      style={{ width: '100%' }}
      placeholder={placeholder}
      loading={loading}
      value={value?.id ?? undefined}
      searchValue={search}
      // Filtering is done by the query; keep every returned option visible.
      filterOption={false}
      onSearch={onSearch}
      onClear={() => onSelect(null)}
      onChange={(id?: string) => {
        if (!id) return onSelect(null)
        const ref = items.find((i) => i.id === id) ?? null
        onSelect(ref)
      }}
      options={items.map((i) => ({ value: i.id, label: i.title }))}
      popupRender={(menu) => (
        <>
          {menu}
          {canCreate ? (
            <>
              <Divider style={{ margin: '4px 0' }} />
              <Space style={{ padding: '0 8px 4px' }}>
                <Button
                  type="link"
                  size="small"
                  icon={<PlusOutlined />}
                  loading={creating}
                  onClick={() => onCreate(trimmed)}
                >
                  Create “{trimmed}”
                </Button>
              </Space>
            </>
          ) : null}
        </>
      )}
    />
  )
}
