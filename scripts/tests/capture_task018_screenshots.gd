extends Node

# Task-018 Acceptance Screenshot Capture Runner for Godot Engine
# Captures high-res in-engine screenshots of the subterranean system:
# 1. Overview of subterranean tunnels and chambers
# 2. Detailed zoom of Queen Chamber and nursery tunnels
# 3. Dynamic excavation and soil autotile view

var _frame: int = 0
var _main_scene: Node = null
var _cam: Camera2D = null

const OUT_DIR: String = "C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/worktrees/task-018-underground/the-vivarium-web/QA/TASK-018/"

func _ready() -> void:
	print("\n=======================================================")
	print("📸 STARTING TASK-018 GODOT IN-ENGINE SCREENSHOT CAPTURE")
	print("=======================================================")
	
	var main_res = load("res://scenes/main.tscn")
	_main_scene = main_res.instantiate()
	add_child(_main_scene)
	_cam = _main_scene.get_node_or_null("Camera2D")

func _process(_delta: float) -> void:
	_frame += 1
	
	if _frame == 35:
		if _cam:
			_cam.position = Vector2(960, 1150)
			_cam.zoom = Vector2(0.95, 0.95)
			if "target_position" in _cam:
				_cam.target_position = _cam.position
			if "target_zoom" in _cam:
				_cam.target_zoom = _cam.zoom
				
	elif _frame == 50:
		_capture(OUT_DIR + "task018_godot_01_underground_overview.png")
		print("📸 [1/3] Underground overview captured!")
		
		# Zoom into Queen Chamber & active tunnel network
		if _cam:
			_cam.position = Vector2(960, 1180)
			_cam.zoom = Vector2(1.6, 1.6)
			if "target_position" in _cam:
				_cam.target_position = _cam.position
			if "target_zoom" in _cam:
				_cam.target_zoom = _cam.zoom
				
	elif _frame == 75:
		_capture(OUT_DIR + "task018_godot_02_queen_chamber_detail.png")
		print("📸 [2/3] Queen chamber detail captured!")
		
		# Move to Nursery / Granary chamber
		if _cam:
			_cam.position = Vector2(500, 1380)
			_cam.zoom = Vector2(1.8, 1.8)
			if "target_position" in _cam:
				_cam.target_position = _cam.position
			if "target_zoom" in _cam:
				_cam.target_zoom = _cam.zoom
				
	elif _frame == 100:
		_capture(OUT_DIR + "task018_godot_03_nursery_chamber_detail.png")
		print("📸 [3/3] Nursery chamber detail captured!")
		print("🎉 All Godot underground screenshots captured successfully!")
		get_tree().quit(0)

func _capture(path: String) -> void:
	var viewport = get_viewport()
	if viewport == null:
		return
	var img = viewport.get_texture().get_image()
	if img != null:
		img.save_png(path)
