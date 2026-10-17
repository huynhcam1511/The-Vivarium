extends Camera2D
class_name VivariumCamera

# The Vivarium - Smooth 2.5D Landscape Camera Controller
# Decoupled navigation: Pan with RMB/MMB or WASD, Zoom with Wheel, Presets 1/2/3

var target_zoom: Vector2 = Vector2(1.0, 1.0)
var target_position: Vector2 = Vector2(960, 720)

var is_panning: bool = false
var pan_start_mouse_pos: Vector2 = Vector2.ZERO
var pan_start_cam_pos: Vector2 = Vector2.ZERO

const MIN_X: float = 640.0
const MAX_X: float = 1280.0
const MIN_Y: float = 360.0   # Canopy & Wild Honeycomb (Top)
const MAX_Y: float = 1440.0  # Deep subterranean chambers (Bottom)
const MIN_ZOOM: float = 0.55
const MAX_ZOOM: float = 1.75

const KEYBOARD_PAN_SPEED: float = 650.0

func _ready() -> void:
	position = target_position
	zoom = target_zoom
	print("[VivariumCamera] 16:9 Landscape Camera active. X bounds: [%.0f, %.0f], Y bounds: [%.0f, %.0f]" % [
		MIN_X, MAX_X, MIN_Y, MAX_Y
	])

func _process(delta: float) -> void:
	# 1. Keyboard pan (WASD or Arrow keys)
	var input_dir = Vector2.ZERO
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		input_dir.x -= 1.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		input_dir.x += 1.0
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP):
		input_dir.y -= 1.0
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN):
		input_dir.y += 1.0

	if input_dir != Vector2.ZERO:
		target_position += input_dir.normalized() * (KEYBOARD_PAN_SPEED / zoom.x) * delta
		_clamp_target_position()

	# 2. Smooth damping interpolation
	position = position.lerp(target_position, 10.0 * delta)
	zoom = zoom.lerp(target_zoom, 8.0 * delta)

func _unhandled_input(event: InputEvent) -> void:
	# Mouse panning via Right Click or Middle Click
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_RIGHT or event.button_index == MOUSE_BUTTON_MIDDLE:
			if event.pressed:
				is_panning = true
				pan_start_mouse_pos = event.position
				pan_start_cam_pos = target_position
			else:
				is_panning = false
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP:
			_adjust_zoom(1.12)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_adjust_zoom(0.88)
			
	elif event is InputEventMouseMotion and is_panning:
		var delta_mouse = (event.position - pan_start_mouse_pos) / zoom.x
		target_position.x = pan_start_cam_pos.x - delta_mouse.x
		target_position.y = pan_start_cam_pos.y - delta_mouse.y
		_clamp_target_position()

	# Quick Hotkeys for Bookmarks
	elif event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_1:
				go_to_canopy()
			KEY_2:
				go_to_outworld()
			KEY_3:
				go_to_formicarium()
			KEY_R:
				reset_camera()

func _clamp_target_position() -> void:
	target_position.x = clamp(target_position.x, MIN_X, MAX_X)
	target_position.y = clamp(target_position.y, MIN_Y, MAX_Y)

func _adjust_zoom(factor: float) -> void:
	var new_scale = clamp(target_zoom.x * factor, MIN_ZOOM, MAX_ZOOM)
	target_zoom = Vector2(new_scale, new_scale)

# --- QUICK BOOKMARK METHODS ---

func go_to_canopy() -> void:
	target_position = Vector2(960, 420)

func go_to_outworld() -> void:
	target_position = Vector2(960, 720)

func go_to_formicarium() -> void:
	target_position = Vector2(960, 1380)

func reset_camera() -> void:
	target_position = Vector2(960, 720)
	target_zoom = Vector2(1.0, 1.0)
