import {LitElement, html, svg, nothing, unsafeCSS} from 'lit';
import {property} from 'lit/decorators.js';
import {customElement} from '../../decorator.js';
import componentStyle from './bar-vertical.css?inline';

export enum BarVerticalAlignment {
  left = 'left',
  right = 'right',
}

export interface BarVerticalAdvice {
  min: number;
  max: number;
  type: 'caution' | 'advice';
  state: 'hinted' | 'regular' | 'triggered';
}

interface Tick {
  value: number;
  isMain: boolean;
  position: number;
}

const BAR_CONSTANTS = {
  WIDTH: 32,
  INNER_WIDTH: 31,
  CORNER_RADIUS: 4,
  STROKE_OFFSET: 0.5, 
  FLOAT_EPSILON: 0.01,
  VIEWBOX_MARGIN: 0,
} as const;

const ADVICE_OPACITY = {
  hinted: 0.1,
  regular: 0.2,
  triggered: 0.35,
} as const;

@customElement('obc-bar-vertical')
export class ObcBarVertical extends LitElement {
  @property({type: Number}) value = 65;
  @property({type: Number}) minValue = 0;
  @property({type: Number}) maxValue = 100;
  @property({type: Number}) height = 320;

  @property({type: String}) alignment: BarVerticalAlignment = BarVerticalAlignment.left;
  @property({type: Boolean}) showScale = true;
  @property({type: Boolean}) showTicks = true;

  @property({type: Boolean}) showScaleLeft = false;
  @property({type: Boolean}) showScaleRight = false;
  @property({type: Boolean}) showTicksLeft = false;
  @property({type: Boolean}) showTicksRight = false;

  @property({type: Boolean}) showBackground = true;
  @property({type: Number}) primaryTickInterval = 25;
  @property({type: Number}) secondaryTickInterval = 0;
  @property({type: Array}) advice: BarVerticalAdvice[] = [];

  override render() {
    const showLeft = this.shouldShowScale('left');
    const showRight = this.shouldShowScale('right');

    return html`
      <div class="wrapper" style="height: ${this.height}px;">
        ${showLeft ? this.renderScale('left') : nothing}
        ${this.renderBar()}
        ${showRight ? this.renderScale('right') : nothing}
      </div>
    `;
  }

  // ---------- layout helpers ----------
  private shouldShowScale(side: 'left' | 'right'): boolean {
    const {showScaleLabels, showTickMarks} = this.getScaleVisibility(side);
    return showScaleLabels || showTickMarks;
  }

  private renderScale(side: 'left' | 'right') {
    const {showScaleLabels, showTickMarks} = this.getScaleVisibility(side);
    if (!showScaleLabels && !showTickMarks) return nothing;

    const labels = showScaleLabels ? this.renderScaleLabels() : nothing;
    const ticks = showTickMarks ? this.renderTickmarks() : nothing;

    const content = side === 'left' ? [labels, ticks] : [ticks, labels];
    return html`<div class="scale-container ${side}">${content[0]}${content[1]}</div>`;
  }

  private getScaleVisibility(side: 'left' | 'right') {
    const isLeft = side === 'left';
    const explicitScale = isLeft ? this.showScaleLeft : this.showScaleRight;
    const explicitTicks = isLeft ? this.showTicksLeft : this.showTicksRight;
    const alignmentMatch = this.alignment === side;

    const useExplicit = explicitScale || explicitTicks;

    return {
      showScaleLabels: useExplicit ? explicitScale : (alignmentMatch && this.showScale),
      showTickMarks: useExplicit ? explicitTicks : (alignmentMatch && this.showTicks),
    };
  }

  // ---------- main SVG ----------
  private renderBar() {
    return html`
      <svg
        class="bar-svg"
        viewBox="0 0 ${BAR_CONSTANTS.WIDTH} 100"
        preserveAspectRatio="none">
        ${this.showBackground ? this.renderBackground() : nothing}
        ${this.renderAdviceRanges()}
        ${this.renderValueBar()}
      </svg>
    `;
  }

  private renderBackground() {
    const {STROKE_OFFSET, INNER_WIDTH, CORNER_RADIUS} = BAR_CONSTANTS;
    const height = 100 - (STROKE_OFFSET * 2);

    return svg`
      <rect
        x="${STROKE_OFFSET}"
        y="${STROKE_OFFSET}"
        width="${INNER_WIDTH}"
        height="${height}"
        rx="${CORNER_RADIUS}"
        fill="#FFF"
        stroke="var(--instrument-frame-tertiary-color, #BEBEBE)"
        stroke-width="1"
        vector-effect="non-scaling-stroke"/>
    `;
  }

  // ---------- advice (gray bands) ----------
  private renderAdviceRanges() {
    if (!this.advice?.length) return nothing;
    return svg`${this.advice.map(adv => this.renderSingleAdvice(adv))}`;
  }

  private renderSingleAdvice(adv: BarVerticalAdvice) {
    const isTriggered = this.value >= adv.min && this.value <= adv.max;
    const state = isTriggered ? 'triggered' : adv.state;

    const minPercent = this.valueToPercent(adv.min);
    const maxPercent = this.valueToPercent(adv.max);

    const {top, bottom} = this.segmentFromRange(minPercent, maxPercent);
    const path = this.createCapsulePath(top, bottom); // adaptive corners

    return svg`
      <path
        d="${path}"
        fill="var(--instrument-frame-tertiary-color, #BEBEBE)"
        opacity="${ADVICE_OPACITY[state]}"
        stroke="none"/>
    `;
  }

