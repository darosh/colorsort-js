export type PaletteType = {
  Kl: number
  Kc: number
  Kh: number
  type: string
  data: TypeVariances & {
    lightnessRange: number
    chromaRange: number
    hueSpread: number
  }
}
export type MetricsEx<T> = {
  totalDistance: T
  avgAngleChange: T
  maxAngleChange: T
  meanDistance: T
  devDistance: T
  totalCurveDistance: T
  meanCurveDistance: T
  devCurveDistance: T
  lchAvgChange: MetricsLch<T>
  lchMaxChange: MetricsLch<T>
  lchDeviation: MetricsLch<T>
  curveRatio: T
  perceptualUniformity: T
  curveUniformity: T
  harmonicScore: T
  harmonicCurveScore: T
}
export type Method = {
  name: string;
  fn: Function;
  speed: number;
  mid: string;
  description: {
    model: any;
    method: any;
    diff: any;
  };
};
export type PaletteGroup = {
  record: SortRecordGrouped;
  methods: {
    index: number;
    best: boolean;
    method: Method;
    time: number;
    render: Function;
  }[];
};
export type PaletteRecord = {
  key: string;
  index: number;
  colors: string[];
  type: PaletteType;
  records: SortRecord[];
  metricsRange: MetricsEx<[number, number]> | null;
  gram: [number, number, number, number][];
}
export type PaletteRecordGrouped = PaletteRecord & {
  groups: PaletteGroup[];
}
export type SortRecord = {
  index: number;
  colors: string[] | null;
  time: number | null;
  palette: PaletteRecord | PaletteRecordGrouped;
  method: Method;
  metrics: MetricsEx<number> | null;
  quality: MetricsEx<number> | null;
  score: number | null;
  render: Function;
  best: boolean;
  bestDistance: number | null;
  bestDistanceQuality: number | null;
}
export type SortRecordGrouped = Omit<SortRecord, 'time' | 'method' | 'render' | 'index' | 'best'>;
