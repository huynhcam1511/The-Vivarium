extends Node2D

# Construction overlay drawer for Playable Slice
# Displays subtle shovel/brick indicator badges on pending tiles

func _draw() -> void:
	var parent_slice = get_parent()
	if parent_slice == null:
		return
		
	var pending_map: Dictionary = parent_slice.pending_tasks
	for cell in pending_map.keys():
		var task: String = pending_map[cell]
		var rect := Rect2(cell.x * 32, cell.y * 32 + 880, 32, 32)
		if task == "DIG":
			# Soft purple excavation indicator
			draw_rect(rect, Color(0.7, 0.3, 0.9, 0.35), true)
			draw_rect(rect, Color(0.85, 0.5, 1.0, 0.9), false, 1.5)
		elif task == "FILL":
			# Warm clay filling indicator
			draw_rect(rect, Color(0.85, 0.55, 0.2, 0.35), true)
			draw_rect(rect, Color(1.0, 0.7, 0.3, 0.9), false, 1.5)
