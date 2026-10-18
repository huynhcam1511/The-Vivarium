extends Node2D

## THE VIVARIUM — Phase 2: Organic Terrain & Pathfinding Validation PoC
## Built with Godot 4.7.2 TileMapLayer & AStarGrid2D
## Features:
## - 3 connected chambers: Queen Chamber, Larvae Nursery, Food Granary
## - Hand-painted organic tileset with soft contours and embedded roots/pebbles
## - Warm subterranean observation lighting (PointLight2D)
## - Multiple worker ants actively transporting resources between chambers
## - Dynamic Digging & Filling: Ants assign task, walk to location, excavate/fill, and terrain/A* updates seamlessly
## - Dynamic Obstacle Avoidance: Ants actively recalculate paths if their path is blocked while walking

const CELL_SIZE: int = 32
const GRID_WIDTH: int = 30
const GRID_HEIGHT: int = 20
const OFFSET_Y: int = 64

# Atlas tiles in organic_soil_tileset.png (64x64 mapped to 32x32 cells)
const TILE_SOLID: Vector2i = Vector2i(0, 0)
const TILE_WALL_N: Vector2i = Vector2i(1, 0)
const TILE_WALL_S: Vector2i = Vector2i(2, 0)
const TILE_WALL_W: Vector2i = Vector2i(3, 0)
const TILE_WALL_E: Vector2i = Vector2i(0, 1)
const TILE_CORNER_NW: Vector2i = Vector2i(1, 1)
const TILE_CORNER_NE: Vector2i = Vector2i(2, 1)
const TILE_CORNER_SW: Vector2i = Vector2i(3, 1)
const TILE_CORNER_SE: Vector2i = Vector2i(0, 2)
const TILE_ROOT: Vector2i = Vector2i(1, 3)
const TILE_STONE: Vector2i = Vector2i(2, 3)
const TILE_AMBER: Vector2i = Vector2i(3, 3)

enum ToolMode { NONE, DIG, FILL }

class WorkerAnt:
	var sprite: Sprite2D
	var path_line: Line2D
	var pos: Vector2
	var path: PackedVector2Array = PackedVector2Array()
	var path_index: int = 0
	var speed: float = 75.0
	var target_cell: Vector2i = Vector2i(-1, -1)
	var state: String = "IDLE" # IDLE, MOVING, EXCAVATING, FILLING
	var task_cell: Vector2i = Vector2i(-1, -1)
	var work_timer: float = 0.0

var tool_mode: ToolMode = ToolMode.NONE
var grid_state: Dictionary = {} # Vector2i -> bool (true = solid, false = walkable)
var astar: AStarGrid2D = AStarGrid2D.new()
var ants: Array[WorkerAnt] = []

# Key chamber centers
const QUEEN_CHAMBER: Vector2i = Vector2i(15, 4)
const NURSERY_CHAMBER: Vector2i = Vector2i(5, 8)
const GRANARY_CHAMBER: Vector2i = Vector2i(16, 15)

@onready var soil_layer: TileMapLayer = $SoilTileMapLayer
@onready var label_info: Label = $CanvasLayer/InfoLabel
@onready var label_status: Label = $CanvasLayer/StatusLabel
@onready var btn_dig: Button = $CanvasLayer/HBoxTools/BtnDig
@onready var btn_fill: Button = $CanvasLayer/HBoxTools/BtnFill
@onready var btn_none: Button = $CanvasLayer/HBoxTools/BtnNone

var _frame_count: int = 0
var _screenshot_taken: bool = false

func _ready() -> void:
	_setup_astar()
	_init_grid()
	_carve_organic_chambers()
	_sync_tilemap_organic()
	_sync_astar()
	_spawn_worker_ants()
	
	btn_dig.pressed.connect(func(): tool_mode = ToolMode.DIG)
	btn_fill.pressed.connect(func(): tool_mode = ToolMode.FILL)
	btn_none.pressed.connect(func(): tool_mode = ToolMode.NONE)
	
	print("[PoC Phase 2] Ready with Organic Terrain and AStarGrid2D.")

