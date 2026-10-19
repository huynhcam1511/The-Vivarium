extends Node2D
class_name SubterraneanGrid

# The Vivarium - Dynamic 2D Subterranean Grid
# Unified terrain system supporting:
# 1. Feature Flag: Toggle between New TileMapLayer (Organic Autotile) and Legacy _draw()
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
const GRID_WIDTH: int = 80   # 80 * 32 = 2560px wide
const GRID_HEIGHT: int = 26  # 26 * 32 = 832px depth (from y=880 to y=1712)
const OFFSET_Y: int = 880

# Textures & Atlas Resources
const SOIL_TEX = preload("res://assets/sprites/stylized_handpainted_soil.png")
const CAVITY_BACKDROP_SCRIPT = preload("res://scripts/world/cavity_backdrop.gd")
const HYBRID_MASK_SCRIPT = preload("res://scripts/prototypes/hybrid_terrain_mask.gd")
const HYBRID_SHADER = preload("res://assets/shaders/organic_soil_hybrid.gdshader")
const ORGANIC_TILES_TEX = preload("res://assets/tilesets/seamless_stylized_soil_atlas.png")

# 12 Organic Soil Autotile Coordinates (from seamless_stylized_soil_atlas.png 32x32 tiles)
const TILE_SOLID: Vector2i = Vector2i(0, 0)
const TILE_WALL_N: Vector2i = Vector2i(1, 0)
const TILE_WALL_S: Vector2i = Vector2i(2, 0)
const TILE_WALL_W: Vector2i = Vector2i(3, 0)
const TILE_WALL_E: Vector2i = Vector2i(0, 1)
const TILE_CORNER_NW: Vector2i = Vector2i(1, 1)
const TILE_CORNER_NE: Vector2i = Vector2i(2, 1)
const TILE_CORNER_SW: Vector2i = Vector2i(3, 1)
const TILE_CORNER_SE: Vector2i = Vector2i(0, 2)
const TILE_ROOT: Vector2i = Vector2i(1, 3)
const TILE_STONE: Vector2i = Vector2i(2, 3)
const TILE_AMBER: Vector2i = Vector2i(3, 3)

# Single Source of Truth
var grid_data: Dictionary = {} # Vector2i -> TileState
var chamber_data: Dictionary = {} # Vector2i -> ChamberType
var pending_dig_queue: Array[Vector2i] = []
var pending_fill_queue: Array[Vector2i] = []

# Integrated Systems
var astar: AStarGrid2D = AStarGrid2D.new()
var tilemap_layer: TileMapLayer = null
var cavity_backdrop: Node2D = null
var hybrid_mask: RefCounted = null
var hybrid_rect: ColorRect = null

func _ready() -> void:
	cavity_backdrop = CAVITY_BACKDROP_SCRIPT.new()
	cavity_backdrop.name = "CavityBackdrop"
	cavity_backdrop.z_index = -2
	add_child(cavity_backdrop)
	grid_updated.connect(cavity_backdrop.queue_redraw)
	_setup_astar()
	_setup_tilemap_layer()
	_init_grid()
	_sync_all_systems()
	_setup_hybrid_visuals()
	
	# Connect to GameManager terrain feature flag signal
	if GameManager:
		if not GameManager.terrain_mode_changed.is_connected(_on_terrain_mode_changed):
			GameManager.terrain_mode_changed.connect(_on_terrain_mode_changed)
	
	_apply_terrain_visibility()
	cavity_backdrop.queue_redraw()
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
	tilemap_layer.modulate = Color(0.62, 0.57, 0.48, 1.0)
	
	# Create TileSet with Atlas Source (32x32 region on seamless_stylized_soil_atlas.png)
	var tileset = TileSet.new()
	tileset.tile_size = Vector2i(CELL_SIZE, CELL_SIZE)
	
	var atlas_source = TileSetAtlasSource.new()
	atlas_source.texture = ORGANIC_TILES_TEX
	atlas_source.texture_region_size = Vector2i(CELL_SIZE, CELL_SIZE)
	
	# Register organic autotile set (4x4 atlas layout)
	var all_tiles = [
		TILE_SOLID, TILE_WALL_N, TILE_WALL_S, TILE_WALL_W,
		TILE_WALL_E, TILE_CORNER_NW, TILE_CORNER_NE, TILE_CORNER_SW,
		TILE_CORNER_SE, TILE_ROOT, TILE_STONE, TILE_AMBER
	]
	for t in all_tiles:
		atlas_source.create_tile(t)
	
	tileset.add_source(atlas_source, 0)
	tilemap_layer.tile_set = tileset
	add_child(tilemap_layer)

