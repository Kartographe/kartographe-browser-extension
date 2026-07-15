import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Form, Input, Space, Typography } from 'antd'
import {
  getConfig,
  normaliseServerUrl,
  setConfig,
} from '@/lib/storage/config'

const { Title, Text } = Typography

/**
 * Options page. This milestone ships the runtime-configurable server URL.
 * Sign-in (OAuth), account selection and logout are added in the auth milestone.
 */
export function Options() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const configQuery = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  })

  const saveMutation = useMutation({
    mutationFn: (serverUrl: string) =>
      setConfig({ serverUrl: normaliseServerUrl(serverUrl) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['config'] })
      message.success('Settings saved')
    },
    onError: () => message.error('Could not save settings'),
  })

  return (
    <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 16px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space direction="vertical" size={0}>
          <Title level={3} style={{ margin: 0 }}>
            Kartographe Trail
          </Title>
          <Text type="secondary">Extension settings</Text>
        </Space>

        <Card title="Kartographe server" loading={configQuery.isLoading}>
          <Form
            layout="vertical"
            initialValues={{ serverUrl: configQuery.data?.serverUrl }}
            onFinish={(values: { serverUrl: string }) =>
              saveMutation.mutate(values.serverUrl)
            }
            key={configQuery.data?.serverUrl}
          >
            <Form.Item
              name="serverUrl"
              label="Server URL"
              tooltip="Base URL of your Kartographe backend"
              rules={[
                { required: true, message: 'Please enter the server URL' },
                { type: 'url', message: 'Enter a valid URL' },
              ]}
            >
              <Input placeholder="https://kartographe.example.com" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={saveMutation.isPending}
            >
              Save
            </Button>
          </Form>
        </Card>
      </Space>
    </div>
  )
}
