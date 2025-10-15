import {LitElement, html, svg, nothing, unsafeCSS} from 'lit';
import {property} from 'lit/decorators.js';
import {customElement} from '../../decorator.js';
import componentStyle from './bar-vertical.css?inline';

export enum BarVerticalSize {
  small = 'small',
  medium = 'medium',
  large = 'large',
}

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

@customElement('obc-bar-vertical')
export class ObcBarVertical extends LitElement {
  @property({type: Number}) value = 65;
  @property({type: Number}) minValue = 0;
  @property({type: Number}) maxValue = 100;
  @property({type: String}) size: BarVerticalSize = BarVerticalSize.medium;
  
  // Legacy alignment-based API - use showScaleLeft/Right for fine-grained control
  @property({type: String}) alignment: BarVerticalAlignment = BarVerticalAlignment.left;
  @property({type: Boolean}) showScale = true;
  @property({type: Boolean}) showTicks = true;
  
  // Explicit per-side control - overrides alignment when set
  @property({type: Boolean}) showScaleLeft = false;
  @property({type: Boolean}) showScaleRight = false;
  @property({type: Boolean}) showTicksLeft = false;
  @property({type: Boolean}) showTicksRight = false;
  
  @property({type: Boolean}) showBackground = true;
  @property({type: Number}) mainTickmark?: number;
  @property({type: Number}) primaryTickInterval = 25;
  @property({type: Number}) secondaryTickInterval = 0;
  @property({type: Array}) advice: BarVerticalAdvice[] = [];

  // Constants
  private readonly BAR_WIDTH = 32;
  private readonly BAR_INNER_WIDTH = 31;
  private readonly CORNER_RADIUS = 2;
  private readonly STROKE_OFFSET = 0.5;
  private readonly FLOAT_EPSILON = 0.01;
  
  private readonly ADVICE_OPACITY = {
    hinted: 0.1,
    regular: 0.2,
    triggered: 0.35,
  } as const;

  override render() {
    const showLeft = this.shouldShowScale('left');
    const showRight = this.shouldShowScale('right');

    return html`
      <div class="wrapper ${this.size}">
        ${showLeft ? this.renderScale('left') : nothing}
        ${this.renderBar()}
        ${showRight ? this.renderScale('right') : nothing}
      </div>
    `;
  }

  private shouldShowScale(side: 'left' | 'right'): boolean {
    const explicitScale = side === 'left' ? this.showScaleLeft : this.showScaleRight;
    const explicitTicks = side === 'left' ? this.showTicksLeft : this.showTicksRight;
    const alignmentMatch = this.alignment === side;
    
    return explicitScale || explicitTicks || (alignmentMatch && (this.showScale || this.showTicks));
  }

  private renderScale(side: 'left' | 'right') {
    const {showScaleLabels, showTickMarks} = this.getScaleVisibility(side);
    
    const labels = showScaleLabels ? this.renderScaleLabels() : nothing;
    const ticks = showTickMarks ? this.renderTickmarks() : nothing;
    
    const content = side === 'left' ? [labels, ticks] : [ticks, labels];
    
    return html`
      <div class="scale-container ${side}">
        ${content[0]}
        ${content[1]}
      </div>
    `;
  }

  private getScaleVisibility(side: 'left' | 'right'): {showScaleLabels: boolean; showTickMarks: boolean} {
    const explicitScale = side === 'left' ? this.showScaleLeft : this.showScaleRight;
    const explicitTicks = side === 'left' ? this.showTicksLeft : this.showTicksRight;
    const useExplicit = explicitScale || explicitTicks;
    const alignmentMatch = this.alignment === side;
    
    return {
      showScaleLabels: useExplicit ? explicitScale : (alignmentMatch && this.showScale),
      showTickMarks: useExplicit ? explicitTicks : (alignmentMatch && this.showTicks),
    };
  }

  private renderBar() {
    return html`
      <svg 
        class="bar-svg"
        viewBox="0 0 ${this.BAR_WIDTH} 100" 
        preserveAspectRatio="none">
        ${this.showBackground ? this.renderBackground() : nothing}
        ${this.renderAdviceRanges()}
        ${this.renderValueBar()}
      </svg>
    `;
  }

  private renderBackground() {
    return svg`
      <rect 
        x="${this.STROKE_OFFSET}" 
        y="${this.STROKE_OFFSET}" 
        width="${this.BAR_INNER_WIDTH}" 
        height="99"
        rx="${this.CORNER_RADIUS}"
        fill="#FFF"
        stroke="var(--instrument-frame-tertiary-color, #BEBEBE)"
        stroke-width="1"
        vector-effect="non-scaling-stroke"/>
    `;
  }

  private renderAdviceRanges() {
    if (!this.advice?.length) return nothing;
    return svg`${this.advice.map(adv => this.renderSingleAdvice(adv))}`;
  }

