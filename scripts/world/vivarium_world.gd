extends Node2D

# The Vivarium - World Controller (16:9 Landscape Ecosystem)
const ANT_SCENE = preload("res://scenes/entities/realistic_ant.tscn")
const BEE_SCENE = preload("res://scenes/entities/realistic_bee.tscn")
const SUBTERRANEAN_GRID_SCRIPT = preload("res://scripts/world/subterranean_grid.gd")

@onready var entities_node: Node2D = $Entities
var subterranean_grid: Node2D = null

# Waypoint loops for realistic ant patrols inside 1920x1800 formicarium
var tunnel_path_royal_to_nursery: Array[Vector2] = [
	Vector2(960, 1120), # Royal chamber center
	Vector2(700, 1130), # Left tunnel entrance
	Vector2(580, 1170), # Mid left tunnel
	Vector2(480, 1250),
	Vector2(460, 1380), # Brood Nursery
	Vector2(500, 1340),
	Vector2(700, 1130)
]

var tunnel_path_royal_to_granary: Array[Vector2] = [
	Vector2(960, 1120), # Royal chamber center
	Vector2(1220, 1130), # Right tunnel entrance
	Vector2(1380, 1220), # Mid right tunnel
	Vector2(1460, 1380), # Granary vault
	Vector2(1400, 1260),
	Vector2(1180, 1130)
]

var outworld_ant_path: Array[Vector2] = [
	Vector2(190, 880),
	Vector2(460, 880),
	Vector2(780, 805),
	Vector2(960, 805),
	Vector2(1240, 850),
	Vector2(1550, 880),
	Vector2(1900, 880),
	Vector2(2240, 880)
]

var _work_timer: float = 0.0
var _frame_count: int = 0
var _screenshot_taken: bool = false

func _ready() -> void:
	_init_subterranean_grid()
	_spawn_initial_ants()
	_spawn_initial_bees()
	print("[The Vivarium] Landscape World loaded with Subterranean Grid (80x26).")

func _init_subterranean_grid() -> void:
	subterranean_grid = SUBTERRANEAN_GRID_SCRIPT.new()
	subterranean_grid.z_index = 2
	add_child(subterranean_grid)

func _process(delta: float) -> void:
	if not _screenshot_taken:
		_frame_count += 1
		if _frame_count >= 60:
			_screenshot_taken = true
			capture_in_engine_screenshot()

	_work_timer += delta
	if _work_timer >= 2.0:
		_work_timer = 0.0
		_process_ant_construction_tasks()

func capture_in_engine_screenshot() -> String:
	if DisplayServer.get_name() == "headless":
		return ""
	var viewport = get_viewport()
	if viewport == null or viewport.get_texture() == null:
		return ""
	var img = viewport.get_texture().get_image()
	if img == null:
		return ""
	var save_path = "C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/stylized_2d_in_engine_main_gameplay.png"
	var err = img.save_png(save_path)
	img.save_png("C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/in_engine_main_gameplay.png")
	print("[Screenshot] Stylized 2D gameplay screenshot saved: ", err == OK, " at ", save_path)
	return save_path

func _process_ant_construction_tasks() -> void:
	if subterranean_grid == null or not subterranean_grid.has_method("get_next_dig_target"):
		return
		
	# 1. Tìm nhiệm vụ đào hầm (Dig)
	var dig_target = subterranean_grid.get_next_dig_target()
	if dig_target != Vector2i(-1, -1):
		var target_world = subterranean_grid.grid_to_world_center(dig_target)
		if not _task_already_assigned("DIG", dig_target):
			_dispatch_nearest_idle_ant("DIG", dig_target, target_world)
		return
		
	# 2. Tìm nhiệm vụ lấp hầm (Fill)
	if not subterranean_grid.has_method("get_next_fill_target"):
		return
	var fill_target = subterranean_grid.get_next_fill_target()
	if fill_target != Vector2i(-1, -1):
		if GameManager.clay_mud >= 1:
			var target_world = subterranean_grid.grid_to_world_center(fill_target)
			if not _task_already_assigned("FILL", fill_target):
				_dispatch_nearest_idle_ant("FILL", fill_target, target_world)
		else:
			GameManager.emit_signal("colony_event", "⚠️ Thiếu bùn đất để lấp hầm! Đàn kiến cần đào thêm đất sét.")

