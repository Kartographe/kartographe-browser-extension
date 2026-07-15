import {
  App,
  Alert,
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import { normaliseServerUrl } from '@/lib/storage/config'
import { useConfig, useSaveConfig } from '@/lib/storage/hooks'
import { useLogin, useLogout, useSession } from '@/features/auth/hooks'
import { useAccounts, useMe } from '@/features/account/hooks'

const { Title, Text } = Typography

function ServerCard() {
  const { message } = App.useApp()
  const config = useConfig()
  const save = useSaveConfig()

  return (
    <Card title="Kartographe server" loading={config.isLoading}>
      <Form
        layout="vertical"
        key={config.data?.serverUrl}
        initialValues={{ serverUrl: config.data?.serverUrl }}
        onFinish={({ serverUrl }: { serverUrl: string }) =>
          save.mutate(
            { serverUrl: normaliseServerUrl(serverUrl) },
            {
              onSuccess: () => message.success('Server URL saved'),
              onError: () => message.error('Could not save server URL'),
            },
          )
        }
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
        <Button type="primary" htmlType="submit" loading={save.isPending}>
          Save
        </Button>
      </Form>
    </Card>
  )
}

function AccountCard() {
  const { message } = App.useApp()
  const config = useConfig()
  const session = useSession()
  const login = useLogin()
  const logout = useLogout()
  const me = useMe()
  const accounts = useAccounts()
  const save = useSaveConfig()

  const hasServer = !!config.data?.serverUrl

  if (!hasServer) {
    return (
      <Card title="Account">
        <Text type="secondary">Save a server URL first to sign in.</Text>
      </Card>
    )
  }

  if (session.data !== true) {
    return (
      <Card title="Account">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text>Sign in to your Kartographe account to start capturing.</Text>
          {login.error ? (
            <Alert type="error" showIcon message={(login.error as Error).message} />
          ) : null}
          <Button
            type="primary"
            loading={login.isPending}
            onClick={() =>
              login.mutate(undefined, {
                onError: (e) => message.error((e as Error).message),
              })
            }
          >
            Sign in with Kartographe
          </Button>
        </Space>
      </Card>
    )
  }

  return (
    <Card
      title="Account"
      extra={
        <Button
          danger
          size="small"
          loading={logout.isPending}
          onClick={() => logout.mutate()}
        >
          Sign out
        </Button>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {me.isLoading ? (
          <Spin />
        ) : me.data ? (
          <Text>
            Signed in as{' '}
            <strong>
              {[me.data.firstName, me.data.lastName].filter(Boolean).join(' ') ||
                me.data.email}
            </strong>{' '}
            <Text type="secondary">({me.data.email})</Text>
          </Text>
        ) : null}

        <div>
          <Text strong>Active account</Text>
          <div style={{ marginTop: 8 }}>
            <Select
              style={{ width: '100%' }}
              loading={accounts.isLoading}
              placeholder="Select the account captures are pushed to"
              value={config.data?.accountId ?? undefined}
              options={(accounts.data ?? []).map((a) => ({
                value: a.id,
                label: a.name,
              }))}
              onChange={(accountId: string) =>
                save.mutate(
                  { accountId },
                  { onSuccess: () => message.success('Active account updated') },
                )
              }
            />
          </div>
          {config.data?.accountId ? (
            <Tag color="green" style={{ marginTop: 8 }}>
              Ready to capture
            </Tag>
          ) : (
            <Text type="warning" style={{ display: 'block', marginTop: 8 }}>
              Pick an account to enable captures.
            </Text>
          )}
        </div>
      </Space>
    </Card>
  )
}

export function Options() {
  return (
    <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 16px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space direction="vertical" size={0}>
          <Title level={3} style={{ margin: 0 }}>
            Kartographe Trail
          </Title>
          <Text type="secondary">Extension settings</Text>
        </Space>
        <ServerCard />
        <AccountCard />
      </Space>
    </div>
  )
}
