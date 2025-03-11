import { StoreIcon, CloudIcon,CloudRainIcon } from 'lucide-react'

export const apps = [
  {
    name: 'Telegram',
    logo: <StoreIcon />,
    connected: false,
    desc: 'Connect with Telegram for real-time communication.',
  },
  {
    name: 'Notion',
    logo: <CloudIcon />,
    connected: true,
    desc: 'Effortlessly sync Notion pages for seamless collaboration.',
  },
  {
    name: 'Figma',
    logo: <CloudRainIcon />,
    connected: true,
    desc: 'View and collaborate on Figma designs in one place.',
  },
  {
    name: 'Trello',
    logo: <StoreIcon />,
    connected: false,
    desc: 'Sync Trello cards for streamlined project management.',
  },
  {
    name: 'Slack',
    logo: <CloudIcon />,
    connected: false,
    desc: 'Integrate Slack for efficient team communication',
  },
  {
    name: 'Zoom',
    logo: <StoreIcon />,
    connected: true,
    desc: 'Host Zoom meetings directly from the dashboard.',
  },
  {
    name: 'Stripe',
    logo: <CloudRainIcon />,
    connected: false,
    desc: 'Easily manage Stripe transactions and payments.',
  },
  {
    name: 'Gmail',
    logo: <StoreIcon />,
    connected: true,
    desc: 'Access and manage Gmail messages effortlessly.',
  },
  {
    name: 'Medium',
    logo: <StoreIcon />,
    connected: false,
    desc: 'Explore and share Medium stories on your dashboard.',
  },
  {
    name: 'Skype',
    logo: <StoreIcon />,
    connected: false,
    desc: 'Connect with Skype contacts seamlessly.',
  },
  {
    name: 'Docker',
    logo: <CloudRainIcon />,
    connected: false,
    desc: 'Effortlessly manage Docker containers on your dashboard.',
  },
  {
    name: 'GitHub',
    logo: <StoreIcon />,
    connected: false,
    desc: 'Streamline code management with GitHub integration.',
  },
  {
    name: 'GitLab',
    logo: <CloudIcon />,
    connected: false,
    desc: 'Efficiently manage code projects with GitLab integration.',
  },
  {
    name: 'Discord',
    logo: <StoreIcon />,
    connected: false,
    desc: 'Connect with Discord for seamless team communication.',
  },
  {
    name: 'WhatsApp',
    logo: <CloudIcon />,
    connected: false,
    desc: 'Easily integrate WhatsApp for direct messaging.',
  },
]
