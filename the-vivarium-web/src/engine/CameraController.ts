import { Container } from 'pixi.js';
import type { Vector2D } from '../types';

export class CameraController {
  stage: Container;
  viewportWidth: number = window.innerWidth;
  viewportHeight: number = window.innerHeight;

  // Camera world coordinates (where camera is centered)
  x: number = 960;
  y: number = 720;

  // Zoom scale
  zoom: number = 0.82;
  targetZoom: number = 0.82;
  minZoom: number = 0.45;
  maxZoom: number = 2.4;

  // World boundary constraints
  readonly worldMinX: number = 0;
  readonly worldMaxX: number = 1920;
  readonly worldMinY: number = 0;
  readonly worldMaxY: number = 1440; // 640 surface + 800 subterranean

  // Drag pan state
  isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private cameraStartX: number = 0;
  private cameraStartY: number = 0;

  // Keyboard state
  private keysDown: Set<string> = new Set();

  constructor(stage: Container) {
    this.stage = stage;
    this.setupListeners();
  }

  setViewportSize(w: number, h: number): void {
    this.viewportWidth = w;
    this.viewportHeight = h;
    this.updateTransform();
  }

  private setupListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keysDown.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
    });

    window.addEventListener('resize', () => {
      this.setViewportSize(window.innerWidth, window.innerHeight);
    });
  }

  handleMouseDown(screenX: number, screenY: number, button: number): void {
    if (button === 1 || button === 2) {
      // Middle click or Right click starts camera drag
      this.isDragging = true;
      this.dragStartX = screenX;
      this.dragStartY = screenY;
      this.cameraStartX = this.x;
      this.cameraStartY = this.y;
    }
  }

  handleMouseMove(screenX: number, screenY: number): void {
    if (this.isDragging) {
      const dx = (screenX - this.dragStartX) / this.zoom;
      const dy = (screenY - this.dragStartY) / this.zoom;
      this.x = this.cameraStartX - dx;
      this.y = this.cameraStartY - dy;
      this.clampCamera();
      this.updateTransform();
    }
  }

  handleMouseUp(): void {
    this.isDragging = false;
  }

  handleWheel(screenX: number, screenY: number, deltaY: number): void {
    // Zoom centered on mouse cursor position in world space
    const worldBeforeZoom = this.screenToWorld({ x: screenX, y: screenY });

    const zoomFactor = deltaY < 0 ? 1.15 : 0.87;
    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * zoomFactor));
    this.zoom = this.targetZoom;

    // Reposition camera so the point under cursor remains under cursor
    const worldAfterZoom = this.screenToWorld({ x: screenX, y: screenY });
    this.x += worldBeforeZoom.x - worldAfterZoom.x;
    this.y += worldBeforeZoom.y - worldAfterZoom.y;

    this.clampCamera();
    this.updateTransform();
  }

  update(delta: number): void {
    let dx = 0;
    let dy = 0;
    const moveSpeed = 800 * delta * (1 / this.zoom);

    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) dy -= moveSpeed;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) dy += moveSpeed;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) dx -= moveSpeed;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) dx += moveSpeed;

    if (dx !== 0 || dy !== 0) {
      this.x += dx;
      this.y += dy;
      this.clampCamera();
      this.updateTransform();
    }
  }

  jumpTo(worldX: number, worldY: number, targetZoom?: number): void {
    this.x = worldX;
    this.y = worldY;
    if (targetZoom !== undefined) {
      this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, targetZoom));
    }
    this.clampCamera();
    this.updateTransform();
  }

  private clampCamera(): void {
    this.x = Math.max(this.worldMinX, Math.min(this.worldMaxX, this.x));
    this.y = Math.max(this.worldMinY, Math.min(this.worldMaxY, this.y));
  }

  updateTransform(): void {
    this.stage.scale.set(this.zoom);
    // Center stage on viewport
    this.stage.position.set(
      this.viewportWidth * 0.5 - this.x * this.zoom,
      this.viewportHeight * 0.5 - this.y * this.zoom
    );
  }

  screenToWorld(screenPos: Vector2D): Vector2D {
    return {
      x: (screenPos.x - this.viewportWidth * 0.5) / this.zoom + this.x,
      y: (screenPos.y - this.viewportHeight * 0.5) / this.zoom + this.y,
    };
  }
}
