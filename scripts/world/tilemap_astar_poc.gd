extends Node2D

## TileMapLayer + AStarGrid2D Proof of Concept
## Demonstrates: Diggable/fillable terrain using Godot built-in TileMapLayer,
## dynamic pathfinding with AStarGrid2D, and a single ant navigating in real-time.
## This scene does NOT replace subterranean_grid.gd in the main game.

const CELL_SIZE: int = 32
const GRID_WIDTH: int = 30
const GRID_HEIGHT: int = 20
const OFFSET_Y: int = 64  # Leave space for sky backdrop

# TileMapLayer source IDs (atlas coordinates within the TileSet)
const TILE_SOLID: Vector2i = Vector2i(0, 0)  # Solid earth
const TILE_TUNNEL: Vector2i = Vector2i(1, 0) # Excavated cavity
const TILE_CHAMBER: Vector2i = Vector2i(2, 0) # Chamber interior

enum ToolMode { NONE, DIG, FILL }

var tool_mode: ToolMode = ToolMode.NONE
var grid_state: Dictionary = {}  # Vector2i -> bool (true = solid, false = tunnel)
var astar: AStarGrid2D = AStarGrid2D.new()

# Ant state
var ant_pos: Vector2 = Vector2.ZERO
var ant_path: PackedVector2Array = PackedVector2Array()
var ant_path_index: int = 0
var ant_speed: float = 80.0
var ant_target: Vector2i = Vector2i(-1, -1)

@onready var soil_layer: TileMapLayer = $SoilTileMapLayer
@onready var ant_sprite: Sprite2D = $AntSprite
@onready var path_line: Line2D = $PathLine
@onready var label_info: Label = $CanvasLayer/InfoLabel
@onready var btn_dig: Button = $CanvasLayer/HBoxTools/BtnDig
@onready var btn_fill: Button = $CanvasLayer/HBoxTools/BtnFill
@onready var btn_none: Button = $CanvasLayer/HBoxTools/BtnNone

var _frame_count: int = 0
var _screenshot_taken: bool = false

func _ready() -> void:
	_setup_astar()
	_init_grid()
	_place_initial_chambers()
	_sync_tilemap()
	_sync_astar()
	_init_ant()

	btn_dig.pressed.connect(_on_tool_dig)
	btn_fill.pressed.connect(_on_tool_fill)
	btn_none.pressed.connect(_on_tool_none)

	print("[PoC] TileMapLayer + AStarGrid2D Proof of Concept ready.")
	print("[PoC] Grid: %dx%d (%d cells)" % [GRID_WIDTH, GRID_HEIGHT, GRID_WIDTH * GRID_HEIGHT])

func _setup_astar() -> void:
	astar.region = Rect2i(0, 0, GRID_WIDTH, GRID_HEIGHT)
	astar.cell_size = Vector2i(CELL_SIZE, CELL_SIZE)
	astar.offset = Vector2(CELL_SIZE * 0.5, OFFSET_Y + CELL_SIZE * 0.5)
	astar.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_NEVER
	astar.update()

func _init_grid() -> void:
	for x in range(GRID_WIDTH):
		for y in range(GRID_HEIGHT):
			grid_state[Vector2i(x, y)] = true  # All solid initially

func _place_initial_chambers() -> void:
	# Queen chamber (center, near top)
	for x in range(13, 18):
		for y in range(3, 6):
			grid_state[Vector2i(x, y)] = false

	# Vertical shaft from chamber down
	for y in range(5, 14):
		grid_state[Vector2i(15, y)] = false

	# Lower granary chamber
	for x in range(12, 19):
		for y in range(13, 16):
			grid_state[Vector2i(x, y)] = false

	# Horizontal tunnel branch (connects shaft at x=15 to nursery at x=6)
	for x in range(5, 16):
		grid_state[Vector2i(x, 8)] = false

	# Small left nursery
	for x in range(3, 7):
		for y in range(7, 10):
			grid_state[Vector2i(x, y)] = false

func _sync_tilemap() -> void:
	soil_layer.clear()
	for x in range(GRID_WIDTH):
		for y in range(GRID_HEIGHT):
			var cell := Vector2i(x, y)
			var is_solid: bool = grid_state.get(cell, true)
			if is_solid:
				soil_layer.set_cell(cell, 0, TILE_SOLID)
			else:
				soil_layer.erase_cell(cell)

func _sync_astar() -> void:
	for x in range(GRID_WIDTH):
		for y in range(GRID_HEIGHT):
			var cell := Vector2i(x, y)
			var is_solid: bool = grid_state.get(cell, true)
			astar.set_point_solid(cell, is_solid)