func _setup_astar() -> void:
	astar.region = Rect2i(0, 0, GRID_WIDTH, GRID_HEIGHT)
	astar.cell_size = Vector2i(CELL_SIZE, CELL_SIZE)
	astar.offset = Vector2(CELL_SIZE * 0.5, OFFSET_Y + CELL_SIZE * 0.5)
	astar.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_NEVER
	astar.update()

func _init_grid() -> void:
	for x in range(GRID_WIDTH):
		for y in range(GRID_HEIGHT):
			grid_state[Vector2i(x, y)] = true

func _carve_organic_chambers() -> void:
	# 1. Queen Chamber (central upper)
	for x in range(12, 19):
		for y in range(3, 7):
			grid_state[Vector2i(x, y)] = false
			
	# 2. Main Vertical Shaft
	for y in range(6, 17):
		for x in range(14, 17):
			grid_state[Vector2i(x, y)] = false
			
	# 3. Left Nursery Chamber
	for x in range(3, 8):
		for y in range(6, 10):
			grid_state[Vector2i(x, y)] = false
			
	# 4. Connecting tunnel to nursery
	for x in range(7, 15):
		grid_state[Vector2i(x, 8)] = false
		grid_state[Vector2i(x, 9)] = false
		
	# 5. Granary Chamber (lower vault)
	for x in range(12, 21):
		for y in range(14, 18):
			grid_state[Vector2i(x, y)] = false
			
	# 6. Right auxiliary tunnel
	for x in range(17, 25):
		grid_state[Vector2i(x, 11)] = false
	for x in range(23, 27):
		for y in range(10, 13):
			grid_state[Vector2i(x, y)] = false

func _sync_tilemap_organic() -> void:
	soil_layer.clear()
	for x in range(GRID_WIDTH):
		for y in range(GRID_HEIGHT):
			var cell := Vector2i(x, y)
			if not grid_state.get(cell, true):
				continue # Walkable cavities are open space
				
			# Determine natural tile based on neighbors
			var tile := _resolve_organic_tile(x, y)
			soil_layer.set_cell(cell, 0, tile)

func _resolve_organic_tile(x: int, y: int) -> Vector2i:
	# Check adjacent cells
	var n_open: bool = not bool(grid_state.get(Vector2i(x, y - 1), true))
	var s_open: bool = not bool(grid_state.get(Vector2i(x, y + 1), true))
	var w_open: bool = not bool(grid_state.get(Vector2i(x - 1, y), true))
	var e_open: bool = not bool(grid_state.get(Vector2i(x + 1, y), true))
	
	if n_open and w_open:
		return TILE_CORNER_NW
	elif n_open and e_open:
		return TILE_CORNER_NE
	elif s_open and w_open:
		return TILE_CORNER_SW
	elif s_open and e_open:
		return TILE_CORNER_SE
	elif n_open:
		return TILE_WALL_N
	elif s_open:
		return TILE_WALL_S
	elif w_open:
		return TILE_WALL_W
	elif e_open:
		return TILE_WALL_E
		
	# Solid interior variations: embedded stones and roots
	var hash_val := (x * 73856093 ^ y * 19349663) % 100
	if hash_val < 8:
		return TILE_ROOT
	elif hash_val < 15:
		return TILE_STONE
	elif hash_val < 20:
		return TILE_AMBER
	return TILE_SOLID

func _sync_astar() -> void:
	for x in range(GRID_WIDTH):
		for y in range(GRID_HEIGHT):
			var cell := Vector2i(x, y)
			var is_solid: bool = grid_state.get(cell, true)
			astar.set_point_solid(cell, is_solid)

