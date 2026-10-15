declare module "p5.brush" {
  export function load(target?: any): void;
  export function scaleBrushes(scale: number): void;
  export function instance(p: any): void;
  export function set(brushName: string, color: string | any, weight: number): void;
  export function pick(brushName: string): void;
  export function stroke(color: string | number, g?: number, b?: number): void;
  export function noStroke(): void;
  export function strokeWeight(weight: number): void;
  export function fill(color: string | any, bleed?: number): void;
  export function noFill(): void;
  export function wash(color: string | any, opacity?: number): void;
  export function noWash(): void;
  export function fillBleed(bleed: number): void;
  export function fillTexture(texture: any): void;
  export function hatch(distance?: number, angle?: number, options?: any): void;
  export function noHatch(): void;
  export function hatchStyle(style: string): void;
  export function line(x1: number, y1: number, x2: number, y2: number): void;
  export function rect(x: number, y: number, w: number, h: number, mode?: string): void;
  export function circle(x: number, y: number, radius: number): void;
  export function arc(x: number, y: number, w: number, h: number, start: number, stop: number): void;
  export function spline(points: [number, number][], tension?: number): void;
  export function polygon(points: [number, number][]): void;
  export function beginShape(): void;
  export function vertex(x: number, y: number): void;
  export function endShape(mode?: string): void;
  export function field(name: string): void;
  export function noField(): void;
  export function addField(name: string, fn: any): void;
  export function seed(val: number): void;
  export function noiseSeed(val: number): void;
  export function wiggle(amount: number): void;
}

declare module "p5.brush/standalone" {
  export const DEGREES: string;
  export const RADIANS: string;
  export function createCanvas(
    width: number,
    height: number,
    options?: { pixelDensity?: number; parent?: string | HTMLElement | null; id?: string }
  ): HTMLCanvasElement;
  export function load(target?: any): void;
  export function clear(color?: string): void;
  export function render(): void;
  export function push(): void;
  export function pop(): void;
  export function translate(x: number, y: number): void;
  export function rotate(angle: number): void;
  export function scale(x: number, y?: number): void;
  export function angleMode(mode: string): void;
  export function scaleBrushes(scale: number): void;
  export function set(brushName: string, color: string | any, weight: number): void;
  export function pick(brushName: string): void;
  export function stroke(color: string | number, g?: number, b?: number): void;
  export function noStroke(): void;
  export function strokeWeight(weight: number): void;
  export function fill(color: string | any, bleed?: number): void;
  export function noFill(): void;
  export function wash(color: string | any, opacity?: number): void;
  export function noWash(): void;
  export function fillBleed(bleed: number): void;
  export function hatch(distance?: number, angle?: number, options?: any): void;
  export function noHatch(): void;
  export function hatchStyle(style: string): void;
  export function line(x1: number, y1: number, x2: number, y2: number): void;
  export function rect(x: number, y: number, w: number, h: number, mode?: string): void;
  export function circle(x: number, y: number, radius: number): void;
  export function arc(x: number, y: number, w: number, h: number, start: number, stop: number): void;
  export function spline(points: [number, number][], tension?: number): void;
  export function polygon(points: [number, number][]): void;
  export function beginShape(): void;
  export function vertex(x: number, y: number): void;
  export function endShape(mode?: string): void;
  export function field(name: string): void;
  export function noField(): void;
  export function addField(name: string, fn: any): void;
  export function seed(val: number): void;
  export function noiseSeed(val: number): void;
  export function random(min?: number, max?: number): number;
  export function noise(x: number, y?: number, z?: number): number;
}
