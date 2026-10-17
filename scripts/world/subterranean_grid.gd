extends Node2D
class_name SubterraneanGrid

# The Vivarium - Dynamic 2D Subterranean Grid (Asset-based Textured Soil & Cavities)
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

const SOIL_TEX = preload("res://assets/sprites/realistic_soil_texture.png")

var grid_data: Dictionary = {} # Vector2i -> TileState
var chamber_data: Dictionary = {} # Vector2i -> ChamberType
var pending_dig_queue: Array[Vector2i] = []
var pending_fill_queue: Array[Vector2i] = []

func _ready() -> void:
	_init_grid()
	queue_redraw()

func _init_grid() -> void:
	grid_data.clear()
	chamber_data.clear()
	pending_dig_queue.clear()
	pending_fill_queue.clear()
	
	# Khởi tạo đất mùn nguyên bản trên toàn bộ lưới 1920px
	for x in range(GRID_WIDTH):
		for y in range(GRID_HEIGHT):
			var pos = Vector2i(x, y)
			grid_data[pos] = TileState.SOLID
			chamber_data[pos] = ChamberType.NONE
			
	# 1. Trục thông gió chính từ mặt cạn x=29, 30 (Center shaft y=0..8)
	for y in range(0, 9):
		_set_tile_tunnel(Vector2i(29, y))
		_set_tile_tunnel(Vector2i(30, y))
		
	# 2. Buồng Hoàng Gia ở trung tâm (Queen chamber x=24..35, y=6..9)
	for x in range(24, 36):
		for y in range(6, 10):
			_set_tile_tunnel(Vector2i(x, y))
			chamber_data[Vector2i(x, y)] = ChamberType.QUEEN_NURSERY

	# 3. Khoang Ấu trùng ấm cúng bên trái (Nursery x=11..19, y=13..17)
	for x in range(11, 20):
		for y in range(13, 18):
			_set_tile_tunnel(Vector2i(x, y))
			chamber_data[Vector2i(x, y)] = ChamberType.QUEEN_NURSERY
	# Đường hầm nối buồng hoàng gia sang ấu trùng
	for x in range(18, 25):
		_set_tile_tunnel(Vector2i(x, 8))
	for y in range(8, 14):
		_set_tile_tunnel(Vector2i(18, y))

	# 4. Kho Hạt ngũ cốc khô ráo bên phải (Granary x=41..49, y=13..17)
	for x in range(41, 50):
		for y in range(13, 18):
			_set_tile_tunnel(Vector2i(x, y))
			chamber_data[Vector2i(x, y)] = ChamberType.GRANARY
	# Đường hầm nối buồng hoàng gia sang kho hạt
	for x in range(34, 42):
		_set_tile_tunnel(Vector2i(x, 8))
	for y in range(8, 14):
		_set_tile_tunnel(Vector2i(41, y))

	# 5. Khoang mở rộng ngủ đông sâu bên dưới (Deep chamber x=25..34, y=21..25)
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

func mark_tile_for_dig(world_pos: Vector2) -> bool:
	var grid_pos = world_to_grid(world_pos)
	if not grid_data.has(grid_pos):
		return false
	if grid_data[grid_pos] == TileState.SOLID:
		grid_data[grid_pos] = TileState.PENDING_DIG
		if not pending_dig_queue.has(grid_pos):
			pending_dig_queue.append(grid_pos)
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
	elif grid_data[grid_pos] == TileState.PENDING_FILL:
		grid_data[grid_pos] = TileState.TUNNEL
		pending_fill_queue.erase(grid_pos)
	queue_redraw()
	emit_signal("grid_updated")

func complete_dig(grid_pos: Vector2i) -> void:
	if grid_data.has(grid_pos) and grid_data[grid_pos] == TileState.PENDING_DIG:
		grid_data[grid_pos] = TileState.TUNNEL
		pending_dig_queue.erase(grid_pos)
		queue_redraw()
		emit_signal("tile_dug", grid_pos, grid_to_world_center(grid_pos))
		emit_signal("grid_updated")

func complete_fill(grid_pos: Vector2i) -> void:
	if grid_data.has(grid_pos) and grid_data[grid_pos] == TileState.PENDING_FILL:
		grid_data[grid_pos] = TileState.SOLID
		chamber_data[grid_pos] = ChamberType.NONE
		pending_fill_queue.erase(grid_pos)
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

