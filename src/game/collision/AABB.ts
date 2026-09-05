import type { Rect } from '../types/game';

/**
 * AABB (Axis-Aligned Bounding Box) 碰撞检测工具函数
 */
export function intersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * 判断两个矩形是否有接触或距离极其微小
 */
export function contains(container: Rect, target: Rect): boolean {
  return (
    target.x >= container.x &&
    target.y >= container.y &&
    target.x + target.width <= container.x + container.width &&
    target.y + target.height <= container.y + container.height
  );
}
