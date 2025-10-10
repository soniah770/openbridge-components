import type {Meta, StoryObj} from '@storybook/web-components-vite';
import {ObcBarVertical, BarVerticalSize, BarVerticalAlignment} from './bar-vertical.js';
import './bar-vertical.js';

const meta: Meta<typeof ObcBarVertical> = {
  title: 'Bars and Graphs/Bar Vertical',
  tags: ['autodocs', '6.0'],
  component: 'obc-bar-vertical',
  args: {
    value: 65,
    minValue: 0,
    maxValue: 100,
    alignment: BarVerticalAlignment.left,
    showScale: true,
    showTicks: true,
    showBackground: true,
    majorTickCount: 5,
    minorTickCount: 4,
    size: BarVerticalSize.medium,
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(BarVerticalSize),
    },
    alignment: {
      control: 'select',
      options: Object.values(BarVerticalAlignment),
    },
    value: {control: 'number'},
    minValue: {control: 'number'},
    maxValue: {control: 'number'},
    showScale: {control: 'boolean'},
    showTicks: {control: 'boolean'},
    showBackground: {control: 'boolean'},
    majorTickCount: {control: 'number'},
    minorTickCount: {control: 'number'},
  },
} satisfies Meta<ObcBarVertical>;

export default meta;
type Story = StoryObj<ObcBarVertical>;

export const Primary: Story = {};

export const RightAlignment: Story = {
  args: {
    alignment: BarVerticalAlignment.right,
  },
};

export const NegativeValues: Story = {
  args: {
    value: 55,
    minValue: -100,
    maxValue: 100,
  },
};

export const NegativeValuesRight: Story = {
  args: {
    value: 55,
    minValue: -100,
    maxValue: 100,
    alignment: BarVerticalAlignment.right,
  },
};

export const Realtime: Story = {
  tags: ['skip-snapshot'],
  play: async ({canvasElement}) => {
    const chart = canvasElement.querySelector('obc-bar-vertical') as ObcBarVertical;
    if (!chart) return;
    
    setInterval(() => {
      chart.value = Math.random() * 100;
    }, 1000);
  },
};