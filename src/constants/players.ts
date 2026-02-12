export interface PlayerColor {
  id: string;
  label: string;
  color: string;
  textColor: string;
}

export const PLAYER_COLORS: PlayerColor[] = [
  { id: 'red',    label: 'P1', color: '#e74c3c', textColor: '#fff' },
  { id: 'blue',   label: 'P2', color: '#3498db', textColor: '#fff' },
  { id: 'orange', label: 'P3', color: '#e67e22', textColor: '#fff' },
  { id: 'white',  label: 'P4', color: '#ecf0f1', textColor: '#333' },
];
