import { useCallback, useState } from 'react'
import {
  Alert,
  App as AntApp,
  Button,
  Flex,
  Image,
  Input,
  Segmented,
  Space,
  Spin,
  Typography,
} from 'antd'
import { useTranslation } from 'react-i18next'
import { useConfig } from '@/lib/storage/hooks'
import { useSession } from '@/features/auth/hooks'
import { useCaptureTab, usePushCapture } from '@/features/capture/hooks'
import type { PageCapture } from '@/features/capture/types'
import type { CaptureLinks } from '@/features/capture/push'
import { AttachSection } from '@/features/entities/AttachSection'
import { JourneyView } from '@/features/journey/JourneyView'

const { Text, Link } = Typography

const logoUrl = chrome.runtime.getURL('icons/logo-horizontal.svg')

function openOptions() {
  chrome.runtime.openOptionsPage()
}

function NotReady({ reason }: { reason: string }) {
  const { t } = useTranslation()
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text>{reason}</Text>
      <Button type="primary" onClick={openOptions}>
        {t('common.openSettings')}
      </Button>
    </Space>
  )
}

function CaptureView() {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()
  const capture = useCaptureTab()
  const push = usePushCapture()
  const [shot, setShot] = useState<PageCapture | null>(null)
  const [note, setNote] = useState('')
  const [links, setLinks] = useState<CaptureLinks>({})
  const onLinksChange = useCallback((next: CaptureLinks) => setLinks(next), [])

  const reset = () => {
    setShot(null)
    setNote('')
    setLinks({})
  }

  if (!shot) {
    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Text type="secondary">{t('capture.intro')}</Text>
        {capture.error ? (
          <Alert type="error" showIcon message={(capture.error as Error).message} />
        ) : null}
        <Button
          type="primary"
          block
          loading={capture.isPending}
          onClick={() =>
            capture.mutate(undefined, {
              onSuccess: setShot,
              onError: (e) => message.error((e as Error).message),
            })
          }
        >
          {t('capture.capturePage')}
        </Button>
      </Space>
    )
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Image
        src={shot.screenshotDataUrl}
        alt="capture preview"
        style={{ borderRadius: 6, border: '1px solid #eee' }}
      />
      <Space direction="vertical" size={0} style={{ width: '100%' }}>
        <Text strong ellipsis>
          {shot.title}
        </Text>
        <Text type="secondary" ellipsis>
          {shot.url}
        </Text>
      </Space>

      <Input.TextArea
        placeholder={t('capture.annotationPlaceholder')}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        autoSize={{ minRows: 2, maxRows: 4 }}
      />

      <AttachSection pageUrl={shot.url} onChange={onLinksChange} />

      <Space style={{ width: '100%' }} styles={{ item: { flex: 1 } }}>
        <Button block onClick={reset} disabled={push.isPending}>
          {t('capture.retake')}
        </Button>
        <Button
          type="primary"
          block
          loading={push.isPending}
          onClick={() =>
            push.mutate(
              {
                capture: shot,
                options: { note: note || undefined, links },
              },
              {
                onSuccess: () => {
                  message.success(t('capture.sent'))
                  reset()
                },
                onError: (e) => message.error((e as Error).message),
              },
            )
          }
        >
          {t('capture.send')}
        </Button>
      </Space>
    </Space>
  )
}

export function App() {
  const { t } = useTranslation()
  const config = useConfig()
  const session = useSession()

  const loading = config.isLoading || session.isLoading

  return (
    <Flex vertical gap={16} style={{ padding: 16 }}>
      <Flex align="center" justify="space-between">
        <Flex align="center" gap={8}>
          <img src={logoUrl} alt="Kartographe" height={22} />
          <Text strong style={{ fontSize: 13 }}>
            Trail
          </Text>
        </Flex>
        <Link onClick={openOptions} style={{ fontSize: 12 }}>
          {t('common.settings')}
        </Link>
      </Flex>

      {loading ? (
        <Flex justify="center" style={{ padding: 24 }}>
          <Spin />
        </Flex>
      ) : !config.data?.serverUrl ? (
        <NotReady reason={t('ready.server')} />
      ) : session.data !== true ? (
        <NotReady reason={t('ready.signIn')} />
      ) : !config.data.accountId ? (
        <NotReady reason={t('ready.account')} />
      ) : (
        <Ready />
      )}
    </Flex>
  )
}

function Ready() {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'single' | 'journey'>('single')
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Segmented
        block
        value={mode}
        onChange={(value) => setMode(value as 'single' | 'journey')}
        options={[
          { label: t('ready.modeSingle'), value: 'single' },
          { label: t('ready.modeJourney'), value: 'journey' },
        ]}
      />
      {mode === 'single' ? <CaptureView /> : <JourneyView />}
    </Space>
  )
}
