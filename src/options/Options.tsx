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
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const { message } = App.useApp()
  const config = useConfig()
  const save = useSaveConfig()
  const [form] = Form.useForm<ServerFormValues>()

  const serverOptions = [
    ...SERVER_PRESETS.map((p) => ({
      value: p.url,
      disabled: p.disabled,
      label: `${p.url} · ${p.region}${p.disabled ? ` — ${t('server.comingSoon')}` : ''}`,
    })),
    { value: CUSTOM_SERVER, label: t('server.custom') },
  ]

  const stored = config.data?.serverUrl ?? ''
  const initialServer = initialServerValue(stored)
  const initialCustom = initialServer === CUSTOM_SERVER ? stored : ''

  const selected = Form.useWatch('server', form) ?? initialServer
  const isCustom = selected === CUSTOM_SERVER

  return (
    <Card title={t('server.cardTitle')} loading={config.isLoading}>
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
              onSuccess: () => message.success(t('server.saved')),
              onError: () => message.error(t('server.saveError')),
            },
          )
        }}
      >
        <Form.Item
          name="server"
          label={t('server.label')}
          tooltip={t('server.tooltip')}
          rules={[{ required: true, message: t('server.chooseError') }]}
        >
          <Select options={serverOptions} />
        </Form.Item>

        {isCustom ? (
          <Form.Item
            name="customUrl"
            label={t('server.customLabel')}
            rules={[
              { required: true, message: t('server.customRequired') },
              { type: 'url', message: t('server.invalidUrl') },
            ]}
          >
            <Input placeholder={t('server.customPlaceholder')} />
          </Form.Item>
        ) : null}

        <Button type="primary" htmlType="submit" loading={save.isPending}>
          {t('common.save')}
        </Button>
      </Form>
    </Card>
  )
}

function AccountCard() {
  const { t } = useTranslation()
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
      <Card title={t('account.cardTitle')}>
        <Text type="secondary">{t('account.needServer')}</Text>
      </Card>
    )
  }

  if (session.data !== true) {
    return (
      <Card title={t('account.cardTitle')}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text>{t('account.signInPrompt')}</Text>
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
            {t('account.signIn')}
          </Button>
        </Space>
      </Card>
    )
  }

  return (
    <Card
      title={t('account.cardTitle')}
      extra={
        <Button
          danger
          size="small"
          loading={logout.isPending}
          onClick={() => logout.mutate()}
        >
          {t('account.signOut')}
        </Button>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {me.isLoading ? (
          <Spin />
        ) : me.data ? (
          <Text>
            {t('account.signedInAs')}{' '}
            <strong>
              {[me.data.firstName, me.data.lastName].filter(Boolean).join(' ') ||
                me.data.email}
            </strong>{' '}
            <Text type="secondary">({me.data.email})</Text>
          </Text>
        ) : null}

        <div>
          <Text strong>{t('account.activeAccount')}</Text>
          <div style={{ marginTop: 8 }}>
            <Select
              style={{ width: '100%' }}
              loading={accounts.isLoading}
              placeholder={t('account.selectAccount')}
              value={config.data?.accountId ?? undefined}
              options={(accounts.data ?? []).map((a) => ({
                value: a.id,
                label: a.name,
              }))}
              onChange={(accountId: string) =>
                save.mutate(
                  { accountId },
                  { onSuccess: () => message.success(t('account.accountUpdated')) },
                )
              }
            />
          </div>
          {config.data?.accountId ? (
            <Tag color="green" style={{ marginTop: 8 }}>
              {t('account.ready')}
            </Tag>
          ) : (
            <Text type="warning" style={{ display: 'block', marginTop: 8 }}>
              {t('account.pickAccount')}
            </Text>
          )}
        </div>
      </Space>
    </Card>
  )
}

export function Options() {
  const { t } = useTranslation()
  return (
    <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 16px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Flex align="center" gap={12}>
          <img src={logoUrl} alt="Kartographe" height={32} />
          <Text style={{ fontSize: 18, fontWeight: 600 }}>Trail</Text>
          <Text type="secondary">{t('account.settingsSubtitle')}</Text>
        </Flex>
        <ServerCard />
        <AccountCard />
      </Space>
    </div>
  )
}