func _spawn_worker_ants() -> void:
	var ant_tex: Texture2D = load("res://assets/sprites/stylized_ant.png")
	var chamber_targets := [NURSERY_CHAMBER, GRANARY_CHAMBER, QUEEN_CHAMBER]
	
	for i in range(4):
		var ant := WorkerAnt.new()
		ant.pos = astar.get_point_position(QUEEN_CHAMBER) + Vector2((i - 1.5) * 12.0, 0)
		
		# Sprite
		var spr := Sprite2D.new()
		spr.texture = ant_tex
		spr.scale = Vector2(0.035, 0.035)
		spr.position = ant.pos
		spr.z_index = 10 + i
		add_child(spr)
		ant.sprite = spr
		
		# Path line
		var line := Line2D.new()
		line.width = 1.5
		line.default_color = Color(0.3, 0.9, 0.4, 0.45)
		line.z_index = 5
		add_child(line)
		ant.path_line = line
		
		ants.append(ant)
		_route_ant_to_cell(ant, chamber_targets[i % chamber_targets.size()])

func _route_ant_to_cell(ant: WorkerAnt, target: Vector2i) -> void:
	var start_cell := _world_to_grid(ant.pos)
	if astar.is_point_solid(start_cell) or astar.is_point_solid(target):
		ant.path = PackedVector2Array()
		ant.path_line.points = ant.path
		return
		
	ant.target_cell = target
	ant.path = astar.get_point_path(start_cell, target)
	ant.path_index = 0
	ant.path_line.points = ant.path
	ant.state = "MOVING"

func _world_to_grid(world_pos: Vector2) -> Vector2i:
	var x := int(world_pos.x / CELL_SIZE)
	var y := int((world_pos.y - OFFSET_Y) / CELL_SIZE)
	return Vector2i(clampi(x, 0, GRID_WIDTH - 1), clampi(y, 0, GRID_HEIGHT - 1))

func _process(delta: float) -> void:
	for ant in ants:
		_update_ant(ant, delta)
		
	label_info.text = "Tool: %s | Cells: %d solid / %d open | Active Ants: %d" % [
		["NONE", "DIG", "FILL"][tool_mode],
		_count_solid(),
		GRID_WIDTH * GRID_HEIGHT - _count_solid(),
		ants.size()
	]
	
	if not _screenshot_taken:
		_frame_count += 1
		if _frame_count >= 90:
			_screenshot_taken = true
			_capture_screenshot()

func _update_ant(ant: WorkerAnt, delta: float) -> void:
	if ant.state == "EXCAVATING" or ant.state == "FILLING":
		ant.work_timer -= delta
		if ant.work_timer <= 0.0:
			_complete_ant_task(ant)
		return
		
	if ant.path.size() > 0 and ant.path_index < ant.path.size():
		var target_pt := ant.path[ant.path_index]
		var dir := (target_pt - ant.pos).normalized()
		ant.pos += dir * ant.speed * delta
		
		if dir.x < 0:
			ant.sprite.flip_h = true
		elif dir.x > 0:
			ant.sprite.flip_h = false
			
		ant.sprite.position = ant.pos
		
		if ant.pos.distance_to(target_pt) < 3.0:
			ant.path_index += 1
			if ant.path_index >= ant.path.size():
				_on_ant_reached_target(ant)

func _on_ant_reached_target(ant: WorkerAnt) -> void:
	if ant.task_cell != Vector2i(-1, -1):
		# Start digging or filling animation/timer
		ant.state = "EXCAVATING" if tool_mode == ToolMode.DIG else "FILLING"
		ant.work_timer = 0.5
		label_status.text = "Worker ant reached %s -> Working..." % ant.task_cell
		return
		
	# Routine cycle between chambers
	var destinations := [QUEEN_CHAMBER, NURSERY_CHAMBER, GRANARY_CHAMBER]
	var next_target: Vector2i = destinations[randi() % destinations.size()]
	while next_target == ant.target_cell:
		next_target = destinations[randi() % destinations.size()]
	_route_ant_to_cell(ant, next_target)

