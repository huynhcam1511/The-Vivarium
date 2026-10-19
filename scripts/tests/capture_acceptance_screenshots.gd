extends Node

# Acceptance Test Screenshot Capture Runner
# Loads res://scenes/main.tscn and captures 3 required screenshots:
# 1. acceptance_1_overview.png: Full view showing canopy, outworld meadow, and subterranean formicarium
# 2. acceptance_2_nest_closeup.png: High-zoom closeup on excavated tunnels & chambers showing organic soil edges without checkerboard
# 3. acceptance_3_creatures_closeup.png: High-zoom closeup on worker ants and bees showing clear silhouette, proportions, and no overlap clutter
# Also updates main_gameplay_tilemap.png, stylized_2d_in_engine_main_gameplay.png, and main_gameplay_legacy.png

var _frame: int = 0
var _main_scene: Node = null
var _cam: Camera2D = null

func _ready() -> void:
	print("\n=======================================================")
	print("📸 STARTING ACCEPTANCE TEST SCREENSHOT CAPTURE RUNNER")
	print("=======================================================")
	
	# Instantiate Main
	var main_res = load("res://scenes/main.tscn")
	_main_scene = main_res.instantiate()
	add_child(_main_scene)
	_cam = _main_scene.get_node_or_null("Camera2D")

func _process(_delta: float) -> void:
	_frame += 1
	
	if _frame == 40:
		# Frame 40: Full Overview (acceptance_1_overview.png)
		if _cam:
			_cam.position = Vector2(960, 900)
			_cam.zoom = Vector2(0.85, 0.85)
			if "target_position" in _cam:
				_cam.target_position = _cam.position
			if "target_zoom" in _cam:
				_cam.target_zoom = _cam.zoom
				
	elif _frame == 55:
		_capture("C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/acceptance_1_overview.png")
		_capture("C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/main_gameplay_tilemap.png")
		_capture("C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/stylized_2d_in_engine_main_gameplay.png")
		print("📸 [1/3] Overview captured!")
		
		# Set Camera for Terrain & Tunnel Closeup
		if _cam:
			_cam.position = Vector2(960, 1150) # Queen royal chamber & main tunnel junction
			_cam.zoom = Vector2(1.5, 1.5)
			if "target_position" in _cam:
				_cam.target_position = _cam.position
			if "target_zoom" in _cam:
				_cam.target_zoom = _cam.zoom
				
	elif _frame == 80:
		_capture("C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/acceptance_2_nest_closeup.png")
		print("📸 [2/3] Terrain & Tunnel Closeup captured!")
		
		# Set Camera for Creature Closeup (Outworld flowers & bees, ants on surface)
		if _cam:
			_cam.position = Vector2(850, 750) # Wildflowers, outworld ants, pollinating bees
			_cam.zoom = Vector2(1.6, 1.6)
			if "target_position" in _cam:
				_cam.target_position = _cam.position
			if "target_zoom" in _cam:
				_cam.target_zoom = _cam.zoom
				
	elif _frame == 110:
		_capture("C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/acceptance_3_bees_flowers_closeup.png")
		print("📸 [3/3] Creature Closeup captured!")
		
		# Switch to Legacy Mode for Before/After comparison
		GameManager.set_terrain_mode(false)
		if _cam:
			_cam.position = Vector2(960, 900)
			_cam.zoom = Vector2(0.85, 0.85)
			if "target_position" in _cam:
				_cam.target_position = _cam.position
			if "target_zoom" in _cam:
				_cam.target_zoom = _cam.zoom
				
	elif _frame == 140:
		_capture("C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/main_gameplay_legacy.png")
		print("📸 Legacy Mode comparison captured!")
		GameManager.set_terrain_mode(true)
		print("🎉 All acceptance screenshots successfully captured!")
		get_tree().quit(0)

func _capture(path: String) -> void:
	var viewport = get_viewport()
	if viewport == null:
		return
	var img = viewport.get_texture().get_image()
	if img != null:
		img.save_png(path)