func _init_ant() -> void:
	# Start ant in the queen chamber
	var start_cell := Vector2i(15, 4)
	ant_pos = astar.get_point_position(start_cell)
	ant_sprite.position = ant_pos
	# Target: left nursery
	_set_ant_target(Vector2i(5, 8))

func _set_ant_target(target: Vector2i) -> void:
	ant_target = target
	var start_cell := _world_to_grid(ant_pos)
	if astar.is_point_solid(start_cell) or astar.is_point_solid(target):
		ant_path = PackedVector2Array()
		path_line.points = ant_path
		return
	ant_path = astar.get_point_path(start_cell, target)
	ant_path_index = 0
	path_line.points = ant_path

func _world_to_grid(world_pos: Vector2) -> Vector2i:
	var x := int(world_pos.x / CELL_SIZE)
	var y := int((world_pos.y - OFFSET_Y) / CELL_SIZE)
	return Vector2i(clampi(x, 0, GRID_WIDTH - 1), clampi(y, 0, GRID_HEIGHT - 1))

func _grid_to_world_center(cell: Vector2i) -> Vector2:
	return Vector2(cell.x * CELL_SIZE + CELL_SIZE * 0.5, cell.y * CELL_SIZE + OFFSET_Y + CELL_SIZE * 0.5)

func _process(delta: float) -> void:
	# Move ant along path
	if ant_path.size() > 0 and ant_path_index < ant_path.size():
		var target_point := ant_path[ant_path_index]
		var direction := (target_point - ant_pos).normalized()
		ant_pos += direction * ant_speed * delta

		if ant_pos.distance_to(target_point) < 2.0:
			ant_path_index += 1
			if ant_path_index >= ant_path.size():
				# Reached destination — reverse target
				if ant_target == Vector2i(5, 8):
					_set_ant_target(Vector2i(15, 14))
				else:
					_set_ant_target(Vector2i(5, 8))

		# Flip sprite based on movement direction
		if direction.x < 0:
			ant_sprite.flip_h = true
		elif direction.x > 0:
			ant_sprite.flip_h = false

		ant_sprite.position = ant_pos

	# Update info label
	label_info.text = "Tool: %s | Cells: %d solid / %d tunnel | Path: %d nodes" % [
		["NONE", "DIG", "FILL"][tool_mode],
		_count_solid(),
		GRID_WIDTH * GRID_HEIGHT - _count_solid(),
		ant_path.size()
	]

	# Auto-screenshot
	if not _screenshot_taken:
		_frame_count += 1
		if _frame_count >= 90:
			_screenshot_taken = true
			_capture_screenshot()

func _count_solid() -> int:
	var count: int = 0
	for cell in grid_state:
		if grid_state[cell]:
			count += 1
	return count

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var mouse_pos := get_global_mouse_position()
		var cell := _world_to_grid(mouse_pos)

		if cell.x < 0 or cell.x >= GRID_WIDTH or cell.y < 0 or cell.y >= GRID_HEIGHT:
			return

		match tool_mode:
			ToolMode.DIG:
				if grid_state.get(cell, true):
					grid_state[cell] = false
					soil_layer.erase_cell(cell)
					astar.set_point_solid(cell, false)
					# Recalculate ant path dynamically
					_set_ant_target(ant_target)
					print("[PoC] Dug cell %s — ant path recalculated (%d nodes)" % [cell, ant_path.size()])

			ToolMode.FILL:
				if not grid_state.get(cell, true):
					grid_state[cell] = true
					soil_layer.set_cell(cell, 0, TILE_SOLID)
					astar.set_point_solid(cell, true)
					_set_ant_target(ant_target)
					print("[PoC] Filled cell %s — ant path recalculated (%d nodes)" % [cell, ant_path.size()])

	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_F12:
			_capture_screenshot()

func _on_tool_dig() -> void:
	tool_mode = ToolMode.DIG
func _on_tool_fill() -> void:
	tool_mode = ToolMode.FILL
func _on_tool_none() -> void:
	tool_mode = ToolMode.NONE

func _capture_screenshot() -> String:
	if DisplayServer.get_name() == "headless":
		return ""
	var viewport := get_viewport()
	if viewport == null or viewport.get_texture() == null:
		return ""
	var img := viewport.get_texture().get_image()
	if img == null:
		return ""
	var save_path := "C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/poc_tilemap_astar_screenshot.png"
	var err := img.save_png(save_path)
	print("[PoC] Screenshot saved: %s (result: %s)" % [save_path, err == OK])
	return save_path
