@tool
class_name HybridTerrainMask
extends RefCounted

# Dimensions in grid cells and pixels
var grid_width: int = 40
var grid_height: int = 24
var cell_size: int = 32

var mask_width: int = 160
var mask_height: int = 96 # 4x resolution of grid (4 pixels per cell) for smooth gradient

var mask_image: Image
var mask_texture: ImageTexture
var grid_data: Dictionary = {} # Vector2i -> bool (true = solid, false = excavated)

func init_mask(w: int = 40, h: int = 24, c_size: int = 32) -> ImageTexture:
	grid_width = w
	grid_height = h
	cell_size = c_size
	mask_width = w * 4
	mask_height = h * 4

	# Default all cells to solid
	for x in range(grid_width):
		for y in range(grid_height):
			grid_data[Vector2i(x, y)] = true

	mask_image = Image.create(mask_width, mask_height, false, Image.FORMAT_RF)
	mask_texture = ImageTexture.create_from_image(mask_image)
	update_full_mask()
	return mask_texture

func set_cell(cell: Vector2i, solid: bool) -> void:
	if not grid_data.has(cell):
		return
	grid_data[cell] = solid
	update_cell_region(cell)

func dig_cell(cell: Vector2i) -> void:
	set_cell(cell, false)

func fill_cell(cell: Vector2i) -> void:
	set_cell(cell, true)

func is_solid(cell: Vector2i) -> bool:
	return grid_data.get(cell, true)

func update_full_mask() -> void:
	# Build base occupancy
	for my in range(mask_height):
		var cy: int = my / 4
		for mx in range(mask_width):
			var cx: int = mx / 4
			var solid: bool = grid_data.get(Vector2i(cx, cy), true)
			mask_image.set_pixel(mx, my, Color(1.0 if solid else 0.0, 0, 0, 1))

	# Apply box blur pass on CPU to soften the grid boundaries into smooth distance/density contours
	_smooth_mask()
	mask_texture.update(mask_image)

func update_cell_region(target_cell: Vector2i) -> void:
	# Update a localized region (radius 2 cells around target)
	var min_cx: int = max(0, target_cell.x - 2)
	var max_cx: int = min(grid_width - 1, target_cell.x + 2)
	var min_cy: int = max(0, target_cell.y - 2)
	var max_cy: int = min(grid_height - 1, target_cell.y + 2)

	var min_mx: int = min_cx * 4
	var max_mx: int = min(mask_width - 1, (max_cx + 1) * 4 - 1)
	var min_my: int = min_cy * 4
	var max_my: int = min(mask_height - 1, (max_cy + 1) * 4 - 1)

	# Recompute occupancy in region
	for my in range(min_my, max_my + 1):
		var cy: int = my / 4
		for mx in range(min_mx, max_mx + 1):
			var cx: int = mx / 4
			var solid: bool = grid_data.get(Vector2i(cx, cy), true)
			mask_image.set_pixel(mx, my, Color(1.0 if solid else 0.0, 0, 0, 1))

	_smooth_region(min_mx, min_my, max_mx, max_my)
	mask_texture.update(mask_image)

func _smooth_mask() -> void:
	_smooth_region(0, 0, mask_width - 1, mask_height - 1)

func _smooth_region(x0: int, y0: int, x1: int, y1: int) -> void:
	var temp_values: Array[float] = []
	var w: int = x1 - x0 + 1
	var h: int = y1 - y0 + 1
	temp_values.resize(w * h)

	# 5x5 separable box filter pass
	for y in range(y0, y1 + 1):
		for x in range(x0, x1 + 1):
			var sum: float = 0.0
			var count: int = 0
			for dy in range(-2, 3):
				var ny: int = clamp(y + dy, 0, mask_height - 1)
				for dx in range(-2, 3):
					var nx: int = clamp(x + dx, 0, mask_width - 1)
					sum += mask_image.get_pixel(nx, ny).r
					count += 1
			var idx: int = (y - y0) * w + (x - x0)
			temp_values[idx] = sum / float(count)

	# Write back smoothed values
	for y in range(y0, y1 + 1):
		for x in range(x0, x1 + 1):
			var idx: int = (y - y0) * w + (x - x0)
			var val: float = temp_values[idx]
			mask_image.set_pixel(x, y, Color(val, 0, 0, 1))
