extends SceneTree

# Seamless Soil Atlas Builder in Godot 4
# Creates res://assets/tilesets/seamless_stylized_soil_atlas.png (256x256)
# Each tile is 32x32:
# (0, 0): Solid Loam - seamlessly sampled from stylized_handpainted_soil.png
# (1, 0): Wall N - upper border adjacent to cavity
# (2, 0): Wall S - lower border adjacent to cavity
# (3, 0): Wall W - left border adjacent to cavity
# (0, 1): Wall E - right border adjacent to cavity
# (1, 1): Corner NW - rounded inner corner
# (2, 1): Corner NE - rounded inner corner
# (3, 1): Corner SW - rounded inner corner
# (0, 2): Corner SE - rounded inner corner
# (1, 3): Root embedded variation
# (2, 3): Pebble/stone embedded variation
# (3, 3): Amber/gem embedded variation

func _init() -> void:
	print("[Atlas Builder] Generating seamless stylized organic soil tileset...")
	var src_img = Image.load_from_file("res://assets/sprites/stylized_handpainted_soil.png")
	if src_img == null:
		print("ERROR: Cannot load stylized_handpainted_soil.png")
		quit(1)
		return
		
	var atlas = Image.create_empty(256, 256, false, Image.FORMAT_RGBA8)
	var tile_size = 32
	
	# Helper to copy 32x32 block from src to atlas
	var copy_block = func(src_x: int, src_y: int, dst_x: int, dst_y: int):
		for y in range(tile_size):
			for x in range(tile_size):
				var c = src_img.get_pixel((src_x + x) % src_img.get_width(), (src_y + y) % src_img.get_height())
				atlas.set_pixel(dst_x * tile_size + x, dst_y * tile_size + y, c)
				
	# 1. Base solid tile at (0, 0) - pristine seamless loam
	copy_block.call(128, 280, 0, 0)
	
	# 2. Edge & Wall tiles with organic natural soil rim blending
	var apply_edge = func(dst_x: int, dst_y: int, src_x: int, src_y: int, edge_type: String):
		copy_block.call(src_x, src_y, dst_x, dst_y)
		var rim_color = Color(0.10, 0.06, 0.04, 1.0) # Dark rich earthen edge shadow
		for y in range(tile_size):
			for x in range(tile_size):
				var px = dst_x * tile_size + x
				var py = dst_y * tile_size + y
				var c = atlas.get_pixel(px, py)
				var factor = 0.0
				
				if edge_type == "N":
					if y < 8:
						factor = (8.0 - y) / 8.0
				elif edge_type == "S":
					if y > 23:
						factor = (y - 23.0) / 8.0
				elif edge_type == "W":
					if x < 8:
						factor = (8.0 - x) / 8.0
				elif edge_type == "E":
					if x > 23:
						factor = (x - 23.0) / 8.0
				elif edge_type == "NW":
					var d = Vector2(x, y).length()
					if d < 10.0:
						factor = (10.0 - d) / 10.0
				elif edge_type == "NE":
					var d = Vector2(31 - x, y).length()
					if d < 10.0:
						factor = (10.0 - d) / 10.0
				elif edge_type == "SW":
					var d = Vector2(x, 31 - y).length()
					if d < 10.0:
						factor = (10.0 - d) / 10.0
				elif edge_type == "SE":
					var d = Vector2(31 - x, 31 - y).length()
					if d < 10.0:
						factor = (10.0 - d) / 10.0
						
				if factor > 0.0:
					c = c.lerp(rim_color, factor * 0.70)
					atlas.set_pixel(px, py, c)
					
	# Walls (matching coordinates in subterranean_grid.gd)
	# TILE_WALL_N: (1, 0)
	# TILE_WALL_S: (2, 0)
	# TILE_WALL_W: (3, 0)
	# TILE_WALL_E: (0, 1)
	apply_edge.call(1, 0, 128, 280, "N")
	apply_edge.call(2, 0, 128, 280, "S")
	apply_edge.call(3, 0, 128, 280, "W")
	apply_edge.call(0, 1, 128, 280, "E")
	
	# Corners (matching coordinates in subterranean_grid.gd)
	# TILE_CORNER_NW: (1, 1)
	# TILE_CORNER_NE: (2, 1)
	# TILE_CORNER_SW: (3, 1)
	# TILE_CORNER_SE: (0, 2)
	apply_edge.call(1, 1, 128, 280, "NW")
	apply_edge.call(2, 1, 128, 280, "NE")
	apply_edge.call(3, 1, 128, 280, "SW")
	apply_edge.call(0, 2, 128, 280, "SE")
	
	# Variations
	# TILE_ROOT: (1, 3)
	# TILE_STONE: (2, 3)
	# TILE_AMBER: (3, 3)
	copy_block.call(80, 520, 1, 3)   # Natural root filament
	copy_block.call(640, 340, 2, 3)  # Small mineral stone
	copy_block.call(400, 220, 3, 3)  # Rich loam variant
	
	var out_path = "res://assets/tilesets/seamless_stylized_soil_atlas.png"
	var err = atlas.save_png(out_path)
	print("[Atlas Builder] Saved seamless atlas: ", err == OK, " at ", out_path)
	quit(0)