  private renderSingleAdvice(adv: BarVerticalAdvice) {
    const isTriggered = this.value >= adv.min && this.value <= adv.max;
    const state = isTriggered ? 'triggered' : adv.state;

    const minPercent = this.valueToPercent(adv.min);
    const maxPercent = this.valueToPercent(adv.max);
    
    const top = 100 - maxPercent;
    const height = maxPercent - minPercent;

    const x = this.STROKE_OFFSET;
    const w = this.BAR_INNER_WIDTH;
    const r = this.CORNER_RADIUS;
    
    // Fully rounded rectangle for advice ranges
    const path = `
      M ${x + r} ${top}
      L ${x + w - r} ${top}
      Q ${x + w} ${top} ${x + w} ${top + r}
      L ${x + w} ${top + height - r}
      Q ${x + w} ${top + height} ${x + w - r} ${top + height}
      L ${x + r} ${top + height}
      Q ${x} ${top + height} ${x} ${top + height - r}
      L ${x} ${top + r}
      Q ${x} ${top} ${x + r} ${top}
      Z
    `;

    return svg`
      <path 
        d="${path}"
        fill="var(--instrument-frame-tertiary-color, #BEBEBE)"
        opacity="${this.ADVICE_OPACITY[state]}"
        stroke="none"/>
    `;
  }

  private renderValueBar() {
    const percent = this.valueToPercent(this.value);
    const zeroPercent = this.valueToPercent(0);
    
    if (Math.abs(percent - zeroPercent) < this.FLOAT_EPSILON) return nothing;
    
    const top = 100 - Math.max(percent, zeroPercent);
    const height = Math.abs(percent - zeroPercent);
    
    if (height <= 0) return nothing;
    
    const x = this.STROKE_OFFSET;
    const w = this.BAR_INNER_WIDTH;
    const r = this.CORNER_RADIUS;
    
    // Rectangle with straight top, rounded bottom
    const path = `
      M ${x} ${top}
      L ${x + w} ${top}
      L ${x + w} ${top + height - r}
      Q ${x + w} ${top + height} ${x + w - r} ${top + height}
      L ${x + r} ${top + height}
      Q ${x} ${top + height} ${x} ${top + height - r}
      Z
    `;
    
    return svg`
      <path 
        d="${path}"
        fill="var(--Color-Instrument-Enhanced-secondary-color, #2D548B)"
        stroke="var(--Color-Instrument-Enhanced-secondary-color, #2D548B)"
        stroke-width="1"
        vector-effect="non-scaling-stroke"/>
    `;
  }

  private renderScaleLabels() {
    if (this.primaryTickInterval <= 0) return nothing;
    
    const ticks = this.generatePrimaryTicks();
    const labels = ticks.map(tick => html`
      <div class="scale-label" style="top: ${100 - tick.position}%;">
        ${Math.round(tick.value)}
      </div>
    `);
    
    return html`<div class="scale-labels">${labels}</div>`;
  }

  private renderTickmarks() {
    if (this.primaryTickInterval <= 0) return nothing;
    
    const ticks = this.generateAllTicks();
    const tickElements = ticks.map(tick => html`
      <div class="tick-mark ${this.getTickType(tick)}" style="top: ${100 - tick.position}%;"></div>
    `);
    
    return html`<div class="tick-marks">${tickElements}</div>`;
  }

  private generatePrimaryTicks(): Tick[] {
    const ticks: Tick[] = [];
    for (let val = this.maxValue; val >= this.minValue; val -= this.primaryTickInterval) {
      ticks.push({
        value: val,
        isMain: true,
        position: this.valueToPercent(val)
      });
    }
    return ticks;
  }

  private generateAllTicks(): Tick[] {
    const primaryTicks = this.generatePrimaryTicks();
    
    if (this.secondaryTickInterval <= 0 || this.secondaryTickInterval >= this.primaryTickInterval) {
      return primaryTicks;
    }
    
    const primaryValues = new Set(primaryTicks.map(t => t.value));
    const secondaryTicks: Tick[] = [];
    
    for (let val = this.maxValue; val >= this.minValue; val -= this.secondaryTickInterval) {
      if (!primaryValues.has(val)) {
        secondaryTicks.push({
          value: val,
          isMain: false,
          position: this.valueToPercent(val)
        });
      }
    }
    
    return [...primaryTicks, ...secondaryTicks].sort((a, b) => b.value - a.value);
  }

  private getTickType(tick: Tick): string {
    const isSpecial = this.mainTickmark !== undefined && 
                      Math.abs(tick.value - this.mainTickmark) < this.FLOAT_EPSILON;
    
    if (isSpecial) return 'main-special';
    return tick.isMain ? 'main' : 'secondary';
  }

  private valueToPercent(val: number): number {
    const range = this.maxValue - this.minValue;
    return range === 0 ? 0 : ((val - this.minValue) / range) * 100;
  }

  static override styles = unsafeCSS(componentStyle);
}

declare global {
  interface HTMLElementTagNameMap {
    'obc-bar-vertical': ObcBarVertical;
  }
}