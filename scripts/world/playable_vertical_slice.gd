extends Node2D
class_name PlayableVerticalSlice

## THE VIVARIUM — Phase 3 Playable Stylized 2D Vertical Slice
## Complete unified ecosystem:
## - Aboveground Outworld: Ancient oak, wild honeycomb hive, blooming wildflowers meadow
## - Active foraging bees: Take off from hive, pollinate flowers, return with honey
## - Ant mound surface portal: Connecting outworld to subterranean tunnels
## - Subterranean Formicarium: Queen chamber, brood nursery, granary vault
## - Dynamic AStarGrid2D + TileMapLayer excavation & filling
## - Autonomous worker ants: Patrol chambers, nurse brood, excavate dig orders, transport seeds/mud
## - Seamless Camera navigation: WASD / RMB pan, mouse wheel zoom, camera preset shortcuts
## - Full Scientific HUD: Telemetry, live resource counters, construction tools, time speed controls

const CELL_SIZE: int = 32
const GRID_WIDTH: int = 60
const GRID_HEIGHT: int = 26
const OFFSET_Y: int = 880

# Atlas mapping for stylized_subterranean_atlas.png (64x64 textures on 32x32 tiles)
const TILE_TOP_LOAM: Vector2i = Vector2i(0, 0)
const TILE_ROOT_SOIL: Vector2i = Vector2i(1, 0)
const TILE_HUMUS_SOIL: Vector2i = Vector2i(0, 1)
const TILE_BEDROCK_SOIL: Vector2i = Vector2i(1, 1)

enum ToolMode { NONE, DIG, FILL, CANCEL }

class WorkerAntEntity:
	var sprite: Sprite2D
	var seed_icon: Sprite2D
	var mud_icon: Sprite2D
	var path_line: Line2D
	var pos: Vector2
	var path: PackedVector2Array = PackedVector2Array()
	var path_index: int = 0
	var speed: float = 65.0
	var target_cell: Vector2i = Vector2i(-1, -1)
	var state: String = "IDLE" # IDLE, PATROLLING, TASK_WALKING, EXCAVATING, FILLING
	var task_cell: Vector2i = Vector2i(-1, -1)
	var work_timer: float = 0.0
	var carrying_seed: bool = false
	var carrying_mud: bool = false
	var role: String = "forager"

class HoneybeeEntity:
	var sprite: Sprite2D
	var pos: Vector2
	var target_pos: Vector2
	var speed: float = 85.0
	var hover_phase: float = 0.0
	var state: String = "FLYING" # FLYING, POLLINATING, RETURNING
	var state_timer: float = 0.0
	var pollen_collected: float = 0.0

var tool_mode: ToolMode = ToolMode.NONE
var grid_state: Dictionary = {} # Vector2i -> bool (true = solid, false = walkable tunnel)
var pending_tasks: Dictionary = {} # Vector2i -> String ("DIG" or "FILL")
var astar: AStarGrid2D = AStarGrid2D.new()

var ants: Array[WorkerAntEntity] = []
var bees: Array[HoneybeeEntity] = []

# Key ecosystem points of interest (World coordinates)
const QUEEN_POS: Vector2 = Vector2(960, 1120)
const NURSERY_POS: Vector2 = Vector2(460, 1380)
const GRANARY_POS: Vector2 = Vector2(1460, 1380)
const SURFACE_MOUND_POS: Vector2 = Vector2(960, 880)
const HIVE_POS: Vector2 = Vector2(1500, 380)

var flower_spots: Array[Vector2] = [
	Vector2(420, 720),
	Vector2(560, 715),
	Vector2(700, 730),
	Vector2(1220, 720),
	Vector2(1380, 715),
	Vector2(1520, 730)
]

@onready var soil_tilemap: TileMapLayer = $SubterraneanFormicarium/SoilTileMapLayer
@onready var entities_node: Node2D = $Entities
@onready var overlay_node: Node2D = $ConstructionOverlay
@onready var camera: Camera2D = $Camera2D

