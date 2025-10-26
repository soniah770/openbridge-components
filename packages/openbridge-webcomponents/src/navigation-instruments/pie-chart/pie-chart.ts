import {LitElement, html, svg, SVGTemplateResult, unsafeCSS} from 'lit';
import {customElement} from '../../decorator.js';
import {property} from 'lit/decorators.js';
import componentStyle from './pie-chart.css?inline';

export interface PieSegment {
  value: number;
  label?: string;
  color?: string;
}

export enum ObcPieChartType {
  filled = 'filled',
  ring = 'ring',
}

interface SegmentData {
  segment: PieSegment;
  startAngle: number;
  endAngle: number;
  percentage: number;
  color: string;
}

interface ArcPathParams {
  outerRadius: number;
  innerRadius: number;
  startAngle: number;
  endAngle: number;
}

const CHART_CONSTANTS = {
  RADIUS_MULTIPLIER: 0.9,
  RING_GAP: 5,
  OUTER_RING_EXTRA_SPACE: 60,
  LABEL_RADIUS_MULTIPLIER: 0.7,
  START_ANGLE: -90,
  FULL_CIRCLE: 360,
  HALF_CIRCLE: 180,
  STROKE_WIDTH: 1,
  OUTER_STROKE_WIDTH: 2,
} as const;

@customElement('obc-pie-chart')
export class ObcPieChart extends LitElement {
  @property({type: Array, attribute: false}) segments: PieSegment[] = [];
  @property({type: Array, attribute: false}) outerSegments: PieSegment[] = [];
  @property({type: String}) type: ObcPieChartType = ObcPieChartType.filled;
  @property({type: Boolean}) hasSector3: boolean | undefined = undefined;
  @property({type: Boolean}) hasSector4: boolean | undefined = undefined;
  @property({type: Boolean}) hasSector5: boolean | undefined = undefined;
  @property({type: Boolean}) showLabels: boolean = false;
  @property({type: Boolean}) showValues: boolean = false;
  @property({type: Boolean}) showContainer: boolean = false;
  @property({type: Number}) size: number = 256;
  @property({type: Number}) containerSize: number = 304;
  @property({type: Number}) ringThickness: number = 40;
  @property({type: Number}) outerRingThickness: number = 20;

  private get CENTER(): number {
    return this.size / 2;
  }

  private get RADIUS(): number {
    return (this.size / 2) * CHART_CONSTANTS.RADIUS_MULTIPLIER;
  }

  private get colors(): string[] {
    return [
      'var(--Color-Base-Blue-600, #1D3C67)',
      'var(--Color-Base-Blue-500, #2D548B)',
      'var(--Color-Base-Blue-400, #4271B3)',
      'var(--Color-Base-Blue-300, #5D8FD5)',
      'var(--Color-Base-Blue-200, #9CC1F5)',
      'var(--Color-Base-Blue-100, #CADEFC)',
      'var(--Color-Base-Blue-050, #E4EEFD)',
    ];
  }

  private generateFigmaSegments(): PieSegment[] {
    const figmaSegments: PieSegment[] = [
      {value: 50, color: this.colors[0]},
      {value: 25, color: this.colors[1]},
    ];

    if (this.hasSector3) figmaSegments.push({value: 12.5, color: this.colors[2]});
    if (this.hasSector4) figmaSegments.push({value: 12.5, color: this.colors[3]});
    if (this.hasSector5) figmaSegments.push({value: 6.25, color: this.colors[4]});

    return figmaSegments;
  }

  private get isFigmaMode(): boolean {
    return this.hasSector3 !== undefined || this.hasSector4 !== undefined || this.hasSector5 !== undefined;
  }

  private get computedSegments(): PieSegment[] {
    return this.isFigmaMode ? this.generateFigmaSegments() : this.segments;
  }

  private calculateSegmentData(segments: PieSegment[], totalArcAngle: number = CHART_CONSTANTS.FULL_CIRCLE): SegmentData[] {
    if (!segments.length) return [];

    const total = segments.reduce((sum, seg) => sum + seg.value, 0);
    if (total === 0) return [];

    let currentAngle = CHART_CONSTANTS.START_ANGLE;

    return segments.map((segment, index) => {
      const percentage = (segment.value / total) * 100;
      const angle = (segment.value / total) * totalArcAngle;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      const color = segment.color || this.colors[index % this.colors.length];

      currentAngle = endAngle;

      return {segment, startAngle, endAngle, percentage, color};
    });
  }

