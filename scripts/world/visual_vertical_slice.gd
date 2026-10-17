extends Node2D

# The Vivarium - Visual Vertical Slice Controller (Realistic 2.5D Nature Simulation)
# Demonstrates: Detailed tree & moss, wild honeycomb with bees, textured soil cross-section,
# organic excavated chamber with red light, physically connected tunnel, and working ants.

const ANT_SCENE = preload("res://scenes/entities/realistic_ant.tscn")
const BEE_SCENE = preload("res://scenes/entities/realistic_bee.tscn")
const QUEEN_SCENE = preload("res://scenes/entities/realistic_queen_ant.tscn")
const SUBTERRANEAN_GRID_SCRIPT = preload("res://scripts/world/subterranean_grid.gd")

@onready var entities_node: Node2D = $Entities
@onready var camera_node: Camera2D = $Camera2D

var subterranean_grid: Node2D = null
var _frame_count: int = 0
var _screenshot_taken: bool = false

# Waypoints for ants moving between surface outworld and the excavated chamber
var vertical_slice_ant_path: Array[Vector2] = [
	Vector2(640, 720),  # Surface wildflower entrance
	Vector2(640, 840),  # Top of excavated tunnel
	Vector2(640, 960),  # Mid tunnel
	Vector2(640, 1060), # Inside the excavated organic chamber
	Vector2(560, 1080), # Chamber nursery corner
	Vector2(720, 1080), # Chamber storage corner
	Vector2(640, 1060),
	Vector2(640, 960),
	Vector2(640, 840),
	Vector2(640, 720)
]

func _ready() -> void:
	_setup_vertical_slice_grid()
	_spawn_slice_creatures()
	print("[The Vivarium] Visual Vertical Slice active (Realistic 2.5D Nature Simulation).")

func _setup_vertical_slice_grid() -> void:
	subterranean_grid = Node2D.new()
	subterranean_grid.set_script(SUBTERRANEAN_GRID_SCRIPT)
	subterranean_grid.z_index = 2
	add_child(subterranean_grid)

func _process(_delta: float) -> void:
	if not _screenshot_taken:
		_frame_count += 1
		if _frame_count >= 60:
			_screenshot_taken = true
			capture_in_engine_screenshot()

func _spawn_slice_creatures() -> void:
	# 1. Queen ant inside the excavated chamber
	var queen = QUEEN_SCENE.instantiate()
	queen.position = Vector2(640, 1040)
	queen.scale = Vector2(1.15, 1.15)
	queen.z_index = 5
	entities_node.add_child(queen)

	# 2. Worker ants traversing the connected tunnel
	for i in range(4):
		var ant = ANT_SCENE.instantiate()
		ant.position = vertical_slice_ant_path[i * 2]
		ant.waypoints = vertical_slice_ant_path
		ant.speed = randf_range(38.0, 52.0)
		ant.z_index = 5
		if i % 2 == 0:
			ant.role = "excavator"
			ant.carrying_mud = true
		else:
			ant.role = "forager"
			ant.carrying_seed = true
		entities_node.add_child(ant)

	# 3. Worker bees attending honeycomb and wildflowers
	for i in range(4):
		var bee = BEE_SCENE.instantiate()
		bee.home_pos = Vector2(780, 340) # Honeycomb position
		var targets: Array[Vector2] = [
			Vector2(580, 680),
			Vector2(640, 680),
			Vector2(700, 675),
			Vector2(760, 670)
		]
		bee.flower_targets = targets
		bee.position = Vector2(randf_range(580, 780), randf_range(340, 660))
		bee.z_index = 6
		entities_node.add_child(bee)

func _unhandled_input(event: InputEvent) -> void:
	# Press F12 to capture an in-engine screenshot
	if event is InputEventKey and event.pressed and event.keycode == KEY_F12:
		capture_in_engine_screenshot()

func capture_in_engine_screenshot() -> String:
	var img = get_viewport().get_texture().get_image()
	var save_path = "C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/in_engine_vertical_slice.png"
	var err = img.save_png(save_path)
	print("[Screenshot] In-engine screenshot saved to: ", save_path, " (Result: ", err == OK, ")")
	return save_path
