extends Node2D

# Realistic Worker Ant Controller (Camponotus / Messor)
# Supports:
# 1. Waypoint patrol loops (Legacy fallback)
# 2. Dynamic AStarGrid2D pathfinding via SubterraneanGrid
# 3. Dynamic tasks: Walking to dig site, excavating, walking to fill site, carrying mud/seeds

@export var speed: float = 48.0
@export var role: String = "forager" # "nurse", "forager", "builder", "excavator"

var waypoints: Array[Vector2] = []
var current_target_index: int = 0
var leg_anim_phase: float = 0.0
var carrying_seed: bool = false
var carrying_mud: bool = false

# Dynamic AStar Navigation
var path: PackedVector2Array = PackedVector2Array()
var path_index: int = 0
var grid_ref: Node2D = null

# Active Task State: "PATROL", "MOVING_TO_TASK", "WORKING"
var task_state: String = "PATROL"
var current_task_type: String = "NONE" # "DIG" or "FILL"
var task_target_cell: Vector2i = Vector2i(-1, -1)
var work_timer: float = 0.0

@onready var sprite: Sprite2D = $Sprite2D
@onready var seed_sprite: Sprite2D = $SeedSprite
@onready var mud_sprite: Sprite2D = $MudSprite

func _ready() -> void:
	var scale_var = randf_range(0.85, 1.15)
	scale = Vector2(scale_var, scale_var)
	_update_carried_sprites()

func set_grid_reference(grid: Node2D) -> void:
	grid_ref = grid

func assign_task(task_type: String, target_cell: Vector2i, target_pos: Vector2) -> bool:
	if grid_ref == null or not grid_ref.has_method("get_point_path"):
		return false
	
	var calculated_path: PackedVector2Array = grid_ref.get_point_path(position, target_pos)
	if calculated_path.size() > 0:
		path = calculated_path
		path_index = 0
		task_state = "MOVING_TO_TASK"
		current_task_type = task_type
		task_target_cell = target_cell
		work_timer = 0.0
		return true
	return false

func _process(delta: float) -> void:
	match task_state:
		"MOVING_TO_TASK":
			_process_path_movement(delta)
		"WORKING":
			_process_working(delta)
		"PATROL":
			_process_patrol(delta)

func _process_path_movement(delta: float) -> void:
	if path.size() == 0 or path_index >= path.size():
		task_state = "WORKING"
		work_timer = 0.0
		return
		
	var target = path[path_index]
	var dir = (target - position)
	var dist = dir.length()
	
	if dist < 12.0:
		path_index += 1
		if path_index >= path.size():
			task_state = "WORKING"
			work_timer = 0.0
			return
	else:
		dir = dir.normalized()
		position += dir * speed * 1.2 * delta
		_apply_rotation_and_anim(dir, delta)

func _process_working(delta: float) -> void:
	work_timer += delta
	# Subtle excavating wiggle
	if sprite:
		sprite.scale.x = BASE_SPRITE_SCALE.x * (1.0 + sin(leg_anim_phase) * 0.12)
		sprite.scale.y = BASE_SPRITE_SCALE.y

	
	if work_timer >= 1.2:
		# Complete task on subterranean_grid
		if grid_ref != null:
			if current_task_type == "DIG" and grid_ref.has_method("complete_dig"):
				grid_ref.complete_dig(task_target_cell)
				carrying_mud = true
				carrying_seed = false
				_update_carried_sprites()
				GameManager.clay_mud += 1
				GameManager.emit_signal("colony_event", "⛏️ Kiến thợ đã cắn vỡ ô đất và tha lên 1 viên bùn đất (+1 Bùn)!")
				GameManager.emit_signal("resources_updated")
			elif current_task_type == "FILL" and grid_ref.has_method("complete_fill"):
				if GameManager.clay_mud >= 1:
					GameManager.clay_mud -= 1
					grid_ref.complete_fill(task_target_cell)
					carrying_mud = false
					_update_carried_sprites()
					GameManager.emit_signal("colony_event", "🧱 Kiến thợ đã mang bùn đất đắp kín một ô hầm (-1 Bùn)!")
					GameManager.emit_signal("resources_updated")
				else:
					GameManager.emit_signal("colony_event", "⚠️ Thiếu bùn đất để lấp hầm! Đàn kiến cần đào thêm đất sét.")
		
		# Reset to patrol
		task_state = "PATROL"
		current_task_type = "NONE"
		task_target_cell = Vector2i(-1, -1)
		path.clear()

func _process_patrol(delta: float) -> void:
	if waypoints.size() == 0:
		return
		
	var target = waypoints[current_target_index]
	var dir = (target - position)
	var dist = dir.length()
	
	if dist < 12.0:
		current_target_index = (current_target_index + 1) % waypoints.size()
		if randf() > 0.65:
			if role == "builder" or role == "excavator":
				carrying_mud = !carrying_mud
				carrying_seed = false
			else:
				carrying_seed = !carrying_seed
				carrying_mud = false
			_update_carried_sprites()
	else:
		dir = dir.normalized()
		position += dir * speed * delta
		_apply_rotation_and_anim(dir, delta)

const BASE_SPRITE_SCALE: Vector2 = Vector2(0.045, 0.045)

func _apply_rotation_and_anim(dir: Vector2, delta: float) -> void:
	var target_angle = dir.angle() + PI / 2.0
	rotation = lerp_angle(rotation, target_angle, 8.0 * delta)
	leg_anim_phase += delta * 12.0
	if sprite:
		sprite.scale.x = BASE_SPRITE_SCALE.x * (1.0 + sin(leg_anim_phase) * 0.06)
		sprite.scale.y = BASE_SPRITE_SCALE.y


func _update_carried_sprites() -> void:
	if seed_sprite:
		seed_sprite.visible = carrying_seed and not carrying_mud
	if mud_sprite:
		mud_sprite.visible = carrying_mud
