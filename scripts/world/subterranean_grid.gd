extends Node2D
class_name SubterraneanGrid

# The Vivarium - Dynamic 2D Subterranean Grid
# Unified terrain system supporting:
# 1. Feature Flag: Toggle between New TileMapLayer (Stylized 2D + AStarGrid2D) and Legacy _draw()
# 2. Single unified source of truth: grid_data (Vector2i -> TileState)
# 3. Built-in AStarGrid2D for dynamic ant pathfinding & obstacle detection
# 4. Connected Dig/Fill task processing and signals

signal tile_dug(grid_pos: Vector2i, world_pos: Vector2)
signal tile_filled(grid_pos: Vector2i, world_pos: Vector2)
signal grid_updated

enum TileState {
	SOLID,        # Đất nguyên bản chưa đào (Textured Soil)
	TUNNEL,       # Đường hầm rỗng kiến đào (Excavated Cavity)
	PENDING_DIG,  # Đang chờ kiến đến đào (Construction Overlay)
	PENDING_FILL  # Đang chờ kiến mang bùn đến lấp (Construction Overlay)
}

enum ChamberType {
	NONE,
	QUEEN_NURSERY,
	GRANARY,
	FUNGUS_FARM,
	BARRACKS
}

const CELL_SIZE: int = 32
const GRID_WIDTH: int = 60   # 60 * 32 = 1920px wide (16:9 Landscape)
const GRID_HEIGHT: int = 26  # 26 * 32 = 832px depth (from y=880 to y=1712)
const OFFSET_Y: int = 880

# Textures & Atlas Resources
const SOIL_TEX = preload("res://assets/sprites/stylized_handpainted_soil.png")
const SOIL_ATLAS_TEX = preload("res://assets/tilesets/stylized_subterranean_atlas.png")

# Atlas coordinates on stylized_subterranean_atlas.png (64x64 textures on 32x32 tiles)
const TILE_TOP_LOAM: Vector2i = Vector2i(0, 0)
const TILE_ROOT_SOIL: Vector2i = Vector2i(1, 0)
const TILE_HUMUS_SOIL: Vector2i = Vector2i(0, 1)
const TILE_BEDROCK_SOIL: Vector2i = Vector2i(1, 1)

# Single Source of Truth
var grid_data: Dictionary = {} # Vector2i -> TileState
var chamber_data: Dictionary = {} # Vector2i -> ChamberType
var pending_dig_queue: Array[Vector2i] = []
var pending_fill_queue: Array[Vector2i] = []

# Integrated Systems
var astar: AStarGrid2D = AStarGrid2D.new()
var tilemap_layer: TileMapLayer = null

func _ready() -> void:
	_setup_astar()
	_setup_tilemap_layer()
	_init_grid()
	_sync_all_systems()
	
	# Connect to GameManager terrain feature flag signal
	if GameManager:
		if not GameManager.terrain_mode_changed.is_connected(_on_terrain_mode_changed):
			GameManager.terrain_mode_changed.connect(_on_terrain_mode_changed)
	
	_apply_terrain_visibility()
	queue_redraw()

func _setup_astar() -> void:
	astar.region = Rect2i(0, 0, GRID_WIDTH, GRID_HEIGHT)
	astar.cell_size = Vector2i(CELL_SIZE, CELL_SIZE)
	astar.offset = Vector2(CELL_SIZE * 0.5, OFFSET_Y + CELL_SIZE * 0.5)
	astar.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_NEVER
	astar.update()

func _setup_tilemap_layer() -> void:
	tilemap_layer = TileMapLayer.new()
	tilemap_layer.name = "TerrainTileMapLayer"
	tilemap_layer.position = Vector2(0, OFFSET_Y)
	tilemap_layer.z_index = 0
	
	# Create TileSet with Atlas Source
	var tileset = TileSet.new()
	tileset.tile_size = Vector2i(CELL_SIZE, CELL_SIZE)
	
	var atlas_source = TileSetAtlasSource.new()
	atlas_source.texture = SOIL_ATLAS_TEX
	atlas_source.texture_region_size = Vector2i(64, 64)
	
	# Register 4 tiles in 2x2 grid
	atlas_source.create_tile(TILE_TOP_LOAM)
	atlas_source.create_tile(TILE_ROOT_SOIL)
	atlas_source.create_tile(TILE_HUMUS_SOIL)
	atlas_source.create_tile(TILE_BEDROCK_SOIL)
	
	tileset.add_source(atlas_source, 0)
	tilemap_layer.tile_set = tileset
	add_child(tilemap_layer)

func _on_terrain_mode_changed(use_tilemap: bool) -> void:
	_apply_terrain_visibility()
	queue_redraw()