  // ---------- value (blue fill) ----------
  private renderValueBar() {
    const percent = this.valueToPercent(this.value);
    const zeroPercent = this.valueToPercent(0);

    if (Math.abs(percent - zeroPercent) < BAR_CONSTANTS.FLOAT_EPSILON) return nothing;

    const maxPercent = Math.max(percent, zeroPercent);
    const minPercent = Math.min(percent, zeroPercent);

    const {top, bottom} = this.segmentFromRange(minPercent, maxPercent);
    if (bottom - top <= 0) return nothing;

    const path = this.createCapsulePath(top, bottom); // adaptive corners

    return svg`
      <path
        d="${path}"
        fill="var(--Color-Instrument-Enhanced-secondary-color, #2D548B)"
        stroke="var(--Color-Instrument-Enhanced-secondary-color, #2D548B)"
        stroke-width="1"
        vector-effect="non-scaling-stroke"/>
    `;
  }


  /** Convert a [min,max] percent range into top/bottom Y in viewBox coordinates. */
  private segmentFromRange(minPercent: number, maxPercent: number) {
    const top = 100 - maxPercent;
    const bottom = 100 - minPercent;
    return {top, bottom};
  }

  /** Whether the segment touches the container’s top/bottom (for rounded caps). */
  private edgeFlags(top: number, bottom: number) {
    const {STROKE_OFFSET, FLOAT_EPSILON} = BAR_CONSTANTS;
    const isAtTop = top <= STROKE_OFFSET + FLOAT_EPSILON;
    const isAtBottom = bottom >= 100 - STROKE_OFFSET - FLOAT_EPSILON;
    return {isAtTop, isAtBottom};
  }

 
  private createCapsulePath(top: number, bottom: number): string {
    const {STROKE_OFFSET, INNER_WIDTH, CORNER_RADIUS} = BAR_CONSTANTS;
    const x = STROKE_OFFSET;
    const w = INNER_WIDTH;
    const r = CORNER_RADIUS;

    const {isAtTop, isAtBottom} = this.edgeFlags(top, bottom);

    let d = `M ${x} ${top}`;

    // top edge → right
    if (isAtTop) {
      d += ` L ${x + w - r} ${top}
             Q ${x + w} ${top} ${x + w} ${top + r}`;
    } else {
      d += ` L ${x + w} ${top}`;
    }

    // right edge 
    if (isAtBottom) {
      d += ` L ${x + w} ${bottom - r}
             Q ${x + w} ${bottom} ${x + w - r} ${bottom}`;
    } else {
      d += ` L ${x + w} ${bottom}`;
    }

    // bottom edge 
    if (isAtBottom) {
      d += ` L ${x + r} ${bottom}
             Q ${x} ${bottom} ${x} ${bottom - r}`;
    } else {
      d += ` L ${x} ${bottom}`;
    }

    // left edge 
    if (isAtTop) {
      d += ` L ${x} ${top + r}
             Q ${x} ${top} ${x + r} ${top}`;
    } else {
      d += ` L ${x} ${top}`;
    }

    d += ' Z';
    return d;
  }

  // ---------- scale UI ----------
  private renderScaleLabels() {
    if (this.primaryTickInterval <= 0) return nothing;

    const ticks = this.generatePrimaryTicks();
    const labels = ticks.map(tick => html`
      <div class="scale-label" style="top: ${100 - tick.position}%; transform: translateY(-50%);">
        ${Math.round(tick.value)}
      </div>
    `);

    return html`<div class="scale-labels">${labels}</div>`;
  }

  private renderTickmarks() {
    if (this.primaryTickInterval <= 0) return nothing;

    const ticks = this.generateAllTicks();
    const tickElements = ticks.map(tick => {
      const isTop = Math.abs(tick.value - this.maxValue) < BAR_CONSTANTS.FLOAT_EPSILON;
      const isBottom = Math.abs(tick.value - this.minValue) < BAR_CONSTANTS.FLOAT_EPSILON;

      return html`
        <div
          class="tick-mark ${tick.isMain ? 'main' : 'secondary'} ${isTop ? 'top' : ''} ${isBottom ? 'bottom' : ''}"
          style="--tick-percent: ${100 - tick.position}%; top: ${100 - tick.position}%;">
        </div>
      `;
    });

    return html`<div class="tick-marks">${tickElements}</div>`;
  }

  private generatePrimaryTicks(): Tick[] {
    const ticks: Tick[] = [];
    for (let val = this.maxValue; val >= this.minValue; val -= this.primaryTickInterval) {
      ticks.push({
        value: val,
        isMain: true,
        position: this.valueToPercent(val),
      });
    }
    return ticks;
  }

  private generateAllTicks(): Tick[] {
    const primary = this.generatePrimaryTicks();

    if (this.secondaryTickInterval <= 0 || this.secondaryTickInterval >= this.primaryTickInterval) {
      return primary;
    }

    const primaryValues = new Set(primary.map(t => t.value));
    const secondary: Tick[] = [];

    for (let val = this.maxValue; val >= this.minValue; val -= this.secondaryTickInterval) {
      if (!primaryValues.has(val)) {
        secondary.push({
          value: val,
          isMain: false,
          position: this.valueToPercent(val),
        });
      }
    }

    return [...primary, ...secondary].sort((a, b) => b.value - a.value);
  }

  // ---------- math ----------
  /** clamp using SVG (0..100) so ticks/labels stay inside the stroked rect */
  private valueToPercent(val: number): number {
    const range = this.maxValue - this.minValue;
    if (range === 0) return 0;

    const rawPercent = ((val - this.minValue) / range) * 100;
    const strokeOffsetPercent = BAR_CONSTANTS.STROKE_OFFSET;

    return Math.min(100 - strokeOffsetPercent, Math.max(strokeOffsetPercent, rawPercent));
  }

  static override styles = unsafeCSS(componentStyle);
}

declare global {
  interface HTMLElementTagNameMap {
    'obc-bar-vertical': ObcBarVertical;
  }
}