var _frame_count: int = 0
var _screenshot_taken: bool = false
var _work_tick_timer: float = 0.0

func _ready() -> void:
	print("[Playable Slice] Initializing Phase 3 Playable Stylized 2D Ecosystem...")
	_setup_astar()
	_init_subterranean_layout()
	_sync_tilemap()
	_sync_astar()
	_spawn_worker_ants()
	_spawn_honeybees()
	_connect_gamemanager_tools()
	
	GameManager.emit_signal("colony_event", "🌱 The Vivarium V3.0 Playable Stylized Slice đã khởi động thành công!")
	GameManager.emit_signal("resources_updated")

func _setup_astar() -> void:
	astar.region = Rect2i(0, 0, GRID_WIDTH, GRID_HEIGHT)
	astar.cell_size = Vector2i(CELL_SIZE, CELL_SIZE)
	astar.offset = Vector2(CELL_SIZE * 0.5, OFFSET_Y + CELL_SIZE * 0.5)
	astar.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_NEVER
	astar.update()

func _init_subterranean_layout() -> void:
	# All solid by default
	for x in range(GRID_WIDTH):
		for y in range(GRID_HEIGHT):
			grid_state[Vector2i(x, y)] = true
			
	# 1. Main vertical ventilation shaft from surface entrance (x=29..30, y=0..8)
	for y in range(0, 9):
		grid_state[Vector2i(29, y)] = false
		grid_state[Vector2i(30, y)] = false
		
	# 2. Queen Royal Chamber (center x=24..35, y=6..9)
	for x in range(24, 36):
		for y in range(6, 10):
			grid_state[Vector2i(x, y)] = false
			
	# 3. Left Brood Nursery (x=11..19, y=13..17)
	for x in range(11, 20):
		for y in range(13, 18):
			grid_state[Vector2i(x, y)] = false
	# Connecting tunnel to Nursery
	for x in range(18, 25):
		grid_state[Vector2i(x, 8)] = false
	for y in range(8, 14):
		grid_state[Vector2i(18, y)] = false
		
	# 4. Right Granary Vault (x=41..49, y=13..17)
	for x in range(41, 50):
		for y in range(13, 18):
			grid_state[Vector2i(x, y)] = false
	# Connecting tunnel to Granary
	for x in range(34, 42):
		grid_state[Vector2i(x, 8)] = false
	for y in range(8, 14):
		grid_state[Vector2i(41, y)] = false

func _sync_tilemap() -> void:
	soil_tilemap.clear()
	for x in range(GRID_WIDTH):
		for y in range(GRID_HEIGHT):
			var cell := Vector2i(x, y)
			if not grid_state.get(cell, true):
				continue # Cavity is open space, showing chamber interior art & backdrop
				
			# Natural depth-based geological stratification
			var tile_coord: Vector2i = TILE_TOP_LOAM
			if y < 8:
				tile_coord = TILE_TOP_LOAM if (x + y) % 5 != 0 else TILE_ROOT_SOIL
			elif y < 18:
				tile_coord = TILE_HUMUS_SOIL if (x + y) % 4 != 0 else TILE_ROOT_SOIL
			else:
				tile_coord = TILE_BEDROCK_SOIL
				
			soil_tilemap.set_cell(cell, 0, tile_coord)

func _sync_astar() -> void:
	for x in range(GRID_WIDTH):
		for y in range(GRID_HEIGHT):
			var cell := Vector2i(x, y)
			var is_solid: bool = grid_state.get(cell, true)
			astar.set_point_solid(cell, is_solid)