func _apply_terrain_visibility() -> void:
	var use_tilemap = GameManager.use_tilemap_terrain if GameManager else true
	if tilemap_layer:
		tilemap_layer.visible = use_tilemap

func _init_grid() -> void:
	grid_data.clear()
	chamber_data.clear()
	pending_dig_queue.clear()
	pending_fill_queue.clear()
	
	# 1. Khởi tạo đất nguyên bản trên toàn bộ lưới 1920px (60x26)
	for x in range(GRID_WIDTH):
		for y in range(GRID_HEIGHT):
			var pos = Vector2i(x, y)
			grid_data[pos] = TileState.SOLID
			chamber_data[pos] = ChamberType.NONE
			
	# 2. Trục thông gió chính từ mặt cạn x=29, 30 (Center shaft y=0..8)
	for y in range(0, 9):
		_set_tile_tunnel(Vector2i(29, y))
		_set_tile_tunnel(Vector2i(30, y))
		
	# 3. Buồng Hoàng Gia ở trung tâm (Queen chamber x=24..35, y=6..9)
	for x in range(24, 36):
		for y in range(6, 10):
			_set_tile_tunnel(Vector2i(x, y))
			chamber_data[Vector2i(x, y)] = ChamberType.QUEEN_NURSERY

	# 4. Khoang Ấu trùng ấm cúng bên trái (Nursery x=11..19, y=13..17)
	for x in range(11, 20):
		for y in range(13, 18):
			_set_tile_tunnel(Vector2i(x, y))
			chamber_data[Vector2i(x, y)] = ChamberType.QUEEN_NURSERY
	# Đường hầm nối buồng hoàng gia sang ấu trùng
	for x in range(18, 25):
		_set_tile_tunnel(Vector2i(x, 8))
	for y in range(8, 14):
		_set_tile_tunnel(Vector2i(18, y))

	# 5. Kho Hạt ngũ cốc khô ráo bên phải (Granary x=41..49, y=13..17)
	for x in range(41, 50):
		for y in range(13, 18):
			_set_tile_tunnel(Vector2i(x, y))
			chamber_data[Vector2i(x, y)] = ChamberType.GRANARY
	# Đường hầm nối buồng hoàng gia sang kho hạt
	for x in range(34, 42):
		_set_tile_tunnel(Vector2i(x, 8))
	for y in range(8, 14):
		_set_tile_tunnel(Vector2i(41, y))

	# 6. Khoang mở rộng ngủ đông sâu bên dưới (Deep chamber x=25..34, y=21..25)
	for x in range(25, 35):
		for y in range(21, 26):
			_set_tile_tunnel(Vector2i(x, y))
			chamber_data[Vector2i(x, y)] = ChamberType.BARRACKS
	# Trục đứng dẫn xuống tầng sâu
	for y in range(9, 22):
		_set_tile_tunnel(Vector2i(29, y))
		_set_tile_tunnel(Vector2i(30, y))

func _set_tile_tunnel(pos: Vector2i) -> void:
	if grid_data.has(pos):
		grid_data[pos] = TileState.TUNNEL

func _sync_all_systems() -> void:
	if tilemap_layer:
		tilemap_layer.clear()
	
	for x in range(GRID_WIDTH):
		for y in range(GRID_HEIGHT):
			var pos = Vector2i(x, y)
			_sync_single_cell(pos)

func _sync_single_cell(pos: Vector2i) -> void:
	var state = grid_data.get(pos, TileState.SOLID)
	var is_solid: bool = (state == TileState.SOLID or state == TileState.PENDING_DIG)
	
	# 1. Update AStar solid flag (TUNNEL or PENDING_FILL is walkable)
	astar.set_point_solid(pos, is_solid)
	
	# 2. Update TileMapLayer cell
	if tilemap_layer:
		if is_solid:
			var tile_coord: Vector2i = TILE_TOP_LOAM
			if pos.y < 8:
				tile_coord = TILE_TOP_LOAM if (pos.x + pos.y) % 5 != 0 else TILE_ROOT_SOIL
			elif pos.y < 18:
				tile_coord = TILE_HUMUS_SOIL if (pos.x + pos.y) % 4 != 0 else TILE_ROOT_SOIL
			else:
				tile_coord = TILE_BEDROCK_SOIL
			tilemap_layer.set_cell(pos, 0, tile_coord)
		else:
			tilemap_layer.erase_cell(pos)

