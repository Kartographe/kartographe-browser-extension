import { Button, Flex, Space, Typography } from 'antd'

const { Title, Text } = Typography

function openOptions() {
  chrome.runtime.openOptionsPage()
}

/**
 * Popup shell. Capture, attach and journey UIs are added in later milestones;
 * for now it links to Options where the server URL and account are configured.
 */
export function App() {
  return (
    <Flex vertical gap={16} style={{ padding: 16 }}>
      <Space direction="vertical" size={0}>
        <Title level={4} style={{ margin: 0 }}>
          Kartographe Trail
        </Title>
        <Text type="secondary">Web clipper for your Kartographe map</Text>
      </Space>

      <Text>
        Configure your Kartographe server and sign in from the options page to
        start capturing.
      </Text>

      <Button type="primary" onClick={openOptions}>
        Open settings
      </Button>
    </Flex>
  )
}
