export interface LockerPosition {
  id: string;
  defaultLabel: string;
  row: number;
  col: number;
  width?: number; // grid column span
  height?: number; // grid row span
}

export interface LockerSection {
  id: string;
  name: string;
  layout: 'grid' | 'column' | 'row';
  gridCols?: number;
  lockers: LockerPosition[];
}

export interface LockerZone {
  id: string;
  name: string;
  sections: LockerSection[];
}
