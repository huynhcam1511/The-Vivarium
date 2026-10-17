extends Camera2D

# Vivarium Smooth Camera Controller
var target_zoom: Vector2 = Vector2(1.0, 1.0)
var target_position: Vector2 = Vector2(540, 600)

var is_dragging: bool = false
var drag_start_mouse_pos: Vector2 = Vector2.ZERO
var drag_start_cam_pos: Vector2 = Vector2.ZERO

const MIN_Y: float = 380.0   # Top of Outworld
const MAX_Y: float = 1450.0  # Deep subterranean chambers
const MIN_ZOOM: float = 0.65
const MAX_ZOOM: float = 1.75

func _ready() -> void:
	position = target_position
	zoom = target_zoom

func _process(delta: float) -> void:
	# Smooth dampening interpolation
	position = position.lerp(target_position, 10.0 * delta)
	zoom = zoom.lerp(target_zoom, 8.0 * delta)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				is_dragging = true
				drag_start_mouse_pos = event.position
				drag_start_cam_pos = target_position
			else:
				is_dragging = false
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP:
			_adjust_zoom(1.1)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_adjust_zoom(0.9)
			
	elif event is InputEventMouseMotion and is_dragging:
		var delta_mouse = (event.position - drag_start_mouse_pos) / zoom.x
		target_position.y = clamp(drag_start_cam_pos.y - delta_mouse.y, MIN_Y, MAX_Y)
		target_position.x = clamp(drag_start_cam_pos.x - delta_mouse.x, 480.0, 600.0)

func _adjust_zoom(factor: float) -> void:
	var new_scale = clamp(target_zoom.x * factor, MIN_ZOOM, MAX_ZOOM)
	target_zoom = Vector2(new_scale, new_scale)

func go_to_outworld() -> void:
	target_position = Vector2(540, 480)

func go_to_formicarium() -> void:
	target_position = Vector2(540, 1380)

func reset_camera() -> void:
	target_position = Vector2(540, 750)
	target_zoom = Vector2(1.0, 1.0)