func _setup_hybrid_visuals() -> void:
	hybrid_mask = HYBRID_MASK_SCRIPT.new()
	var mask_texture: ImageTexture = hybrid_mask.init_mask(GRID_WIDTH, GRID_HEIGHT, CELL_SIZE)
	for cell in grid_data:
		hybrid_mask.grid_data[cell] = grid_data[cell] == TileState.SOLID or grid_data[cell] == TileState.PENDING_DIG
	hybrid_mask.update_full_mask()
	hybrid_rect = ColorRect.new()
	hybrid_rect.name = "ContinuousSoil"
	hybrid_rect.position = Vector2(0, OFFSET_Y)
	hybrid_rect.size = Vector2(GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE)
	hybrid_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hybrid_rect.z_index = -1
	var soil_material := ShaderMaterial.new()
	soil_material.shader = HYBRID_SHADER
	soil_material.set_shader_parameter("soil_texture", SOIL_TEX)
	soil_material.set_shader_parameter("occupancy_mask", mask_texture)
	soil_material.set_shader_parameter("soil_texture_scale", Vector2(1024.0, 1024.0))
	soil_material.set_shader_parameter("soil_origin", Vector2(0.0, OFFSET_Y))
	soil_material.set_shader_parameter("mirror_horizontal", true)
	hybrid_rect.material = soil_material
	add_child(hybrid_rect)
	_apply_terrain_visibility()

func _on_terrain_mode_changed(use_tilemap: bool) -> void:
	_apply_terrain_visibility()
	queue_redraw()

func _apply_terrain_visibility() -> void:
	var use_tilemap = GameManager.use_tilemap_terrain if GameManager else true
	if tilemap_layer:
		tilemap_layer.visible = use_tilemap
	if hybrid_rect:
		hybrid_rect.visible = not use_tilemap
	if cavity_backdrop:
		cavity_backdrop.visible = use_tilemap

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
		
	# 3. Rounded royal chamber. The open footprint still includes the queen and both exits.
	for y in range(6, 10):
		var left_edge := 26 if y == 6 or y == 9 else 24
		var right_edge := 34 if y == 6 or y == 9 else 36
		for x in range(left_edge, right_edge):
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
	if hybrid_mask:
		for cell in grid_data:
			hybrid_mask.grid_data[cell] = grid_data[cell] == TileState.SOLID or grid_data[cell] == TileState.PENDING_DIG
		hybrid_mask.update_full_mask()

func _sync_single_cell(pos: Vector2i) -> void:
	var state = grid_data.get(pos, TileState.SOLID)
	var is_solid: bool = (state == TileState.SOLID or state == TileState.PENDING_DIG)
	
	# 1. Update AStar solid flag (TUNNEL or PENDING_FILL is walkable)
	astar.set_point_solid(pos, is_solid)
	
	# 2. Update TileMapLayer cell with organic autotiling
	if tilemap_layer:
		if is_solid:
			var tile_coord: Vector2i = _resolve_organic_tile(pos.x, pos.y)
			tilemap_layer.set_cell(pos, 0, tile_coord)
		else:
			tilemap_layer.erase_cell(pos)

func _resolve_organic_tile(x: int, y: int) -> Vector2i:
	# Check adjacent cells for cavities (TUNNEL)
	var n_open: bool = (y > 0) and (grid_data.get(Vector2i(x, y - 1), TileState.SOLID) == TileState.TUNNEL)
	var s_open: bool = (y < GRID_HEIGHT - 1) and (grid_data.get(Vector2i(x, y + 1), TileState.SOLID) == TileState.TUNNEL)
	var w_open: bool = (x > 0) and (grid_data.get(Vector2i(x - 1, y), TileState.SOLID) == TileState.TUNNEL)
	var e_open: bool = (x < GRID_WIDTH - 1) and (grid_data.get(Vector2i(x + 1, y), TileState.SOLID) == TileState.TUNNEL)
	
	# Corners
	if n_open and w_open:
		return TILE_CORNER_NW
	elif n_open and e_open:
		return TILE_CORNER_NE
	elif s_open and w_open:
		return TILE_CORNER_SW
	elif s_open and e_open:
		return TILE_CORNER_SE
	# Edges
	elif n_open:
		return TILE_WALL_N
	elif s_open:
		return TILE_WALL_S
	elif w_open:
		return TILE_WALL_W
	elif e_open:
		return TILE_WALL_E
		
	# Solid interior variations: embedded stones and roots
	var hash_val := (x * 73856093 ^ y * 19349663) % 100
	if hash_val < 6:
		return TILE_ROOT
	elif hash_val < 12:
		return TILE_STONE
	elif hash_val < 16:
		return TILE_AMBER
	return TILE_SOLID

