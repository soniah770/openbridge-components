import type {Meta, StoryObj} from '@storybook/web-components-vite';
import {ObcBarVertical, BarVerticalSize, BarVerticalAlignment} from './bar-vertical';
import './bar-vertical';

// Default configuration for all stories
const defaultArgs = {
  value: 65,
  minValue: 0,
  maxValue: 100,
  alignment: BarVerticalAlignment.left,
  showScale: true,
  showTicks: true,
  showBackground: true,
  mainTickmark: 0,
  primaryTickInterval: 25,
  secondaryTickInterval: 5,
  size: BarVerticalSize.medium,
};

const meta: Meta<typeof ObcBarVertical> = {
  title: 'Bars and Graphs/Bar Vertical',
  tags: ['autodocs', '6.0'],
  component: 'obc-bar-vertical',
  args: defaultArgs,
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(BarVerticalSize),
      description: 'Height of the bar component',
    },
    alignment: {
      control: 'select',
      options: Object.values(BarVerticalAlignment),
      description: 'Position of scale (left or right of bar)',
    },
    value: {
      control: 'number',
      description: 'Current value to display',
    },
    minValue: {
      control: 'number',
      description: 'Minimum value of scale',
    },
    maxValue: {
      control: 'number',
      description: 'Maximum value of scale',
    },
    showScale: {
      control: 'boolean',
      description: 'Show/hide scale labels (uses alignment)',
    },
    showTicks: {
      control: 'boolean',
      description: 'Show/hide tick marks (uses alignment)',
    },
    showScaleLeft: {
      control: 'boolean',
      description: 'Show scale labels on left side',
    },
    showScaleRight: {
      control: 'boolean',
      description: 'Show scale labels on right side',
    },
    showTicksLeft: {
      control: 'boolean',
      description: 'Show tick marks on left side',
    },
    showTicksRight: {
      control: 'boolean',
      description: 'Show tick marks on right side',
    },
    showBackground: {
      control: 'boolean',
      description: 'Show/hide bar background',
    },
    mainTickmark: {
      control: 'number',
      description: 'Value for special main tick mark',
    },
    primaryTickInterval: {
      control: 'number',
      description: 'Interval for primary tick marks and labels',
    },
    secondaryTickInterval: {
      control: 'number',
      description: 'Interval for secondary (smaller) tick marks',
    },
  },
} satisfies Meta<ObcBarVertical>;

export default meta;
type Story = StoryObj<ObcBarVertical>;

// Playground with default configuration
export const Primary: Story = {};

// Animated value updates every second
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

// Scale positioned on left side
export const LeftAlignment: Story = {
  args: {
    alignment: BarVerticalAlignment.left,
  },
};

// Scale positioned on right side
export const RightAlignment: Story = {
  args: {
    alignment: BarVerticalAlignment.right,
  },
};

// Bar only, no scale or tick marks
export const NoScale: Story = {
  args: {
    showScale: false,
    showTicks: false,
  },
};

// Left-aligned scale with negative range
export const LeftAlignmentNegative: Story = {
  args: {
    minValue: -100,
    alignment: BarVerticalAlignment.left,
  },
};

// Right-aligned scale with negative range
export const RightAlignmentNegative: Story = {
  args: {
    minValue: -100,
    alignment: BarVerticalAlignment.right,
  },
};

// Bar only with negative range
export const NoScaleNegative: Story = {
  args: {
    minValue: -100,
    showScale: false,
    showTicks: false,
  },
};

// Bar with colored advice/caution ranges
export const WithAdvice: Story = {
  args: {
    value: 75,
    advice: [
      { min: 80, max: 100, type: 'caution', state: 'regular' },
      { min: 20, max: 40, type: 'advice', state: 'hinted' },
    ],
  },
};