func _spawn_worker_ants() -> void:
	var ant_tex: Texture2D = load("res://assets/sprites/stylized_ant.png")
	var seed_tex: Texture2D = load("res://assets/sprites/realistic_seeds.svg")
	var mud_tex: Texture2D = load("res://assets/sprites/clay_mud_ball.svg")
	
	# Initial team of 8 specialized worker ants
	var start_points := [
		QUEEN_POS, QUEEN_POS + Vector2(-40, 10),
		NURSERY_POS, NURSERY_POS + Vector2(30, -10),
		GRANARY_POS, GRANARY_POS + Vector2(-30, 15),
		SURFACE_MOUND_POS, SURFACE_MOUND_POS + Vector2(40, -10)
	]
	
	for i in range(start_points.size()):
		var ant := WorkerAntEntity.new()
		ant.pos = start_points[i]
		
		# Ant Sprite
		var spr := Sprite2D.new()
		spr.texture = ant_tex
		spr.scale = Vector2(0.038, 0.038)
		spr.position = ant.pos
		spr.z_index = 8
		entities_node.add_child(spr)
		ant.sprite = spr
		
		# Seed item
		var s_spr := Sprite2D.new()
		s_spr.texture = seed_tex
		s_spr.scale = Vector2(0.5, 0.5)
		s_spr.position = Vector2(10, -5)
		s_spr.visible = false
		spr.add_child(s_spr)
		ant.seed_icon = s_spr
		
		# Mud item
		var m_spr := Sprite2D.new()
		m_spr.texture = mud_tex
		m_spr.scale = Vector2(0.6, 0.6)
		m_spr.position = Vector2(10, -5)
		m_spr.visible = false
		spr.add_child(m_spr)
		ant.mud_icon = m_spr
		
		# Dynamic path line
		var line := Line2D.new()
		line.width = 1.5
		line.default_color = Color(0.2, 0.85, 0.4, 0.4)
		line.z_index = 4
		entities_node.add_child(line)
		ant.path_line = line
		
		if i == 4 or i == 5:
			ant.carrying_seed = true
			ant.seed_icon.visible = true
			ant.role = "granary_worker"
		elif i == 6:
			ant.role = "outworld_scout"
		else:
			ant.role = "nurse"
			
		ants.append(ant)
		_pick_next_routine_patrol(ant)

func _spawn_honeybees() -> void:
	var bee_tex: Texture2D = load("res://assets/sprites/stylized_bee.png")
	
	for i in range(6):
		var bee := HoneybeeEntity.new()
		bee.pos = HIVE_POS + Vector2(randf_range(-60, 40), randf_range(20, 80))
		bee.target_pos = flower_spots[i % flower_spots.size()]
		
		var spr := Sprite2D.new()
		spr.texture = bee_tex
		spr.scale = Vector2(0.045, 0.045)
		spr.position = bee.pos
		spr.z_index = 12
		entities_node.add_child(spr)
		bee.sprite = spr
		
		bee.speed = randf_range(75.0, 95.0)
		bees.append(bee)

func _connect_gamemanager_tools() -> void:
	GameManager.connect("colony_event", Callable(self, "_on_colony_event"))

func _on_colony_event(_text: String) -> void:
	pass

func _process(delta: float) -> void:
	# Update all worker ants
	for ant in ants:
		_process_ant(ant, delta)
		
	# Update all honeybees
	for bee in bees:
		_process_bee(bee, delta)
		
	# Periodic autonomous task dispatch
	_work_tick_timer += delta
	if _work_tick_timer >= 1.5:
		_work_tick_timer = 0.0
		_dispatch_pending_construction_tasks()
		
	# Auto-capture validation screenshot
	if not _screenshot_taken:
		_frame_count += 1
		if _frame_count >= 75:
			_screenshot_taken = true
			capture_playable_slice_screenshot()

