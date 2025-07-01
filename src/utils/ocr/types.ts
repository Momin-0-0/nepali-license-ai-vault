
export interface OCRProgress {
  status: string;
  progress: number;
}

export interface NepalLicenseRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NepalLicenseRegions {
  topLeft: NepalLicenseRegion;
  topRight: NepalLicenseRegion;
  centerLeft: NepalLicenseRegion;
  centerRight: NepalLicenseRegion;
  bottom: NepalLicenseRegion;
}

export interface WordData {
  text: string;
  confidence: number;
  bbox: any;
}

export interface LineData {
  text: string;
  confidence: number;
  bbox: any;
}
