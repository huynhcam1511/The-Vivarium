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
	Vector2(960, 880),  # Surface entrance
	Vector2(780, 780),  # Clover bed
	Vector2(460, 760),  # Moss root
	Vector2(1240, 760), # Sand terrace
	Vector2(960, 880)
]

var _work_timer: float = 0.0

func _ready() -> void:
	_init_subterranean_grid()
	_spawn_initial_ants()
	_spawn_initial_bees()
	print("[The Vivarium] 16:9 Landscape World loaded with Subterranean Grid (60x26).")

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
	for i in range(4):
		var ant = ANT_SCENE.instantiate()
		ant.position = Vector2(460 + randf_range(-40, 40), 1380 + randf_range(-25, 25))
		ant.waypoints = tunnel_path_royal_to_nursery
		ant.speed = randf_range(38.0, 52.0)
		ant.role = "nurse"
		entities_node.add_child(ant)
		
	# 2. Granary workers
	for i in range(4):
		var ant = ANT_SCENE.instantiate()
		ant.position = Vector2(1460 + randf_range(-40, 40), 1380 + randf_range(-25, 25))
		ant.waypoints = tunnel_path_royal_to_granary
		ant.speed = randf_range(40.0, 54.0)
		ant.carrying_seed = true
		ant.role = "forager"
		entities_node.add_child(ant)
		
	# 3. Outworld foragers & earth excavators
	for i in range(4):
		var ant = ANT_SCENE.instantiate()
		ant.position = Vector2(960 + randf_range(-80, 80), 770 + randf_range(-10, 10))
		ant.waypoints = outworld_ant_path
		ant.speed = randf_range(42.0, 58.0)
		if i % 2 == 0:
			ant.role = "excavator"
			ant.carrying_mud = true
		else:
			ant.role = "forager"
		entities_node.add_child(ant)

func _spawn_initial_bees() -> void:
	for i in range(6):
		var bee = BEE_SCENE.instantiate()
		bee.position = Vector2(randf_range(600, 1500), randf_range(450, 700))
		entities_node.add_child(bee)
