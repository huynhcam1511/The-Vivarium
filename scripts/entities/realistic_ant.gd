extends Node2D

const WALK_A: Texture2D = preload("res://assets/sprites/ant_walk_a.png")
const WALK_B: Texture2D = preload("res://assets/sprites/ant_walk_b.png")

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
var surface_patrol: bool = false

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
	sprite.texture = WALK_A
	_update_carried_sprites()

func set_grid_reference(grid: Node2D) -> void:
	grid_ref = grid

func assign_task(task_type: String, target_cell: Vector2i, target_pos: Vector2) -> bool:
	if grid_ref == null or not grid_ref.has_method("get_point_path"):
		return false
	var calculated_path: PackedVector2Array = PackedVector2Array()
	var best_length := INF
	var approach_cells: Array[Vector2i] = [target_cell]
	if task_type == "DIG":
		approach_cells.clear()
	for offset in [Vector2i.LEFT, Vector2i.RIGHT, Vector2i.UP, Vector2i.DOWN]:
		approach_cells.append(target_cell + offset)
	for cell in approach_cells:
		if not grid_ref.is_tile_walkable(cell):
			continue
		var candidate: PackedVector2Array = grid_ref.get_point_path(position, grid_ref.grid_to_world_center(cell))
		if candidate.is_empty():
			continue
		var length := position.distance_to(candidate[0])
		for i in range(1, candidate.size()):
			length += candidate[i - 1].distance_to(candidate[i])
		if length < best_length:
			best_length = length
			calculated_path = candidate
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
		position = position.move_toward(target, speed * 1.2 * delta)
		_apply_rotation_and_anim(dir, delta)

func _process_working(delta: float) -> void:
	work_timer += delta
	# Short, readable digging strokes without distorting the whole animal.
	leg_anim_phase += delta * 10.0
	sprite.texture = WALK_A if int(leg_anim_phase / PI) % 2 == 0 else WALK_B
	sprite.position.y = sin(leg_anim_phase) * 1.0

	
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
	if surface_patrol:
		position.y = _surface_foot_y(position.x) - 9.0
		target.y = position.y
	var dir = (target - position)
	var dist = absf(target.x - position.x) if surface_patrol else dir.length()
	
	if dist < 12.0:
		current_target_index = (current_target_index + 1) % waypoints.size()
		sprite.texture = WALK_A
		sprite.position.y = 0.0
		if not surface_patrol and randf() > 0.65:
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
		if surface_patrol:
			position.y = _surface_foot_y(position.x) - 9.0
		_apply_rotation_and_anim(dir, delta)

func _surface_foot_y(x: float) -> float:
	# The mound is raised above the flat meadow ground.
	if x < 650.0:
		return 880.0
	if x < 800.0:
		return lerpf(880.0, 805.0, smoothstep(650.0, 800.0, x))
	if x < 1120.0:
		return 805.0
	if x < 1310.0:
		return lerpf(805.0, 880.0, smoothstep(1120.0, 1310.0, x))
	return 880.0

const BASE_SPRITE_SCALE: Vector2 = Vector2(0.026, 0.026)

func _apply_rotation_and_anim(dir: Vector2, delta: float) -> void:
	# These illustrations are side profiles. Face the travel direction without
	# turning a walking ant vertically when a route enters a shaft.
	if absf(dir.x) > 0.08:
		sprite.flip_h = dir.x > 0.0
		_update_carried_sprites()
	rotation = lerpf(rotation, clampf(dir.y * 0.12, -0.12, 0.12), 8.0 * delta)
	leg_anim_phase += delta * 18.0
	sprite.texture = WALK_A if int(leg_anim_phase / PI) % 2 == 0 else WALK_B
	sprite.position.y = sin(leg_anim_phase) * 1.1
	sprite.scale = BASE_SPRITE_SCALE



func _update_carried_sprites() -> void:
	var mouth_x := 11.0 if sprite != null and sprite.flip_h else -11.0
	if seed_sprite:
		seed_sprite.visible = carrying_seed and not carrying_mud
		seed_sprite.position = Vector2(mouth_x, -1.0)
		seed_sprite.scale = Vector2(0.07, 0.07)
	if mud_sprite:
		mud_sprite.visible = carrying_mud
		mud_sprite.position = Vector2(mouth_x, -1.0)
		mud_sprite.scale = Vector2(0.07, 0.07)
