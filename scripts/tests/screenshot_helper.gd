extends Node

# Capture In-Engine Screenshots for Main Game with TileMapLayer
# Runs for 90 frames to allow animations and shaders to settle, captures full resolution screenshot

var _frame: int = 0

func _process(_delta: float) -> void:
	_frame += 1
	if _frame == 75:
		_capture()
	elif _frame >= 85:
		get_tree().quit(0)

func _capture() -> void:
	var viewport = get_viewport()
	if viewport == null:
		return
	var img = viewport.get_texture().get_image()
	if img == null:
		return
	var save_path1 = "C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/stylized_2d_in_engine_main_gameplay.png"
	var save_path2 = "C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/in_engine_main_gameplay.png"
	var save_path3 = "C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/phase4_main_integrated_screenshot.png"
	img.save_png(save_path1)
	img.save_png(save_path2)
	img.save_png(save_path3)
	print("[Screenshot Helper] Main game integration screenshots successfully captured!")