func _update_cell_and_neighbors(pos: Vector2i) -> void:
	_sync_single_cell(pos)
	if hybrid_mask:
		hybrid_mask.set_cell(pos, grid_data[pos] == TileState.SOLID or grid_data[pos] == TileState.PENDING_DIG)
	var neighbors = [
		Vector2i(pos.x, pos.y - 1),
		Vector2i(pos.x, pos.y + 1),
		Vector2i(pos.x - 1, pos.y),
		Vector2i(pos.x + 1, pos.y),
		Vector2i(pos.x - 1, pos.y - 1),
		Vector2i(pos.x + 1, pos.y - 1),
		Vector2i(pos.x - 1, pos.y + 1),
		Vector2i(pos.x + 1, pos.y + 1)
	]
	for n in neighbors:
		if n.x >= 0 and n.x < GRID_WIDTH and n.y >= 0 and n.y < GRID_HEIGHT:
			_sync_single_cell(n)

func mark_tile_for_dig(world_pos: Vector2) -> bool:
	var grid_pos = world_to_grid(world_pos)
	if not grid_data.has(grid_pos):
		return false
	if grid_data[grid_pos] == TileState.SOLID:
		grid_data[grid_pos] = TileState.PENDING_DIG
		if not pending_dig_queue.has(grid_pos):
			pending_dig_queue.append(grid_pos)
		_update_cell_and_neighbors(grid_pos)
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
		_update_cell_and_neighbors(grid_pos)
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
		_update_cell_and_neighbors(grid_pos)
	elif grid_data[grid_pos] == TileState.PENDING_FILL:
		grid_data[grid_pos] = TileState.TUNNEL
		pending_fill_queue.erase(grid_pos)
		_update_cell_and_neighbors(grid_pos)
	queue_redraw()
	emit_signal("grid_updated")

func complete_dig(grid_pos: Vector2i) -> void:
	if grid_data.has(grid_pos) and grid_data[grid_pos] == TileState.PENDING_DIG:
		grid_data[grid_pos] = TileState.TUNNEL
		pending_dig_queue.erase(grid_pos)
		_update_cell_and_neighbors(grid_pos)
		queue_redraw()
		emit_signal("tile_dug", grid_pos, grid_to_world_center(grid_pos))
		emit_signal("grid_updated")

func complete_fill(grid_pos: Vector2i) -> void:
	if grid_data.has(grid_pos) and grid_data[grid_pos] == TileState.PENDING_FILL:
		grid_data[grid_pos] = TileState.SOLID
		chamber_data[grid_pos] = ChamberType.NONE
		pending_fill_queue.erase(grid_pos)
		_update_cell_and_neighbors(grid_pos)
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

# Serialization & Deserialization (Full Round-trip State Save/Load)
func serialize_grid() -> Dictionary:
	var solid_cells: Array[Array] = []
	var tunnel_cells: Array[Array] = []
	for pos in grid_data.keys():
		var s = grid_data[pos]
		if s == TileState.SOLID:
			solid_cells.append([pos.x, pos.y])
		else:
			tunnel_cells.append([pos.x, pos.y])
	return {
		"width": GRID_WIDTH,
		"height": GRID_HEIGHT,
		"solid_cells": solid_cells,
		"tunnel_cells": tunnel_cells
	}

func deserialize_grid(data: Dictionary) -> void:
	if not data.has("solid_cells") or not data.has("tunnel_cells"):
		return
	grid_data.clear()
	pending_dig_queue.clear()
	pending_fill_queue.clear()
	# Older saves cover 60 columns; keep the new outer ground solid.
	for x in range(GRID_WIDTH):
		for y in range(GRID_HEIGHT):
			grid_data[Vector2i(x, y)] = TileState.SOLID
	
	for c in data["solid_cells"]:
		var p = Vector2i(c[0], c[1])
		grid_data[p] = TileState.SOLID
		
	for c in data["tunnel_cells"]:
		var p = Vector2i(c[0], c[1])
		grid_data[p] = TileState.TUNNEL
		
	_sync_all_systems()
	queue_redraw()
	emit_signal("grid_updated")

func world_to_grid(world_pos: Vector2) -> Vector2i:
	var x = int(world_pos.x / CELL_SIZE)
	var y = int((world_pos.y - OFFSET_Y) / CELL_SIZE)
	return Vector2i(x, y)

func grid_to_world(grid_pos: Vector2i) -> Vector2:
	return Vector2(grid_pos.x * CELL_SIZE, grid_pos.y * CELL_SIZE + OFFSET_Y)

func grid_to_world_center(grid_pos: Vector2i) -> Vector2:
	return Vector2(grid_pos.x * CELL_SIZE + CELL_SIZE * 0.5, grid_pos.y * CELL_SIZE + OFFSET_Y + CELL_SIZE * 0.5)

func _draw() -> void:
	# Soil and cavity contours are drawn by ContinuousSoil; only tool marks live here.
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
