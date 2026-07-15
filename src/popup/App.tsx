import { useState } from 'react'
import {
  Alert,
  App as AntApp,
  Button,
  Flex,
  Image,
  Input,
  Space,
  Spin,
  Typography,
} from 'antd'
import { useConfig } from '@/lib/storage/hooks'
import { useSession } from '@/features/auth/hooks'
import { useCaptureTab, usePushCapture } from '@/features/capture/hooks'
import type { PageCapture } from '@/features/capture/types'

const { Title, Text, Link } = Typography

function openOptions() {
  chrome.runtime.openOptionsPage()
}

function NotReady({ reason }: { reason: string }) {
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text>{reason}</Text>
      <Button type="primary" onClick={openOptions}>
        Open settings
      </Button>
    </Space>
  )
}

function CaptureView() {
  const { message } = AntApp.useApp()
  const capture = useCaptureTab()
  const push = usePushCapture()
  const [shot, setShot] = useState<PageCapture | null>(null)
  const [note, setNote] = useState('')

  if (!shot) {
    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Text type="secondary">
          Capture a screenshot, URL and metadata of the current page.
        </Text>
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
          Capture this page
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
        placeholder="Optional annotation…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        autoSize={{ minRows: 2, maxRows: 4 }}
      />

      <Space style={{ width: '100%' }} styles={{ item: { flex: 1 } }}>
        <Button
          block
          onClick={() => {
            setShot(null)
            setNote('')
          }}
          disabled={push.isPending}
        >
          Retake
        </Button>
        <Button
          type="primary"
          block
          loading={push.isPending}
          onClick={() =>
            push.mutate(
              { capture: shot, options: { note: note || undefined } },
              {
                onSuccess: () => {
                  message.success('Sent to Kartographe')
                  setShot(null)
                  setNote('')
                },
                onError: (e) => message.error((e as Error).message),
              },
            )
          }
        >
          Send to Kartographe
        </Button>
      </Space>
    </Space>
  )
}

export function App() {
  const config = useConfig()
  const session = useSession()

  const loading = config.isLoading || session.isLoading

  return (
    <Flex vertical gap={16} style={{ padding: 16 }}>
      <Space direction="vertical" size={0}>
        <Title level={4} style={{ margin: 0 }}>
          Kartographe Trail
        </Title>
        <Link onClick={openOptions} style={{ fontSize: 12 }}>
          Settings
        </Link>
      </Space>

      {loading ? (
        <Flex justify="center" style={{ padding: 24 }}>
          <Spin />
        </Flex>
      ) : !config.data?.serverUrl ? (
        <NotReady reason="Configure your Kartographe server to get started." />
      ) : session.data !== true ? (
        <NotReady reason="Sign in to your Kartographe account to start capturing." />
      ) : !config.data.accountId ? (
        <NotReady reason="Select the account captures should be pushed to." />
      ) : (
        <CaptureView />
      )}
    </Flex>
  )
}
