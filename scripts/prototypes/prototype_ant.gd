@tool
class_name PrototypeAnt
extends Node2D

@export var move_speed: float = 65.0
@export var ant_color: Color = Color(1.0, 1.0, 1.0, 1.0)

@onready var sprite: Sprite2D = $Sprite2D
@onready var shadow: Sprite2D = $Shadow

var current_path: Array[Vector2] = []
var path_index: int = 0
var is_moving: bool = false
var walk_time: float = 0.0

signal path_completed

func _ready() -> void:
	if sprite:
		# Calibrated for tunnel height (~48-56px), with linear mipmaps
		sprite.scale = Vector2(0.065, 0.065)
		sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
		# Warm amber chitin highlight so it pops against dark subterranean cavities
		sprite.self_modulate = Color(1.2, 1.15, 1.05, 1.0)
	if shadow:
		shadow.scale = Vector2(0.055, 0.025)
		shadow.modulate = Color(0.0, 0.0, 0.0, 0.45)

func _process(delta: float) -> void:
	if is_moving and path_index < current_path.size():
		var target: Vector2 = current_path[path_index]
		var dist: float = global_position.distance_to(target)
		var step: float = move_speed * delta

		if dist <= step:
			global_position = target
			path_index += 1
			if path_index >= current_path.size():
				is_moving = false
				path_completed.emit()
		else:
			var dir: Vector2 = (target - global_position).normalized()
			global_position += dir * step
			# Smoothly orient towards movement direction
			rotation = lerp_angle(rotation, dir.angle(), 12.0 * delta)

		# Walking wiggle animation
		walk_time += delta * 14.0
		sprite.scale.y = 0.048 + sin(walk_time) * 0.003
		sprite.scale.x = 0.048 + cos(walk_time) * 0.002
	else:
		# Idle breathing
		walk_time += delta * 2.5
		sprite.scale.y = 0.048 + sin(walk_time) * 0.001

func follow_path(world_points: Array[Vector2]) -> void:
	if world_points.is_empty():
		return
	current_path = world_points
	path_index = 0
	is_moving = true
