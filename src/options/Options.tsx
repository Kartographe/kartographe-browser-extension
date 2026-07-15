import {
  App,
  Alert,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import {
  CUSTOM_SERVER,
  normaliseServerUrl,
  SERVER_PRESETS,
} from '@/lib/storage/config'
import { useConfig, useSaveConfig } from '@/lib/storage/hooks'
import { useLogin, useLogout, useSession } from '@/features/auth/hooks'
import { useAccounts, useMe } from '@/features/account/hooks'

const { Text } = Typography

const logoUrl = chrome.runtime.getURL('icons/logo-horizontal.svg')

const SERVER_OPTIONS = [
  ...SERVER_PRESETS.map((p) => ({
    value: p.url,
    disabled: p.disabled,
    label: `${p.url} · ${p.region}${p.disabled ? ' — coming soon' : ''}`,
  })),
  { value: CUSTOM_SERVER, label: 'Custom…' },
]

interface ServerFormValues {
  server: string
  customUrl?: string
}

function initialServerValue(storedUrl: string): string {
  if (SERVER_PRESETS.some((p) => p.url === storedUrl)) return storedUrl
  if (storedUrl) return CUSTOM_SERVER
  return SERVER_PRESETS[0].url // default to the EU endpoint
}

function ServerCard() {
  const { message } = App.useApp()
  const config = useConfig()
  const save = useSaveConfig()
  const [form] = Form.useForm<ServerFormValues>()

  const stored = config.data?.serverUrl ?? ''
  const initialServer = initialServerValue(stored)
  const initialCustom = initialServer === CUSTOM_SERVER ? stored : ''

  const selected = Form.useWatch('server', form) ?? initialServer
  const isCustom = selected === CUSTOM_SERVER

  return (
    <Card title="Kartographe server" loading={config.isLoading}>
      <Form
        form={form}
        layout="vertical"
        key={stored}
        initialValues={{ server: initialServer, customUrl: initialCustom }}
        onFinish={({ server, customUrl }: ServerFormValues) => {
          const url =
            server === CUSTOM_SERVER ? normaliseServerUrl(customUrl ?? '') : server
          save.mutate(
            { serverUrl: url },
            {
              onSuccess: () => message.success('Server saved'),
              onError: () => message.error('Could not save server'),
            },
          )
        }}
      >
        <Form.Item
          name="server"
          label="Server"
          tooltip="Choose a Kartographe Cloud region or enter your own server"
          rules={[{ required: true, message: 'Please choose a server' }]}
        >
          <Select options={SERVER_OPTIONS} />
        </Form.Item>

        {isCustom ? (
          <Form.Item
            name="customUrl"
            label="Custom server URL"
            rules={[
              { required: true, message: 'Please enter the server URL' },
              { type: 'url', message: 'Enter a valid URL' },
            ]}
          >
            <Input placeholder="https://kartographe.example.com" />
          </Form.Item>
        ) : null}

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
        <Flex align="center" gap={12}>
          <img src={logoUrl} alt="Kartographe" height={32} />
          <Text style={{ fontSize: 18, fontWeight: 600 }}>Trail</Text>
          <Text type="secondary">— settings</Text>
        </Flex>
        <ServerCard />
        <AccountCard />
      </Space>
    </div>
  )
}