func _task_already_assigned(task_type: String, cell: Vector2i) -> bool:
	for child in entities_node.get_children():
		if child.has_method("assign_task") and child.task_state != "PATROL" and child.current_task_type == task_type and child.task_target_cell == cell:
			return true
	return false

func _dispatch_nearest_idle_ant(task_type: String, cell: Vector2i, target_pos: Vector2) -> bool:
	var candidates: Array[Node] = []
	for child in entities_node.get_children():
		if child.has_method("assign_task") and child.task_state == "PATROL" and not child.surface_patrol:
			candidates.append(child)
	candidates.sort_custom(func(a: Node, b: Node) -> bool: return a.position.distance_squared_to(target_pos) < b.position.distance_squared_to(target_pos))
	for ant in candidates:
		if ant.assign_task(task_type, cell, target_pos):
			if task_type == "FILL":
				ant.carrying_mud = true
				ant.carrying_seed = false
				ant._update_carried_sprites()
			return true
	return false

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_F12:
		var img = get_viewport().get_texture().get_image()
		var save_path = "C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/in_engine_main_gameplay.png"
		var err = img.save_png(save_path)
		print("[Screenshot] Gameplay screenshot saved: ", err == OK, " at ", save_path)
		GameManager.emit_signal("colony_event", "📸 Đã chụp ảnh màn hình 2.5D chân thực vào Artifacts!")
		return

	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var mouse_pos = get_global_mouse_position()
		if mouse_pos.y >= 880.0 and subterranean_grid != null and GameManager.current_tool != "NONE":
			match GameManager.current_tool:
				"DIG":
					if subterranean_grid.mark_tile_for_dig(mouse_pos):
						GameManager.emit_signal("colony_event", "Đã đánh dấu ô cần đào hầm!")
				"FILL":
					if subterranean_grid.mark_tile_for_fill(mouse_pos):
						GameManager.emit_signal("colony_event", "Đã đánh dấu ô cần đắp bùn lấp hầm!")
				"DELETE":
					subterranean_grid.cancel_tile_action(mouse_pos)
					GameManager.emit_signal("colony_event", "Đã hủy lệnh thi công tại ô này.")

func _spawn_initial_ants() -> void:
	# 1. Nurse ants patrolling brood nursery
	for i in range(6):
		var ant = ANT_SCENE.instantiate()
		ant.position = Vector2(460 + randf_range(-40, 40), 1380 + randf_range(-25, 25))
		ant.waypoints = tunnel_path_royal_to_nursery
		ant.speed = randf_range(38.0, 52.0)
		ant.role = "nurse"
		if ant.has_method("set_grid_reference"):
			ant.set_grid_reference(subterranean_grid)
		entities_node.add_child(ant)
		
	# 2. Granary workers
	for i in range(6):
		var ant = ANT_SCENE.instantiate()
		ant.position = Vector2(1460 + randf_range(-40, 40), 1380 + randf_range(-25, 25))
		ant.waypoints = tunnel_path_royal_to_granary
		ant.speed = randf_range(40.0, 54.0)
		ant.carrying_seed = true
		ant.role = "forager"
		if ant.has_method("set_grid_reference"):
			ant.set_grid_reference(subterranean_grid)
		entities_node.add_child(ant)
		
	# 3. Outworld foragers & earth excavators
	for i in range(10):
		var ant = ANT_SCENE.instantiate()
		# Spread workers across the whole meadow instead of stacking at the nest.
		ant.position = outworld_ant_path[i % outworld_ant_path.size()] + Vector2(randf_range(-24, 24), 0)
		ant.waypoints = outworld_ant_path
		ant.surface_patrol = true
		ant.current_target_index = (i + 1) % outworld_ant_path.size()
		ant.speed = randf_range(42.0, 58.0)
		if i % 2 == 0:
			ant.role = "excavator"
		else:
			ant.role = "forager"
		if ant.has_method("set_grid_reference"):
			ant.set_grid_reference(subterranean_grid)
		entities_node.add_child(ant)


func _spawn_initial_bees() -> void:
	for i in range(12):
		var bee = BEE_SCENE.instantiate()
		bee.position = Vector2(300.0 + float(i) * 170.0 + randf_range(-35, 35), randf_range(510, 700))
		entities_node.add_child(bee)
