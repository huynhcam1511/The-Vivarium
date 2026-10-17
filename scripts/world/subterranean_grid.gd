extends Node2D
class_name SubterraneanGrid

# The Vivarium - Dynamic 2D Subterranean Grid (Dig / Fill / Room Zoning)
signal tile_dug(grid_pos: Vector2i, world_pos: Vector2)
signal tile_filled(grid_pos: Vector2i, world_pos: Vector2)
signal grid_updated

enum TileState {
	SOLID,        # Đất nguyên bản chưa đào
	TUNNEL,       # Đường hầm rỗng kiến có thể di chuyển
	PENDING_DIG,  # Đang chờ kiến đến đào
	PENDING_FILL  # Đang chờ kiến mang bùn đến lấp
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
	# Vẽ cấu trúc vách và lớp đất chân thực 16:9
	for x in range(GRID_WIDTH):
		for y in range(GRID_HEIGHT):
			var pos = Vector2i(x, y)
			var rect = Rect2(x * CELL_SIZE, y * CELL_SIZE + OFFSET_Y, CELL_SIZE, CELL_SIZE)
			var state = grid_data.get(pos, TileState.SOLID)
			
			match state:
				TileState.SOLID:
					# Lớp đất mùn hữu cơ tự nhiên với độ sâu
					var depth_factor = float(y) / float(GRID_HEIGHT)
					var soil_color = Color(0.18, 0.12, 0.08, 0.90).lerp(Color(0.10, 0.07, 0.05, 0.96), depth_factor)
					draw_rect(rect, soil_color, true)
					draw_rect(rect, Color(0.24, 0.16, 0.11, 0.25), false, 1.0)
				TileState.TUNNEL:
					# Đường hầm rỗng thoáng khí, viền vách đất sét nhẵn
					var chamber = chamber_data.get(pos, ChamberType.NONE)
					var chamber_bg = Color(0.14, 0.09, 0.06, 0.12)
					if chamber == ChamberType.QUEEN_NURSERY:
						chamber_bg = Color(0.60, 0.35, 0.18, 0.20)
					elif chamber == ChamberType.GRANARY:
						chamber_bg = Color(0.42, 0.34, 0.18, 0.18)
					elif chamber == ChamberType.BARRACKS:
						chamber_bg = Color(0.35, 0.20, 0.15, 0.18)
					draw_rect(rect, chamber_bg, true)
					draw_rect(rect, Color(0.44, 0.28, 0.18, 0.20), false, 1.0)
				TileState.PENDING_DIG:
					# Ô đang xếp hàng đào: Ký hiệu viền nét đứt tím & biểu tượng xẻng
					draw_rect(rect, Color(0.48, 0.22, 0.58, 0.45), true)
					draw_rect(rect, Color(0.88, 0.48, 0.98, 0.85), false, 2.0)
					var center = rect.get_center()
					draw_line(center + Vector2(-5, -5), center + Vector2(5, 5), Color.WHITE, 2.0)
					draw_circle(center + Vector2(5, 5), 3.0, Color.GOLD)
				TileState.PENDING_FILL:
					# Ô đang xếp hàng lấp bùn: Màu nâu đắp đê
					draw_rect(rect, Color(0.68, 0.42, 0.24, 0.55), true)
					draw_rect(rect, Color(0.95, 0.65, 0.35, 0.9), false, 2.0)
					var center = rect.get_center()
					draw_circle(center, 4.0, Color(0.6, 0.38, 0.22))
