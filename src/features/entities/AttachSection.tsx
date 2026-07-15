import { useEffect, useState } from 'react'
import { App, Space, Typography } from 'antd'
import { EntityPicker } from './EntityPicker'
import {
  useApplications,
  useCreateApplication,
  useCreateService,
  useServices,
  type EntityRef,
} from './hooks'
import type { CaptureLinks } from '@/features/capture/push'

const { Text } = Typography

interface AttachSectionProps {
  /** Page URL used to prefill a newly created service. */
  pageUrl: string
  onChange: (links: CaptureLinks) => void
}

/** Optional association of the capture with an application and/or service. */
export function AttachSection({ pageUrl, onChange }: AttachSectionProps) {
  const { message } = App.useApp()

  const [appSearch, setAppSearch] = useState('')
  const [app, setApp] = useState<EntityRef | null>(null)
  const [svcSearch, setSvcSearch] = useState('')
  const [svc, setSvc] = useState<EntityRef | null>(null)

  const applications = useApplications(appSearch)
  const services = useServices(svcSearch)
  const createApp = useCreateApplication()
  const createSvc = useCreateService()

  useEffect(() => {
    onChange({
      applicationId: app?.id,
      applicationTitle: app?.title,
      serviceId: svc?.id,
      serviceTitle: svc?.title,
    })
  }, [app, svc, onChange])

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Attach to (optional)
      </Text>

      <EntityPicker
        placeholder="Application…"
        items={applications.data ?? []}
        loading={applications.isLoading}
        creating={createApp.isPending}
        value={app}
        search={appSearch}
        onSearch={setAppSearch}
        onSelect={setApp}
        onCreate={(title) =>
          createApp.mutate(title, {
            onSuccess: (ref) => {
              setApp(ref)
              setAppSearch('')
              message.success(`Application “${ref.title}” created`)
            },
            onError: (e) => message.error((e as Error).message),
          })
        }
      />

      <EntityPicker
        placeholder="Service…"
        items={services.data ?? []}
        loading={services.isLoading}
        creating={createSvc.isPending}
        value={svc}
        search={svcSearch}
        onSearch={setSvcSearch}
        onSelect={setSvc}
        onCreate={(title) =>
          createSvc.mutate(
            { title, url: pageUrl },
            {
              onSuccess: (ref) => {
                setSvc(ref)
                setSvcSearch('')
                message.success(`Service “${ref.title}” created`)
              },
              onError: (e) => message.error((e as Error).message),
            },
          )
        }
      />
    </Space>
  )
}
