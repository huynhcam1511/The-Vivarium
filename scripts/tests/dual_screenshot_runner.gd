extends Node

# Dual Screenshot Runner
# Captures:
# 1. TileMap mode screenshot (stylized_2d_in_engine_main_gameplay.png & main_gameplay_tilemap.png)
# 2. Switches to Legacy mode and captures (main_gameplay_legacy.png)

var _frame: int = 0
var _mode: int = 0

func _process(_delta: float) -> void:
	_frame += 1
	if _frame == 70:
		# Capture TileMap Mode
		_capture("C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/main_gameplay_tilemap.png")
		_capture("C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/stylized_2d_in_engine_main_gameplay.png")
		print("[Screenshot Runner] TileMap screenshot captured!")
		# Switch to Legacy
		GameManager.set_terrain_mode(false)
	elif _frame == 130:
		# Capture Legacy Mode
		_capture("C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/main_gameplay_legacy.png")
		print("[Screenshot Runner] Legacy screenshot captured!")
		# Switch back to TileMap
		GameManager.set_terrain_mode(true)
		get_tree().quit(0)

func _capture(path: String) -> void:
	var viewport = get_viewport()
	if viewport == null:
		return
	var img = viewport.get_texture().get_image()
	if img != null:
		img.save_png(path)