func _process_ant(ant: WorkerAntEntity, delta: float) -> void:
	if ant.state == "EXCAVATING" or ant.state == "FILLING":
		ant.work_timer -= delta
		# Digging wiggle
		ant.sprite.rotation = sin(ant.work_timer * 20.0) * 0.15
		if ant.work_timer <= 0.0:
			_complete_ant_task(ant)
		return
		
	if ant.path.size() > 0 and ant.path_index < ant.path.size():
		var target_pt := ant.path[ant.path_index]
		var dir := (target_pt - ant.pos).normalized()
		ant.pos += dir * ant.speed * delta
		
		if dir.x < 0:
			ant.sprite.flip_h = true
			ant.seed_icon.position.x = -10
			ant.mud_icon.position.x = -10
		elif dir.x > 0:
			ant.sprite.flip_h = false
			ant.seed_icon.position.x = 10
			ant.mud_icon.position.x = 10
			
		ant.sprite.position = ant.pos
		
		if ant.pos.distance_to(target_pt) < 4.0:
			ant.path_index += 1
			if ant.path_index >= ant.path.size():
				_on_ant_reached_destination(ant)

func _process_bee(bee: HoneybeeEntity, delta: float) -> void:
	bee.hover_phase += delta * 18.0
	bee.state_timer += delta
	
	if bee.state == "FLYING":
		var to_target := (bee.target_pos - bee.pos)
		var dist := to_target.length()
		if dist < 15.0:
			bee.state = "POLLINATING"
			bee.state_timer = 0.0
		else:
			var dir := to_target.normalized()
			bee.pos += dir * bee.speed * delta
			bee.sprite.position = bee.pos
			bee.sprite.flip_h = (dir.x < 0)
			
	elif bee.state == "POLLINATING":
		# Hover gently above flowers collecting pollen
		bee.pos.y += sin(bee.hover_phase) * 0.35
		bee.sprite.position = bee.pos
		if bee.state_timer >= 3.0:
			bee.target_pos = HIVE_POS + Vector2(randf_range(-40, 20), randf_range(10, 50))
			bee.state = "RETURNING"
			bee.state_timer = 0.0
			GameManager.wildflower_honey += 0.5
			GameManager.emit_signal("resources_updated")
			
	elif bee.state == "RETURNING":
		var to_hive := (bee.target_pos - bee.pos)
		if to_hive.length() < 15.0:
			bee.target_pos = flower_spots[randi() % flower_spots.size()]
			bee.state = "FLYING"
			bee.state_timer = 0.0
		else:
			var dir := to_hive.normalized()
			bee.pos += dir * bee.speed * delta
			bee.sprite.position = bee.pos
			bee.sprite.flip_h = (dir.x < 0)
			
	# Wing vibration animation
	bee.sprite.scale.x = 0.045 + sin(bee.hover_phase * 2.0) * 0.004

func _on_ant_reached_destination(ant: WorkerAntEntity) -> void:
	if ant.task_cell != Vector2i(-1, -1):
		# Arrived at task spot! Start excavating or filling
		var task_type: String = pending_tasks.get(ant.task_cell, "")
		if task_type == "DIG":
			ant.state = "EXCAVATING"
			ant.work_timer = 1.0
			GameManager.emit_signal("colony_event", "⛏️ Kiến thợ đang đào phá ô đất tại %s..." % ant.task_cell)
		elif task_type == "FILL":
			ant.state = "FILLING"
			ant.work_timer = 1.0
			GameManager.emit_signal("colony_event", "🧱 Kiến thợ đang đắp đất lấp ô tại %s..." % ant.task_cell)
		return
		
	# Routine colony life cycle
	_pick_next_routine_patrol(ant)

func _pick_next_routine_patrol(ant: WorkerAntEntity) -> void:
	var goals := [QUEEN_POS, NURSERY_POS, GRANARY_POS, SURFACE_MOUND_POS]
	var next_goal: Vector2 = goals[randi() % goals.size()]
	
	# If in granary, pick up seed
	if ant.pos.distance_to(GRANARY_POS) < 120.0:
		ant.carrying_seed = true
		ant.seed_icon.visible = true
	elif ant.pos.distance_to(NURSERY_POS) < 120.0 and ant.carrying_seed:
		# Deliver seed to nursery
		ant.carrying_seed = false
		ant.seed_icon.visible = false
		GameManager.seeds += 1
		GameManager.emit_signal("resources_updated")
		
	var grid_dest := _world_to_grid(next_goal)
	_route_ant_to_cell(ant, grid_dest)