func world_to_grid(world_pos: Vector2) -> Vector2i:
	var x = int(world_pos.x / CELL_SIZE)
	var y = int((world_pos.y - OFFSET_Y) / CELL_SIZE)
	return Vector2i(x, y)

func grid_to_world(grid_pos: Vector2i) -> Vector2:
	return Vector2(grid_pos.x * CELL_SIZE, grid_pos.y * CELL_SIZE + OFFSET_Y)

func grid_to_world_center(grid_pos: Vector2i) -> Vector2:
	return Vector2(grid_pos.x * CELL_SIZE + CELL_SIZE * 0.5, grid_pos.y * CELL_SIZE + OFFSET_Y + CELL_SIZE * 0.5)

func is_tile_walkable(grid_pos: Vector2i) -> bool:
	if not grid_data.has(grid_pos):
		return false
	return grid_data[grid_pos] == TileState.TUNNEL or grid_data[grid_pos] == TileState.PENDING_FILL

func _draw() -> void:
	# Asset-based 2.5D Textured Soil & Excavated Cavities
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
					# Đất mùn hữu cơ thực sự với macro texture
					var depth_factor = float(y) / float(GRID_HEIGHT)
					var depth_modulate = Color(1.0, 1.0, 1.0, 1.0).lerp(Color(0.70, 0.65, 0.60, 1.0), depth_factor)
					draw_texture_rect_region(SOIL_TEX, rect, src_rect, depth_modulate)
					
				TileState.TUNNEL:
					# Hốc ngầm đã đào (Excavated Cavity): nền đất hang tối ẩm
					var chamber = chamber_data.get(pos, ChamberType.NONE)
					var cavity_tint = Color(0.18, 0.12, 0.08, 0.85)
					if chamber == ChamberType.QUEEN_NURSERY:
						cavity_tint = Color(0.32, 0.18, 0.12, 0.70)
					elif chamber == ChamberType.GRANARY:
						cavity_tint = Color(0.26, 0.18, 0.10, 0.75)
					draw_texture_rect_region(SOIL_TEX, rect, src_rect, cavity_tint)
					
					# Đắp viền bóng đất sần sùi tự nhiên xung quanh miệng hầm
					if y > 0 and grid_data.get(Vector2i(x, y - 1), TileState.SOLID) == TileState.SOLID:
						draw_line(rect.position, rect.position + Vector2(CELL_SIZE, 0), Color(0.08, 0.05, 0.03, 0.75), 2.5)
					if y < GRID_HEIGHT - 1 and grid_data.get(Vector2i(x, y + 1), TileState.SOLID) == TileState.SOLID:
						draw_line(rect.position + Vector2(0, CELL_SIZE), rect.position + Vector2(CELL_SIZE, CELL_SIZE), Color(0.08, 0.05, 0.03, 0.75), 2.5)
					if x > 0 and grid_data.get(Vector2i(x - 1, y), TileState.SOLID) == TileState.SOLID:
						draw_line(rect.position, rect.position + Vector2(0, CELL_SIZE), Color(0.08, 0.05, 0.03, 0.75), 2.5)
					if x < GRID_WIDTH - 1 and grid_data.get(Vector2i(x + 1, y), TileState.SOLID) == TileState.SOLID:
						draw_line(rect.position + Vector2(CELL_SIZE, 0), rect.position + Vector2(CELL_SIZE, CELL_SIZE), Color(0.08, 0.05, 0.03, 0.75), 2.5)
						
				TileState.PENDING_DIG:
					# Overlay quy hoạch đào hầm
					draw_texture_rect_region(SOIL_TEX, rect, src_rect, Color(0.55, 0.35, 0.65, 0.9))
					draw_rect(rect, Color(0.88, 0.48, 0.98, 0.85), false, 2.0)
					var center = rect.get_center()
					draw_line(center + Vector2(-5, -5), center + Vector2(5, 5), Color.WHITE, 2.0)
					draw_circle(center + Vector2(5, 5), 3.0, Color.GOLD)
					
				TileState.PENDING_FILL:
					# Overlay quy hoạch lấp bùn
					draw_texture_rect_region(SOIL_TEX, rect, src_rect, Color(0.70, 0.45, 0.30, 0.9))
					draw_rect(rect, Color(0.95, 0.65, 0.35, 0.9), false, 2.0)
					var center = rect.get_center()
					draw_circle(center, 4.0, Color(0.6, 0.38, 0.22))
