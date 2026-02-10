// Resource type constants and color mappings

import { ResourceType } from '@/types/board';

export const RESOURCE_COLORS: Record<ResourceType, string> = {
  wheat: '#f4d03f',
  wood: '#2d5016',
  brick: '#c0392b',
  ore: '#7f8c8d',
  sheep: '#a8e6cf',
  desert: '#f5deb3',
};

export const RESOURCE_NAMES: Record<ResourceType, string> = {
  wheat: 'Wheat',
  wood: 'Wood',
  brick: 'Brick',
  ore: 'Ore',
  sheep: 'Sheep',
  desert: 'Desert',
};

export const RESOURCE_ICONS: Record<ResourceType, string> = {
  wheat: '🌾',
  wood: '🪵',
  brick: '🧱',
  ore: '⛏️',
  sheep: '🐑',
  desert: '🏜️',
};
