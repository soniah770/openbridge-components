import type {Meta, StoryObj} from '@storybook/web-components-vite';
import {ObcPieChart, ObcPieChartType, PieSegment} from './pie-chart.js';
import './pie-chart.js';

const BLUE_PALETTE = {
  BLUE_600: 'var(--Color-Base-Blue-600, #1D3C67)',
  BLUE_500: 'var(--Color-Base-Blue-500, #2D548B)',
  BLUE_400: 'var(--Color-Base-Blue-400, #4271B3)',
  BLUE_300: 'var(--Color-Base-Blue-300, #5D8FD5)',
  BLUE_200: 'var(--Color-Base-Blue-200, #9CC1F5)',
  BLUE_100: 'var(--Color-Base-Blue-100, #CADEFC)',
  BLUE_050: 'var(--Color-Base-Blue-050, #E4EEFD)',
} as const;

const SEGMENT_PRESETS = {
  standard: [
    {value: 50, color: BLUE_PALETTE.BLUE_600},
    {value: 25, color: BLUE_PALETTE.BLUE_500},
    {value: 12.5, color: BLUE_PALETTE.BLUE_400},
    {value: 12.5, color: BLUE_PALETTE.BLUE_300},
  ] as PieSegment[],

  lightVariant: [
    {value: 50, color: BLUE_PALETTE.BLUE_600},
    {value: 25, color: BLUE_PALETTE.BLUE_200},
    {value: 12.5, color: BLUE_PALETTE.BLUE_100},
    {value: 12.5, color: BLUE_PALETTE.BLUE_050},
  ] as PieSegment[],

  outerRing: [
    {value: 25, color: BLUE_PALETTE.BLUE_500},
    {value: 16.67, color: BLUE_PALETTE.BLUE_400},
    {value: 8.33, color: BLUE_PALETTE.BLUE_300},
  ] as PieSegment[],
} as const;

const meta: Meta<typeof ObcPieChart> = {
  title: 'Bars and Graphs/Pie Chart',
  tags: ['6.0'],
  component: 'obc-pie-chart',
  argTypes: {
    segments: {
      control: 'object',
      description: 'Array of segments',
    },
    outerSegments: {
      control: 'object',
      description: 'Array of outer ring segments',
    },
    type: {
      control: 'select',
      options: Object.values(ObcPieChartType),
      description: 'Chart type',
    },
    showLabels: {
      control: 'boolean',
      description: 'Display segment labels',
    },
    showValues: {
      control: 'boolean',
      description: 'Display segment values',
    },
    showContainer: {
      control: 'boolean',
      description: 'Display container border',
    },
  },
} satisfies Meta<ObcPieChart>;

export default meta;
type Story = StoryObj<ObcPieChart>;

export const Primary: Story = {
  args: {
    segments: SEGMENT_PRESETS.standard,
    type: ObcPieChartType.filled,
    showContainer: true,
  },
};

export const Ring: Story = {
  args: {
    segments: SEGMENT_PRESETS.lightVariant,
    outerSegments: SEGMENT_PRESETS.outerRing,
    type: ObcPieChartType.filled,
    showContainer: true,
  },
};

export const Realtime: Story = {
  tags: ['skip-snapshot'],
  args: {
    segments: SEGMENT_PRESETS.standard,
    type: ObcPieChartType.filled,
    showContainer: true,
  },
  play: async ({canvasElement}) => {
    const chart = canvasElement.querySelector('obc-pie-chart') as ObcPieChart;
    if (!chart) throw new Error('Pie chart not found');

    let direction = 1;
    setInterval(() => {
      const newSegments = chart.segments.map((seg) => {
        const change = (Math.random() - 0.5) * 5 * direction;
        const newValue = Math.max(5, Math.min(80, seg.value + change));
        return {value: newValue, color: seg.color, label: seg.label};
      });
      
      chart.segments = [...newSegments];
      if (Math.random() > 0.95) direction *= -1;
    }, 500);
  },
};