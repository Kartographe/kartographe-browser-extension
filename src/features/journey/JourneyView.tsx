import { useCallback, useState } from 'react'
import {
  App,
  Button,
  Empty,
  Flex,
  Input,
  List,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { AttachSection } from '@/features/entities/AttachSection'
import type { CaptureLinks } from '@/features/capture/push'
import {
  useAddCurrentPage,
  useClearRecording,
  usePushJourney,
  useRecording,
  useRemoveStep,
  useSetRecordingTitle,
  useStartRecording,
} from './hooks'

const { Text } = Typography

export function JourneyView() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const recording = useRecording()
  const start = useStartRecording()
  const setTitle = useSetRecordingTitle()
  const addPage = useAddCurrentPage()
  const removeStep = useRemoveStep()
  const clear = useClearRecording()
  const push = usePushJourney()

  const [draftTitle, setDraftTitle] = useState('')
  const [links, setLinks] = useState<CaptureLinks>({})
  const onLinksChange = useCallback((next: CaptureLinks) => setLinks(next), [])

  if (recording.isLoading) {
    return (
      <Flex justify="center" style={{ padding: 24 }}>
        <Spin />
      </Flex>
    )
  }

  const rec = recording.data
  if (!rec?.active) {
    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Text type="secondary">{t('journey.intro')}</Text>
        <Input
          placeholder={t('journey.titleOptional')}
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
        />
        <Button
          type="primary"
          block
          loading={start.isPending}
          onClick={() => start.mutate(draftTitle)}
        >
          {t('journey.start')}
        </Button>
      </Space>
    )
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Input
        placeholder={t('journey.title')}
        defaultValue={rec.title}
        onBlur={(e) => setTitle.mutate(e.target.value)}
      />

      <Button
        icon={<PlusOutlined />}
        block
        loading={addPage.isPending}
        onClick={() =>
          addPage.mutate(undefined, {
            onSuccess: () => message.success(t('journey.pageAdded')),
            onError: (e) => message.error((e as Error).message),
          })
        }
      >
        {t('journey.addPage')}
      </Button>

      {rec.steps.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('journey.noPages')}
          style={{ margin: '8px 0' }}
        />
      ) : (
        <List
          size="small"
          bordered
          dataSource={rec.steps}
          style={{ maxHeight: 220, overflowY: 'auto' }}
          renderItem={(step, index) => (
            <List.Item
              actions={[
                <Button
                  key="rm"
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeStep.mutate(step.localId)}
                />,
              ]}
            >
              <Space size={8}>
                <Tag>{index + 1}</Tag>
                <img
                  src={step.screenshotDataUrl}
                  alt=""
                  width={40}
                  height={26}
                  style={{ objectFit: 'cover', borderRadius: 3, border: '1px solid #eee' }}
                />
                <Text ellipsis style={{ maxWidth: 170 }}>
                  {step.title}
                </Text>
              </Space>
            </List.Item>
          )}
        />
      )}

      <AttachSection pageUrl={rec.steps[0]?.url ?? ''} onChange={onLinksChange} />

      <Space style={{ width: '100%' }} styles={{ item: { flex: 1 } }}>
        <Button block danger onClick={() => clear.mutate()} disabled={push.isPending}>
          {t('journey.discard')}
        </Button>
        <Button
          type="primary"
          block
          loading={push.isPending}
          disabled={rec.steps.length === 0}
          onClick={() =>
            push.mutate(
              { recording: rec, links },
              {
                onSuccess: (res) => {
                  message.success(t('journey.sent', { count: res.stepCount }))
                  clear.mutate()
                },
                onError: (e) => message.error((e as Error).message),
              },
            )
          }
        >
          {t('journey.send')}
        </Button>
      </Space>
    </Space>
  )
}
