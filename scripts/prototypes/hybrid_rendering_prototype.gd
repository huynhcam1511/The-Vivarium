extends Node2D

# Constants
const GRID_WIDTH: int = 40
const GRID_HEIGHT: int = 22
const CELL_SIZE: int = 32

const HybridTerrainMaskScript = preload("res://scripts/prototypes/hybrid_terrain_mask.gd")
const PrototypeAntScript = preload("res://scripts/prototypes/prototype_ant.gd")

# Nodes
@onready var terrain_rect: ColorRect = $TerrainRect
@onready var ant: Node2D = $PrototypeAnt
@onready var hud_label: Label = $HUD/MarginContainer/VBoxContainer/ModeLabel
@onready var instructions_label: Label = $HUD/MarginContainer/VBoxContainer/InstructionsLabel

# Terrain System
var terrain_mask: RefCounted
var astar: AStarGrid2D
var current_mode: String = "HYBRID" # "HYBRID", "TILEMAP_STYLE", "LEGACY"
var shader_material: ShaderMaterial

# Patrolling path
var patrol_points: Array[Vector2i] = []
var current_patrol_idx: int = 0

func _ready() -> void:
	_init_terrain_and_navigation()
	_carve_initial_subterranean_network()
	_setup_ant()
	_update_hud()

func _init_terrain_and_navigation() -> void:
	terrain_mask = HybridTerrainMaskScript.new()
	var mask_texture: ImageTexture = terrain_mask.init_mask(GRID_WIDTH, GRID_HEIGHT, CELL_SIZE)

	# Setup shader on the ColorRect
	shader_material = ShaderMaterial.new()
	shader_material.shader = load("res://assets/shaders/organic_soil_hybrid.gdshader")
	shader_material.set_shader_parameter("soil_texture", load("res://assets/sprites/stylized_handpainted_soil.png"))
	shader_material.set_shader_parameter("occupancy_mask", mask_texture)
	shader_material.set_shader_parameter("soil_texture_scale", Vector2(512.0, 512.0))
	terrain_rect.material = shader_material

	# Setup AStarGrid2D
	astar = AStarGrid2D.new()
	astar.region = Rect2i(0, 0, GRID_WIDTH, GRID_HEIGHT)
	astar.cell_size = Vector2(CELL_SIZE, CELL_SIZE)
	astar.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_NEVER
	astar.update()

	# Initially all cells solid (blocked)
	for x in range(GRID_WIDTH):
		for y in range(GRID_HEIGHT):
			astar.set_point_solid(Vector2i(x, y), true)

func _carve_initial_subterranean_network() -> void:
	# 1. Carve Surface Outworld entrance tunnel from (20, 2) to (20, 10)
	for y in range(2, 11):
		_excavate_cell(Vector2i(20, y))

	# 2. Carve curved tunnel connecting to chamber: (20, 10) -> (14, 14)
	var tunnel_coords: Array[Vector2i] = [
		Vector2i(20, 10), Vector2i(19, 10), Vector2i(18, 11),
		Vector2i(17, 11), Vector2i(16, 12), Vector2i(15, 13),
		Vector2i(14, 14), Vector2i(13, 14), Vector2i(12, 14)
	]
	for cell in tunnel_coords:
		_excavate_cell(cell)

	# 3. Carve Expandable Central Chamber around (10, 14) - radius 3 cells
	for dx in range(-3, 4):
		for dy in range(-2, 3):
			if dx * dx + dy * dy * 1.6 <= 9.0:
				_excavate_cell(Vector2i(10 + dx, 14 + dy))

	# 4. Another branch to Granary Cave at (28, 12)
	for x in range(20, 27):
		_excavate_cell(Vector2i(x, 10))
	for dx in range(-2, 3):
		for dy in range(-2, 3):
			if dx * dx + dy * dy <= 5.0:
				_excavate_cell(Vector2i(27 + dx, 12 + dy))

	terrain_mask.update_full_mask()