func mark_tile_for_dig(world_pos: Vector2) -> bool:
	var grid_pos = world_to_grid(world_pos)
	if not grid_data.has(grid_pos):
		return false
	if grid_data[grid_pos] == TileState.SOLID:
		grid_data[grid_pos] = TileState.PENDING_DIG
		if not pending_dig_queue.has(grid_pos):
			pending_dig_queue.append(grid_pos)
		_sync_single_cell(grid_pos)
		queue_redraw()
		emit_signal("grid_updated")
		return true
	return false

func mark_tile_for_fill(world_pos: Vector2) -> bool:
	var grid_pos = world_to_grid(world_pos)
	if not grid_data.has(grid_pos):
		return false
	if grid_data[grid_pos] == TileState.TUNNEL:
		grid_data[grid_pos] = TileState.PENDING_FILL
		if not pending_fill_queue.has(grid_pos):
			pending_fill_queue.append(grid_pos)
		_sync_single_cell(grid_pos)
		queue_redraw()
		emit_signal("grid_updated")
		return true
	return false

func cancel_tile_action(world_pos: Vector2) -> void:
	var grid_pos = world_to_grid(world_pos)
	if not grid_data.has(grid_pos):
		return
	if grid_data[grid_pos] == TileState.PENDING_DIG:
		grid_data[grid_pos] = TileState.SOLID
		pending_dig_queue.erase(grid_pos)
		_sync_single_cell(grid_pos)
	elif grid_data[grid_pos] == TileState.PENDING_FILL:
		grid_data[grid_pos] = TileState.TUNNEL
		pending_fill_queue.erase(grid_pos)
		_sync_single_cell(grid_pos)
	queue_redraw()
	emit_signal("grid_updated")

func complete_dig(grid_pos: Vector2i) -> void:
	if grid_data.has(grid_pos) and grid_data[grid_pos] == TileState.PENDING_DIG:
		grid_data[grid_pos] = TileState.TUNNEL
		pending_dig_queue.erase(grid_pos)
		_sync_single_cell(grid_pos)
		queue_redraw()
		emit_signal("tile_dug", grid_pos, grid_to_world_center(grid_pos))
		emit_signal("grid_updated")

func complete_fill(grid_pos: Vector2i) -> void:
	if grid_data.has(grid_pos) and grid_data[grid_pos] == TileState.PENDING_FILL:
		grid_data[grid_pos] = TileState.SOLID
		chamber_data[grid_pos] = ChamberType.NONE
		pending_fill_queue.erase(grid_pos)
		_sync_single_cell(grid_pos)
		queue_redraw()
		emit_signal("tile_filled", grid_pos, grid_to_world_center(grid_pos))
		emit_signal("grid_updated")

func get_next_dig_target() -> Vector2i:
	if pending_dig_queue.size() > 0:
		return pending_dig_queue[0]
	return Vector2i(-1, -1)

func get_next_fill_target() -> Vector2i:
	if pending_fill_queue.size() > 0:
		return pending_fill_queue[0]
	return Vector2i(-1, -1)

# Navigation API via AStarGrid2D
func get_point_path(from_world: Vector2, to_world: Vector2) -> PackedVector2Array:
	var from_cell = world_to_grid(from_world)
	var to_cell = world_to_grid(to_world)
	
	from_cell.x = clampi(from_cell.x, 0, GRID_WIDTH - 1)
	from_cell.y = clampi(from_cell.y, 0, GRID_HEIGHT - 1)
	to_cell.x = clampi(to_cell.x, 0, GRID_WIDTH - 1)
	to_cell.y = clampi(to_cell.y, 0, GRID_HEIGHT - 1)
	
	return astar.get_point_path(from_cell, to_cell)

func get_id_path(from_cell: Vector2i, to_cell: Vector2i) -> Array[Vector2i]:
	from_cell.x = clampi(from_cell.x, 0, GRID_WIDTH - 1)
	from_cell.y = clampi(from_cell.y, 0, GRID_HEIGHT - 1)
	to_cell.x = clampi(to_cell.x, 0, GRID_WIDTH - 1)
	to_cell.y = clampi(to_cell.y, 0, GRID_HEIGHT - 1)
	
	return astar.get_id_path(from_cell, to_cell)

func is_cell_walkable(cell: Vector2i) -> bool:
	if not grid_data.has(cell):
		return false
	return not astar.is_point_solid(cell)

func is_tile_walkable(grid_pos: Vector2i) -> bool:
	if not grid_data.has(grid_pos):
		return false
	return grid_data[grid_pos] == TileState.TUNNEL or grid_data[grid_pos] == TileState.PENDING_FILL

func world_to_grid(world_pos: Vector2) -> Vector2i:
	var x = int(world_pos.x / CELL_SIZE)
	var y = int((world_pos.y - OFFSET_Y) / CELL_SIZE)
	return Vector2i(x, y)