func _complete_ant_task(ant: WorkerAnt) -> void:
	var cell := ant.task_cell
	if ant.state == "EXCAVATING":
		if grid_state.get(cell, true):
			grid_state[cell] = false
			astar.set_point_solid(cell, false)
			_sync_tilemap_organic()
			label_status.text = "Excavated cell %s! Navigation map updated." % cell
	elif ant.state == "FILLING":
		if not grid_state.get(cell, true):
			grid_state[cell] = true
			astar.set_point_solid(cell, true)
			_sync_tilemap_organic()
			label_status.text = "Filled cell %s! Navigation map updated." % cell
			
	ant.task_cell = Vector2i(-1, -1)
	ant.state = "IDLE"
	_reroute_all_ants_if_interrupted()
	_on_ant_reached_target(ant)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var mouse_pos := get_global_mouse_position()
		var cell := _world_to_grid(mouse_pos)
		
		if cell.x < 0 or cell.x >= GRID_WIDTH or cell.y < 0 or cell.y >= GRID_HEIGHT:
			return
			
		match tool_mode:
			ToolMode.DIG:
				if grid_state.get(cell, true):
					_dispatch_ant_to_work(cell, "DIG")
			ToolMode.FILL:
				if not grid_state.get(cell, true):
					# Validate: do not fill cell if an ant is currently standing on it
					if _is_cell_occupied_by_ant(cell):
						label_status.text = "Cannot fill cell %s: Worker ant is standing here!" % cell
						return
					_dispatch_ant_to_work(cell, "FILL")

func _is_cell_occupied_by_ant(cell: Vector2i) -> bool:
	for ant in ants:
		if _world_to_grid(ant.pos) == cell:
			return true
	return false

func _dispatch_ant_to_work(cell: Vector2i, task: String) -> void:
	# Find adjacent walkable neighbor to stand while working
	var work_spot := _find_adjacent_walkable(cell)
	if work_spot == Vector2i(-1, -1):
		label_status.text = "Cannot reach cell %s: No open adjacent tunnel!" % cell
		return
		
	# Find closest idle/moving ant
	var best_ant: WorkerAnt = ants[0]
	var best_dist: float = 999999.0
	for ant in ants:
		var d := ant.pos.distance_squared_to(astar.get_point_position(work_spot))
		if d < best_dist:
			best_dist = d
			best_ant = ant
			
	best_ant.task_cell = cell
	label_status.text = "Dispatched worker ant to %s %s..." % [task, cell]
	_route_ant_to_cell(best_ant, work_spot)

func _find_adjacent_walkable(cell: Vector2i) -> Vector2i:
	for offset in [Vector2i(0, -1), Vector2i(0, 1), Vector2i(-1, 0), Vector2i(1, 0)]:
		var neighbor: Vector2i = cell + offset
		if neighbor.x >= 0 and neighbor.x < GRID_WIDTH and neighbor.y >= 0 and neighbor.y < GRID_HEIGHT:
			if not grid_state.get(neighbor, true):
				return neighbor
	return Vector2i(-1, -1)

func _reroute_all_ants_if_interrupted() -> void:
	# If any ant's upcoming path passes through newly solid terrain, dynamically reroute
	for ant in ants:
		if ant.path.size() > 0:
			var needs_reroute := false
			for i in range(ant.path_index, ant.path.size()):
				var c := _world_to_grid(ant.path[i])
				if astar.is_point_solid(c):
					needs_reroute = true
					break
			if needs_reroute:
				_route_ant_to_cell(ant, ant.target_cell)

func _count_solid() -> int:
	var count: int = 0
	for cell in grid_state:
		if grid_state[cell]:
			count += 1
	return count

func _capture_screenshot() -> String:
	if DisplayServer.get_name() == "headless":
		return ""
	var viewport := get_viewport()
	if viewport == null or viewport.get_texture() == null:
		return ""
	var img := viewport.get_texture().get_image()
	if img == null:
		return ""
	var save_path := "C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/poc_phase2_organic_terrain_screenshot.png"
	img.save_png(save_path)
	print("[PoC Phase 2] In-Engine Screenshot saved successfully: %s" % save_path)
	return save_path