func _excavate_cell(cell: Vector2i) -> void:
	if cell.x < 0 or cell.x >= GRID_WIDTH or cell.y < 0 or cell.y >= GRID_HEIGHT:
		return
	terrain_mask.set_cell(cell, false)
	astar.set_point_solid(cell, false)

func _fill_cell(cell: Vector2i) -> void:
	if cell.x < 0 or cell.x >= GRID_WIDTH or cell.y < 0 or cell.y >= GRID_HEIGHT:
		return
	terrain_mask.set_cell(cell, true)
	astar.set_point_solid(cell, true)

func _setup_ant() -> void:
	ant.global_position = Vector2(10 * CELL_SIZE + CELL_SIZE * 0.5, 14 * CELL_SIZE + CELL_SIZE * 0.5)
	ant.path_completed.connect(_on_ant_path_completed)
	
	patrol_points = [
		Vector2i(10, 14), # Chamber center
		Vector2i(20, 10), # Tunnel junction
		Vector2i(20, 3),  # Surface entrance
		Vector2i(27, 12), # Granary cave
		Vector2i(10, 14)  # Return to chamber
	]
	_dispatch_ant_next_patrol()

func _dispatch_ant_next_patrol() -> void:
	current_patrol_idx = (current_patrol_idx + 1) % patrol_points.size()
	var target_cell: Vector2i = patrol_points[current_patrol_idx]
	var current_cell: Vector2i = Vector2i(int(ant.global_position.x / CELL_SIZE), int(ant.global_position.y / CELL_SIZE))

	var cell_path = astar.get_id_path(current_cell, target_cell)
	if cell_path.size() > 1:
		var world_points: Array[Vector2] = []
		for c in cell_path:
			world_points.append(Vector2(c.x * CELL_SIZE + CELL_SIZE * 0.5, c.y * CELL_SIZE + CELL_SIZE * 0.5))
		ant.follow_path(world_points)
	else:
		# If path blocked or reached, wait 1 sec and retry
		get_tree().create_timer(1.0).timeout.connect(_dispatch_ant_next_patrol)

func _on_ant_path_completed() -> void:
	get_tree().create_timer(0.8).timeout.connect(_dispatch_ant_next_patrol)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		var cell: Vector2i = Vector2i(int(event.position.x / CELL_SIZE), int(event.position.y / CELL_SIZE))
		if event.button_index == MOUSE_BUTTON_LEFT:
			# Interactive DIG
			_excavate_cell(cell)
			_update_hud("Excavated cell (%d, %d)" % [cell.x, cell.y])
		elif event.button_index == MOUSE_BUTTON_RIGHT:
			# Interactive FILL
			_fill_cell(cell)
			_update_hud("Filled cell (%d, %d)" % [cell.x, cell.y])

	elif event is InputEventKey and event.pressed:
		if event.keycode == KEY_SPACE or event.keycode == KEY_T:
			# Toggle Visual Modes to verify comparison
			if current_mode == "HYBRID":
				current_mode = "TILEMAP_STYLE"
				shader_material.set_shader_parameter("edge_threshold_low", 0.05)
				shader_material.set_shader_parameter("edge_threshold_high", 0.95)
			else:
				current_mode = "HYBRID"
				shader_material.set_shader_parameter("edge_threshold_low", 0.40)
				shader_material.set_shader_parameter("edge_threshold_high", 0.55)
			_update_hud()

func _update_hud(action_msg: String = "") -> void:
	if hud_label:
		hud_label.text = "Visual Mode: %s  |  Ant Status: %s" % [
			current_mode, "Patrolling" if ant and ant.is_moving else "Idle"
		]
	if instructions_label:
		var txt: String = "[L-Click]: Organic DIG  |  [R-Click]: FILL Soil  |  [Space/T]: Toggle Mode"
		if action_msg != "":
			txt += "\nLast Action: " + action_msg
		instructions_label.text = txt
