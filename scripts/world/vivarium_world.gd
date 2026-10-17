extends Node2D

# The Living Colony - World Controller (Cross-Section Vivarium)
const ANT_SCENE = preload("res://scenes/entities/realistic_ant.tscn")
const BEE_SCENE = preload("res://scenes/entities/realistic_bee.tscn")
const SUBTERRANEAN_GRID_SCRIPT = preload("res://scripts/world/subterranean_grid.gd")

@onready var entities_node: Node2D = $Entities
var subterranean_grid: Node2D = null

# Waypoint loops for realistic ant patrols inside formicarium
var tunnel_path_royal_to_nursery: Array[Vector2] = [
	Vector2(540, 1120), # Royal chamber
	Vector2(320, 1140), # Left tunnel entrance
	Vector2(240, 1180), # Mid tunnel
	Vector2(190, 1380), # Brood Nursery
	Vector2(220, 1340),
	Vector2(320, 1140)
]

var tunnel_path_royal_to_granary: Array[Vector2] = [
	Vector2(540, 1120), # Royal chamber
	Vector2(760, 1140), # Right tunnel
	Vector2(840, 1180),
	Vector2(890, 1380), # Granary vault
	Vector2(840, 1260),
	Vector2(650, 1140)
]

var outworld_ant_path: Array[Vector2] = [
	Vector2(540, 880),  # Surface entrance
	Vector2(460, 780),  # Flower bed
	Vector2(380, 750),  # Moss root
	Vector2(620, 760),  # Sand terrace
	Vector2(540, 880)
]

var _work_timer: float = 0.0

func _ready() -> void:
	_init_subterranean_grid()
	_spawn_initial_ants()
	_spawn_initial_bees()
	print("[The Living Colony] World Canvas loaded with dynamic Subterranean Grid.")

func _init_subterranean_grid() -> void:
	subterranean_grid = Node2D.new()
	subterranean_grid.set_script(SUBTERRANEAN_GRID_SCRIPT)
	subterranean_grid.z_index = 2
	add_child(subterranean_grid)

func _process(delta: float) -> void:
	_work_timer += delta
	if _work_timer >= 2.0:
		_work_timer = 0.0
		_process_ant_construction_tasks()

func _process_ant_construction_tasks() -> void:
	if subterranean_grid == null:
		return
		
	# 1. Thực hiện đào hầm tự động (Excavation)
	var dig_target = subterranean_grid.get_next_dig_target()
	if dig_target != Vector2i(-1, -1):
		subterranean_grid.complete_dig(dig_target)
		GameManager.clay_mud += 1
		GameManager.emit_signal("colony_event", "⛏️ Kiến thợ đã cắn vỡ ô đất và tha lên 1 viên bùn đất (+1 Bùn)!")
		GameManager.emit_signal("resources_updated")
		return
		
	# 2. Thực hiện lấp hầm chống ngập (Filling)
	var fill_target = subterranean_grid.get_next_fill_target()
	if fill_target != Vector2i(-1, -1):
		if GameManager.clay_mud >= 1:
			GameManager.clay_mud -= 1
			subterranean_grid.complete_fill(fill_target)
			GameManager.emit_signal("colony_event", "🧱 Kiến thợ đã mang bùn đất đắp kín một ô hầm (-1 Bùn)!")
			GameManager.emit_signal("resources_updated")
		else:
			GameManager.emit_signal("colony_event", "⚠️ Thiếu bùn đất để lấp hầm! Đàn kiến cần đào thêm đất sét.")

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var mouse_pos = get_global_mouse_position()
		if mouse_pos.y >= 900.0 and subterranean_grid != null:
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
	# Spawn nurse ants patrolling brood nursery
	for i in range(4):
		var ant = ANT_SCENE.instantiate()
		ant.position = Vector2(190 + randf_range(-40, 40), 1380 + randf_range(-25, 25))
		ant.waypoints = tunnel_path_royal_to_nursery
		ant.speed = randf_range(35.0, 50.0)
		entities_node.add_child(ant)
		
	# Spawn granary workers
	for i in range(4):
		var ant = ANT_SCENE.instantiate()
		ant.position = Vector2(890 + randf_range(-40, 40), 1380 + randf_range(-25, 25))
		ant.waypoints = tunnel_path_royal_to_granary
		ant.speed = randf_range(38.0, 52.0)
		ant.carrying_seed = true
		entities_node.add_child(ant)
		
	# Spawn outworld foragers
	for i in range(3):
		var ant = ANT_SCENE.instantiate()
		ant.position = Vector2(540 + randf_range(-80, 80), 770 + randf_range(-10, 10))
		ant.waypoints = outworld_ant_path
		ant.speed = randf_range(40.0, 55.0)
		entities_node.add_child(ant)

func _spawn_initial_bees() -> void:
	for i in range(5):
		var bee = BEE_SCENE.instantiate()
		bee.position = Vector2(randf_range(350, 750), randf_range(500, 700))
		entities_node.add_child(bee)