func _route_ant_to_cell(ant: WorkerAntEntity, target_cell: Vector2i) -> bool:
	var start_cell := _world_to_grid(ant.pos)
	if astar.is_point_solid(start_cell) or astar.is_point_solid(target_cell):
		ant.path = PackedVector2Array()
		ant.path_line.points = ant.path
		return false
		
	ant.target_cell = target_cell
	ant.path = astar.get_point_path(start_cell, target_cell)
	ant.path_index = 0
	ant.path_line.points = ant.path
	ant.state = "PATROLLING"
	return ant.path.size() > 0

func _dispatch_pending_construction_tasks() -> void:
	if pending_tasks.is_empty():
		return
		
	for task_cell in pending_tasks.keys():
		# Check if an ant is already assigned
		var already_assigned := false
		for ant in ants:
			if ant.task_cell == task_cell:
				already_assigned = true
				break
		if already_assigned:
			continue
			
		# Find adjacent walkable cell
		var work_stand_spot := _find_adjacent_walkable(task_cell)
		if work_stand_spot == Vector2i(-1, -1):
			continue # Cannot reach yet
			
		# Pick nearest free worker ant
		var best_ant: WorkerAntEntity = null
		var best_dist: float = 999999.0
		for ant in ants:
			if ant.task_cell == Vector2i(-1, -1) and ant.state != "EXCAVATING" and ant.state != "FILLING":
				var d := ant.pos.distance_squared_to(_grid_to_world_center(work_stand_spot))
				if d < best_dist:
					best_dist = d
					best_ant = ant
					
		if best_ant != null:
			best_ant.task_cell = task_cell
			best_ant.state = "TASK_WALKING"
			_route_ant_to_cell(best_ant, work_stand_spot)
			GameManager.emit_signal("colony_event", "🐜 Kiến thợ đã nhận lệnh đi thi công ô %s!" % task_cell)
			break

func _complete_ant_task(ant: WorkerAntEntity) -> void:
	var cell: Vector2i = ant.task_cell
	var task_type: String = pending_tasks.get(cell, "")
	
	if task_type == "DIG":
		grid_state[cell] = false
		astar.set_point_solid(cell, false)
		soil_tilemap.erase_cell(cell)
		pending_tasks.erase(cell)
		GameManager.clay_mud += 1
		GameManager.emit_signal("colony_event", "🎉 Đã hoàn thành đào ô %s! (+1 Bùn đất)" % cell)
		GameManager.emit_signal("resources_updated")
		
	elif task_type == "FILL":
		grid_state[cell] = true
		astar.set_point_solid(cell, true)
		soil_tilemap.set_cell(cell, 0, TILE_BEDROCK_SOIL)
		pending_tasks.erase(cell)
		if GameManager.clay_mud > 0:
			GameManager.clay_mud -= 1
		GameManager.emit_signal("colony_event", "🛡️ Đã đắp kín ô %s chống sạt lở!" % cell)
		GameManager.emit_signal("resources_updated")
		
	ant.task_cell = Vector2i(-1, -1)
	ant.state = "IDLE"
	overlay_node.queue_redraw()
	_reroute_interrupted_ants()
	_pick_next_routine_patrol(ant)