func grid_to_world(grid_pos: Vector2i) -> Vector2:
	return Vector2(grid_pos.x * CELL_SIZE, grid_pos.y * CELL_SIZE + OFFSET_Y)

func grid_to_world_center(grid_pos: Vector2i) -> Vector2:
	return Vector2(grid_pos.x * CELL_SIZE + CELL_SIZE * 0.5, grid_pos.y * CELL_SIZE + OFFSET_Y + CELL_SIZE * 0.5)

func _draw() -> void:
	var use_tilemap = GameManager.use_tilemap_terrain if GameManager else true
	
	# If Legacy Terrain is selected, draw legacy textured soil rects
	if not use_tilemap:
		for x in range(GRID_WIDTH):
			for y in range(GRID_HEIGHT):
				var pos = Vector2i(x, y)
				var rect = Rect2(x * CELL_SIZE, y * CELL_SIZE + OFFSET_Y, CELL_SIZE, CELL_SIZE)
				var state = grid_data.get(pos, TileState.SOLID)
				
				var src_x = (x * CELL_SIZE) % 1024
				var src_y = (y * CELL_SIZE) % 1024
				var src_rect = Rect2(src_x, src_y, CELL_SIZE, CELL_SIZE)
				
				match state:
					TileState.SOLID:
						var depth_factor = float(y) / float(GRID_HEIGHT)
						var depth_modulate = Color(1.0, 1.0, 1.0, 1.0).lerp(Color(0.70, 0.65, 0.60, 1.0), depth_factor)
						draw_texture_rect_region(SOIL_TEX, rect, src_rect, depth_modulate)
						
					TileState.TUNNEL:
						var chamber = chamber_data.get(pos, ChamberType.NONE)
						var cavity_tint = Color(0.18, 0.12, 0.08, 0.85)
						if chamber == ChamberType.QUEEN_NURSERY:
							cavity_tint = Color(0.32, 0.18, 0.12, 0.70)
						elif chamber == ChamberType.GRANARY:
							cavity_tint = Color(0.26, 0.18, 0.10, 0.75)
						draw_texture_rect_region(SOIL_TEX, rect, src_rect, cavity_tint)
						
						if y > 0 and grid_data.get(Vector2i(x, y - 1), TileState.SOLID) == TileState.SOLID:
							draw_line(rect.position, rect.position + Vector2(CELL_SIZE, 0), Color(0.08, 0.05, 0.03, 0.75), 2.5)
						if y < GRID_HEIGHT - 1 and grid_data.get(Vector2i(x, y + 1), TileState.SOLID) == TileState.SOLID:
							draw_line(rect.position + Vector2(0, CELL_SIZE), rect.position + Vector2(CELL_SIZE, CELL_SIZE), Color(0.08, 0.05, 0.03, 0.75), 2.5)
						if x > 0 and grid_data.get(Vector2i(x - 1, y), TileState.SOLID) == TileState.SOLID:
							draw_line(rect.position, rect.position + Vector2(0, CELL_SIZE), Color(0.08, 0.05, 0.03, 0.75), 2.5)
						if x < GRID_WIDTH - 1 and grid_data.get(Vector2i(x + 1, y), TileState.SOLID) == TileState.SOLID:
							draw_line(rect.position + Vector2(CELL_SIZE, 0), rect.position + Vector2(CELL_SIZE, CELL_SIZE), Color(0.08, 0.05, 0.03, 0.75), 2.5)
	
	# Always render Construction Planning Overlays (Dig / Fill indicators)
	for pos in pending_dig_queue:
		var rect = Rect2(pos.x * CELL_SIZE, pos.y * CELL_SIZE + OFFSET_Y, CELL_SIZE, CELL_SIZE)
		draw_rect(rect, Color(0.88, 0.48, 0.98, 0.35), true)
		draw_rect(rect, Color(0.95, 0.65, 1.0, 0.9), false, 2.0)
		var center = rect.get_center()
		draw_line(center + Vector2(-6, -6), center + Vector2(6, 6), Color.WHITE, 2.0)
		draw_circle(center + Vector2(6, 6), 3.0, Color.GOLD)

	for pos in pending_fill_queue:
		var rect = Rect2(pos.x * CELL_SIZE, pos.y * CELL_SIZE + OFFSET_Y, CELL_SIZE, CELL_SIZE)
		draw_rect(rect, Color(0.95, 0.65, 0.35, 0.35), true)
		draw_rect(rect, Color(1.0, 0.8, 0.4, 0.9), false, 2.0)
		var center = rect.get_center()
		draw_circle(center, 4.0, Color(0.6, 0.38, 0.22))
