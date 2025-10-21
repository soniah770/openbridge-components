import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { ObcBarVertical, BarVerticalAlignment } from './bar-vertical';
import './bar-vertical';
import { widthDecorator } from '../../storybook-util.js';

type Story = StoryObj<ObcBarVertical>;

const baseArgs: Partial<ObcBarVertical> = {
  value: 65,
  minValue: 0,
  maxValue: 100,
  height: 320,
  alignment: BarVerticalAlignment.left,
  showScale: true,
  showTicks: true,
  showBackground: true,
  primaryTickInterval: 25,
  secondaryTickInterval: 5,
};

const meta: Meta<typeof ObcBarVertical> = {
  title: 'Bars and Graphs/Bar Vertical',
  tags: ['autodocs', '6.0'],
  component: 'obc-bar-vertical',
  argTypes: {
    value: { control: { type: 'range', min: -100, max: 100, step: 1 }, description: 'Current value to display' },
    minValue: { control: { type: 'range', min: -100, max: 0, step: 1 }, description: 'Minimum value of scale' },
    maxValue: { control: { type: 'range', min: 0, max: 200, step: 1 }, description: 'Maximum value of scale' },
    height: { control: { type: 'range', min: 160, max: 800, step: 10 }, description: 'Height of the bar component in pixels' },
    alignment: { control: 'select', options: Object.values(BarVerticalAlignment), description: 'Position of scale (left or right of bar)' },
    showScale: { control: 'boolean', description: 'Show/hide scale labels (uses alignment)' },
    showTicks: { control: 'boolean', description: 'Show/hide tick marks (uses alignment)' },
    showScaleLeft: { control: 'boolean', description: 'Show scale labels on left side' },
    showScaleRight: { control: 'boolean', description: 'Show scale labels on right side' },
    showTicksLeft: { control: 'boolean', description: 'Show tick marks on left side' },
    showTicksRight: { control: 'boolean', description: 'Show tick marks on right side' },
    showBackground: { control: 'boolean', description: 'Show/hide bar background' },
    primaryTickInterval: { control: { type: 'range', min: 1, max: 50, step: 1 }, description: 'Interval for primary tick marks and labels' },
    secondaryTickInterval: { control: { type: 'range', min: 0, max: 25, step: 1 }, description: 'Interval for secondary (smaller) tick marks' },
  },
  args: baseArgs,
  decorators: [widthDecorator],
} satisfies Meta<ObcBarVertical>;

export default meta;

/** Helper to create stories with merged args (keeps things DRY). */
const makeStory = (args: Partial<ObcBarVertical> = {}): Story => ({
  args: { ...baseArgs, ...args },
});

export const Primary: Story = makeStory();

export const Realtime: Story = {
  ...makeStory(),
  tags: ['skip-snapshot'],
  play: async ({ canvasElement }) => {
    const chart = canvasElement.querySelector('obc-bar-vertical') as ObcBarVertical & { __rtId?: number };
    if (!chart) return;

    // Prevent multiple intervals if story re-mounts/rerenders
    if (chart.__rtId) clearInterval(chart.__rtId);

    chart.__rtId = window.setInterval(() => {
      // Keep within current range in case controls change
      const min = Number(chart.minValue ?? 0);
      const max = Number(chart.maxValue ?? 100);
      chart.value = min + Math.random() * (max - min);
    }, 1000);
  },
};

export const LeftAlignment: Story = makeStory({
  alignment: BarVerticalAlignment.left,
});

export const RightAlignment: Story = makeStory({
  alignment: BarVerticalAlignment.right,
});

export const NoScale: Story = makeStory({
  showScale: false,
  showTicks: false,
});

const negativeRange = { minValue: -100, maxValue: 100 };

export const LeftAlignmentNegative: Story = makeStory({
  ...negativeRange,
  alignment: BarVerticalAlignment.left,
  showScale: true,
  showTicks: true,
});

export const RightAlignmentNegative: Story = makeStory({
  ...negativeRange,
  alignment: BarVerticalAlignment.right,
  showScale: true,
  showTicks: true,
});

export const NoScaleNegative: Story = makeStory({
  ...negativeRange,
  showScale: false,
  showTicks: false,
});

export const WithAdvice: Story = makeStory({
  value: 75,
  advice: [
    { min: 80, max: 100, type: 'caution', state: 'regular' },
    { min: 20, max: 40, type: 'advice', state: 'hinted' },
  ],
});
