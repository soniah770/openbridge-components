import {LitElement, html, nothing, unsafeCSS} from 'lit';
import {property} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import componentStyle from './bar-vertical.css?inline';
import {customElement} from '../../decorator.js';
import {TemplateResult} from 'lit';
export enum BarVerticalSize {
  small = 'small',
  medium = 'medium',
  large = 'large',
}

export enum BarVerticalAlignment {
  left = 'left',
  right = 'right',
}

@customElement('obc-bar-vertical')
export class ObcBarVertical extends LitElement {
  @property({type: Number}) value = 65;
  @property({type: Number}) minValue = 0;
  @property({type: Number}) maxValue = 100;
  @property({type: String}) size: BarVerticalSize = BarVerticalSize.medium;
  @property({type: String}) alignment: BarVerticalAlignment = BarVerticalAlignment.left;
  @property({type: Boolean}) showScale = true;
  @property({type: Boolean}) showTicks = true;
  @property({type: Boolean}) showBackground = true;
  @property({type: Number}) majorTickCount = 5;
  @property({type: Number}) minorTickCount = 4;

  private getBarHeight(): number {
    const range = this.maxValue - this.minValue;
    if (range === 0) return 0;
    return ((this.value - this.minValue) / range) * 100;
  }

  private getBarBottom(): number {
    if (this.minValue >= 0) return 0;
    const range = this.maxValue - this.minValue;
    const zeroPosition = ((0 - this.minValue) / range) * 100;
    return Math.min(zeroPosition, this.getBarHeight());
  }

  private getMajorTicks(): number[] {
    const step = (this.maxValue - this.minValue) / (this.majorTickCount - 1);
    return Array.from({length: this.majorTickCount}, (_, i) => this.maxValue - (step * i));
  }

  override render() {
    const height = Math.abs(this.getBarHeight() - this.getBarBottom());
    const bottom = this.getBarBottom();

    return html`
      <div class=${classMap({wrapper: true, [this.size]: true, [this.alignment]: true})}>
        ${this.alignment === 'left' && this.showScale ? this.renderScale() : nothing}
        
        <div class="bar-container">
          ${this.showBackground ? html`<div class="background-bar"></div>` : nothing}
          <div class="bar" style="height: ${height}%; bottom: ${bottom}%;" title="${this.value}"></div>
        </div>

        ${this.alignment === 'right' && this.showScale ? this.renderScale() : nothing}
      </div>
    `;
  }

  private renderScale() {
    const majorTicks = this.getMajorTicks();
    const items : TemplateResult[] = [];
    
    majorTicks.forEach((tick, index) => {
      items.push(html`
        <div class="major-tick">
          ${this.alignment === 'right' && this.showTicks ? html`<span class="tick-mark major"></span>` : nothing}
          <span class="tick-label">${Math.round(tick)}</span>
          ${this.alignment === 'left' && this.showTicks ? html`<span class="tick-mark major"></span>` : nothing}
        </div>
      `);
      
      if (index < majorTicks.length - 1 && this.showTicks) {
        for (let i = 0; i < this.minorTickCount; i++) {
          items.push(html`<div class="minor-tick"><span class="tick-mark minor"></span></div>`);
        }
      }
    });
    
    return html`<div class="scale">${items}</div>`;
  }

  static override styles = unsafeCSS(componentStyle);
}

declare global {
  interface HTMLElementTagNameMap {
    'obc-bar-vertical': ObcBarVertical;
  }
}