func _reroute_interrupted_ants() -> void:
	for ant in ants:
		if ant.path.size() > 0:
			var blocked := false
			for i in range(ant.path_index, ant.path.size()):
				var c := _world_to_grid(ant.path[i])
				if astar.is_point_solid(c):
					blocked = true
					break
			if blocked:
				_pick_next_routine_patrol(ant)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_F12:
			capture_playable_slice_screenshot()
			return
		elif event.keycode == KEY_1:
			camera.target_position = Vector2(960, 420) # Outworld & Honeycomb
		elif event.keycode == KEY_2:
			camera.target_position = Vector2(960, 880) # Surface & Mound
		elif event.keycode == KEY_3:
			camera.target_position = Vector2(960, 1340) # Deep Formicarium
			
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var mouse_pos := get_global_mouse_position()
		if mouse_pos.y >= OFFSET_Y:
			var cell := _world_to_grid(mouse_pos)
			_handle_tile_click(cell)

func _handle_tile_click(cell: Vector2i) -> void:
	if cell.x < 0 or cell.x >= GRID_WIDTH or cell.y < 0 or cell.y >= GRID_HEIGHT:
		return
		
	var active_tool: String = GameManager.current_tool
	if active_tool == "DIG":
		if grid_state.get(cell, true) and not pending_tasks.has(cell):
			pending_tasks[cell] = "DIG"
			overlay_node.queue_redraw()
			GameManager.emit_signal("colony_event", "📌 Đã đánh dấu ô %s: Đang chờ kiến thợ đến đào!" % cell)
	elif active_tool == "FILL":
		if not grid_state.get(cell, true) and not pending_tasks.has(cell):
			if _is_cell_occupied_by_ant(cell):
				GameManager.emit_signal("colony_event", "⚠️ Không thể lấp ô %s: Đang có kiến đứng tại đây!" % cell)
				return
			if GameManager.clay_mud <= 0:
				GameManager.emit_signal("colony_event", "⚠️ Thiếu bùn đất để lấp! Cần đào thêm đất.")
				return
			pending_tasks[cell] = "FILL"
			overlay_node.queue_redraw()
			GameManager.emit_signal("colony_event", "📌 Đã đánh dấu ô %s: Đang điều phối kiến mang bùn đến lấp!" % cell)
	elif active_tool == "DELETE":
		if pending_tasks.has(cell):
			pending_tasks.erase(cell)
			overlay_node.queue_redraw()
			GameManager.emit_signal("colony_event", "🧼 Đã hủy lệnh thi công tại ô %s." % cell)

func _is_cell_occupied_by_ant(cell: Vector2i) -> bool:
	for ant in ants:
		if _world_to_grid(ant.pos) == cell:
			return true
	return false

func _find_adjacent_walkable(cell: Vector2i) -> Vector2i:
	for offset in [Vector2i(0, -1), Vector2i(0, 1), Vector2i(-1, 0), Vector2i(1, 0)]:
		var nb: Vector2i = cell + offset
		if nb.x >= 0 and nb.x < GRID_WIDTH and nb.y >= 0 and nb.y < GRID_HEIGHT:
			if not grid_state.get(nb, true):
				return nb
	return Vector2i(-1, -1)

func _world_to_grid(world_pos: Vector2) -> Vector2i:
	var x := int(world_pos.x / CELL_SIZE)
	var y := int((world_pos.y - OFFSET_Y) / CELL_SIZE)
	return Vector2i(clampi(x, 0, GRID_WIDTH - 1), clampi(y, 0, GRID_HEIGHT - 1))

func _grid_to_world_center(cell: Vector2i) -> Vector2:
	return Vector2(cell.x * CELL_SIZE + CELL_SIZE * 0.5, cell.y * CELL_SIZE + OFFSET_Y + CELL_SIZE * 0.5)

func capture_playable_slice_screenshot() -> String:
	if DisplayServer.get_name() == "headless":
		return ""
	var vp := get_viewport()
	if vp == null or vp.get_texture() == null:
		return ""
	var img := vp.get_texture().get_image()
	if img == null:
		return ""
	var save_path := "C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/playable_slice_in_engine_gameplay.png"
	img.save_png(save_path)
	print("[Playable Slice] In-Engine Gameplay Screenshot saved: %s" % save_path)
	return save_path