  private calculateSegments(): SegmentData[] {
    return this.calculateSegmentData(this.computedSegments);
  }

  private calculateOuterSegments(): SegmentData[] {
    return this.calculateSegmentData(this.outerSegments, CHART_CONSTANTS.HALF_CIRCLE);
  }

  private polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number): {x: number; y: number} {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  }

  private isFullCircle(startAngle: number, endAngle: number): boolean {
    return Math.abs(endAngle - startAngle) >= CHART_CONSTANTS.FULL_CIRCLE;
  }

  private getLargeArcFlag(startAngle: number, endAngle: number): '0' | '1' {
    return endAngle - startAngle <= CHART_CONSTANTS.HALF_CIRCLE ? '0' : '1';
  }

  private createRingPath(params: ArcPathParams): string {
    const {outerRadius, innerRadius, startAngle, endAngle} = params;

    const outerStart = this.polarToCartesian(this.CENTER, this.CENTER, outerRadius, endAngle);
    const outerEnd = this.polarToCartesian(this.CENTER, this.CENTER, outerRadius, startAngle);
    const innerStart = this.polarToCartesian(this.CENTER, this.CENTER, innerRadius, endAngle);
    const innerEnd = this.polarToCartesian(this.CENTER, this.CENTER, innerRadius, startAngle);
    const largeArcFlag = this.getLargeArcFlag(startAngle, endAngle);

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y}`,
      'Z',
    ].join(' ');
  }

  private renderFilledSegment(segmentData: SegmentData): SVGTemplateResult {
    const {startAngle, endAngle, color} = segmentData;

    if (this.isFullCircle(startAngle, endAngle)) {
      return svg`
        <circle cx="${this.CENTER}" cy="${this.CENTER}" r="${this.RADIUS}" fill="${color}"
          stroke="var(--Color-Container-Background-color, #F7F7F7)" stroke-width="${CHART_CONSTANTS.STROKE_WIDTH}" />
      `;
    }

    const start = this.polarToCartesian(this.CENTER, this.CENTER, this.RADIUS, endAngle);
    const end = this.polarToCartesian(this.CENTER, this.CENTER, this.RADIUS, startAngle);
    const largeArcFlag = this.getLargeArcFlag(startAngle, endAngle);

    const d = [
      `M ${this.CENTER} ${this.CENTER}`,
      `L ${start.x} ${start.y}`,
      `A ${this.RADIUS} ${this.RADIUS} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      'Z',
    ].join(' ');

    return svg`
      <path d="${d}" fill="${color}" class="segment"
        stroke="var(--Color-Container-Background-color, #F7F7F7)" stroke-width="${CHART_CONSTANTS.STROKE_WIDTH}" />
    `;
  }

  private renderRingSegment(segmentData: SegmentData): SVGTemplateResult {
    const {startAngle, endAngle, color} = segmentData;
    const outerRadius = this.RADIUS;
    const innerRadius = this.RADIUS - this.ringThickness;

    if (this.isFullCircle(startAngle, endAngle)) {
      return svg`
        <circle cx="${this.CENTER}" cy="${this.CENTER}" r="${outerRadius}" fill="none"
          stroke="${color}" stroke-width="${this.ringThickness}" class="segment" />
      `;
    }

    const pathData = this.createRingPath({outerRadius, innerRadius, startAngle, endAngle});

    return svg`
      <path d="${pathData}" fill="${color}" class="segment"
        stroke="var(--Color-Container-Background-color, #F7F7F7)" stroke-width="${CHART_CONSTANTS.STROKE_WIDTH}" />
    `;
  }

  private renderOuterRingSegment(segmentData: SegmentData): SVGTemplateResult {
    const {startAngle, endAngle, color} = segmentData;
    const outerRadius = this.RADIUS + this.outerRingThickness + CHART_CONSTANTS.RING_GAP;
    const innerRadius = this.RADIUS + CHART_CONSTANTS.RING_GAP;

    const pathData = this.createRingPath({outerRadius, innerRadius, startAngle, endAngle});

    return svg`
      <path d="${pathData}" fill="${color}" class="segment outer-segment"
        stroke="var(--Color-Container-Background-color, #F7F7F7)" stroke-width="${CHART_CONSTANTS.OUTER_STROKE_WIDTH}" />
    `;
  }

  private getSegmentDisplayText(segment: PieSegment): string {
    const hasLabel = this.showLabels && segment.label;
    const hasValue = this.showValues;

    if (hasLabel && hasValue) return `${segment.label}: ${segment.value}`;
    if (hasLabel) return segment.label!;
    if (hasValue) return `${segment.value}`;
    return '';
  }

  private getLabelRadius(): number {
    return this.type === ObcPieChartType.ring
      ? this.RADIUS - this.ringThickness / 2
      : this.RADIUS * CHART_CONSTANTS.LABEL_RADIUS_MULTIPLIER;
  }

  private renderLabel(segmentData: SegmentData): SVGTemplateResult | null {
    if (!this.showLabels && !this.showValues) return null;

    const displayText = this.getSegmentDisplayText(segmentData.segment);
    if (!displayText) return null;

    const {startAngle, endAngle} = segmentData;
    const midAngle = (startAngle + endAngle) / 2;
    const pos = this.polarToCartesian(this.CENTER, this.CENTER, this.getLabelRadius(), midAngle);

    return svg`
      <text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="middle" class="label">
        ${displayText}
      </text>
    `;
  }

  private getSvgDimensions(): {size: number; center: number} {
    const hasOuterSegments = this.outerSegments.length > 0;
    const size = hasOuterSegments ? this.size + CHART_CONSTANTS.OUTER_RING_EXTRA_SPACE : this.size;
    return {size, center: size / 2};
  }

  private renderBackground(svgCenter: number): SVGTemplateResult | null {
    if (this.type !== ObcPieChartType.filled) return null;

    return svg`
      <circle cx="${svgCenter}" cy="${svgCenter}" r="${this.RADIUS}" class="background" fill="transparent"
        stroke="var(--Color-Container-Background-color, #F7F7F7)" stroke-width="${CHART_CONSTANTS.STROKE_WIDTH}" />
    `;
  }

  private renderSegments(segmentsData: SegmentData[]): SVGTemplateResult {
    const renderMethod = this.type === ObcPieChartType.ring
      ? this.renderRingSegment.bind(this)
      : this.renderFilledSegment.bind(this);

    return svg`<g class="segments">${segmentsData.map(renderMethod)}</g>`;
  }

  private renderOuterSegments(outerSegmentsData: SegmentData[]): SVGTemplateResult | null {
    if (outerSegmentsData.length === 0) return null;
    return svg`<g class="outer-segments">${outerSegmentsData.map((data) => this.renderOuterRingSegment(data))}</g>`;
  }

  private renderLabels(segmentsData: SegmentData[]): SVGTemplateResult | null {
    if (!this.showLabels && !this.showValues) return null;
    return svg`<g class="labels">${segmentsData.map((data) => this.renderLabel(data))}</g>`;
  }

  override render() {
    const segmentsData = this.calculateSegments();
    const outerSegmentsData = this.calculateOuterSegments();
    const {size: svgSize, center: svgCenter} = this.getSvgDimensions();

    const chart = html`
      <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">
        ${this.renderBackground(svgCenter)}
        <g transform="translate(${svgCenter - this.CENTER}, ${svgCenter - this.CENTER})">
          ${this.renderSegments(segmentsData)}
          ${this.renderOuterSegments(outerSegmentsData)}
          ${this.renderLabels(segmentsData)}
        </g>
      </svg>
    `;

    return this.showContainer
      ? html`<div class="container-wrapper" style="width: ${this.containerSize}px; height: ${this.containerSize}px;">${chart}</div>`
      : html`<div class="pie-container">${chart}</div>`;
  }

  static override styles = unsafeCSS(componentStyle);
}

declare global {
  interface HTMLElementTagNameMap {
    'obc-pie-chart': ObcPieChart;
  }
}