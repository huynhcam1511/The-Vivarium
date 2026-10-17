extends Node2D
class_name SubterraneanGrid

# The Living Colony - Dynamic 2D Subterranean Grid (Dig / Fill / Room Zoning)
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
const GRID_WIDTH: int = 34   # 34 * 32 = 1088px width
const GRID_HEIGHT: int = 18  # 18 * 32 = 576px depth (from y=900 to y=1476)
const OFFSET_Y: int = 900

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
	
	# Khởi tạo đất nguyên bản
	for x in range(GRID_WIDTH):
		for y in range(GRID_HEIGHT):
			var pos = Vector2i(x, y)
			grid_data[pos] = TileState.SOLID
			chamber_data[pos] = ChamberType.NONE
			
	# Mở sẵn lối vào từ mặt đất và các buồng ban đầu
	# Trục đứng thông gió chính (Vertical entrance shaft x=16, 17)
	for y in range(0, 10):
		_set_tile_tunnel(Vector2i(16, y))
		_set_tile_tunnel(Vector2i(17, y))
		
	# Buồng Hoàng Gia ở trung tâm (Queen chamber x=14..19, y=6..8)
	for x in range(13, 21):
		for y in range(6, 9):
			_set_tile_tunnel(Vector2i(x, y))
			chamber_data[Vector2i(x, y)] = ChamberType.QUEEN_NURSERY
			
	# Kho hạt bên phải (Granary x=24..28, y=12..15)
	for x in range(24, 29):
		for y in range(12, 16):
			_set_tile_tunnel(Vector2i(x, y))
			chamber_data[Vector2i(x, y)] = ChamberType.GRANARY
	# Đường hầm nối buồng hoàng gia sang kho hạt
	for x in range(19, 25):
		_set_tile_tunnel(Vector2i(x, 8))
	for y in range(8, 13):
		_set_tile_tunnel(Vector2i(24, y))

	# Khoang ấu trùng bên trái (Nursery x=5..9, y=12..15)
	for x in range(5, 10):
		for y in range(12, 16):
			_set_tile_tunnel(Vector2i(x, y))
			chamber_data[Vector2i(x, y)] = ChamberType.QUEEN_NURSERY
	# Đường hầm nối buồng hoàng gia sang ấu trùng
	for x in range(9, 15):
		_set_tile_tunnel(Vector2i(x, 8))
	for y in range(8, 13):
		_set_tile_tunnel(Vector2i(9, y))

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
	# Vẽ cấu trúc vách và lớp đất chân thực
	for x in range(GRID_WIDTH):
		for y in range(GRID_HEIGHT):
			var pos = Vector2i(x, y)
			var rect = Rect2(x * CELL_SIZE, y * CELL_SIZE + OFFSET_Y, CELL_SIZE, CELL_SIZE)
			var state = grid_data.get(pos, TileState.SOLID)
			
			match state:
				TileState.SOLID:
					# Lớp đất mùn hữu cơ tự nhiên
					var depth_factor = float(y) / float(GRID_HEIGHT)
					var soil_color = Color(0.18, 0.12, 0.08, 0.88).lerp(Color(0.11, 0.08, 0.06, 0.95), depth_factor)
					draw_rect(rect, soil_color, true)
					draw_rect(rect, Color(0.24, 0.16, 0.11, 0.3), false, 1.0)
				TileState.TUNNEL:
					# Đường hầm rỗng thoáng khí, viền vách đất sét nhẵn
					var chamber = chamber_data.get(pos, ChamberType.NONE)
					var chamber_bg = Color(0.14, 0.09, 0.06, 0.15) # Mờ nhẹ trong suốt để thấy background
					if chamber == ChamberType.QUEEN_NURSERY:
						chamber_bg = Color(0.55, 0.35, 0.15, 0.22) # Ánh vàng mật
					elif chamber == ChamberType.GRANARY:
						chamber_bg = Color(0.40, 0.32, 0.18, 0.20)
					draw_rect(rect, chamber_bg, true)
					draw_rect(rect, Color(0.42, 0.28, 0.18, 0.25), false, 1.0)
				TileState.PENDING_DIG:
					# Ô đang xếp hàng đào: Ký hiệu viền nét đứt màu tím tím / vàng đất
					draw_rect(rect, Color(0.45, 0.25, 0.55, 0.45), true)
					draw_rect(rect, Color(0.85, 0.45, 0.95, 0.8), false, 2.0)
					# Vẽ biểu tượng xẻng nhỏ tâm ô
					var center = rect.get_center()
					draw_line(center + Vector2(-5, -5), center + Vector2(5, 5), Color.WHITE, 2.0)
					draw_circle(center + Vector2(5, 5), 3.0, Color.GOLD)
				TileState.PENDING_FILL:
					# Ô đang xếp hàng lấp bùn: Màu nâu đắp đê
					draw_rect(rect, Color(0.65, 0.42, 0.25, 0.55), true)
					draw_rect(rect, Color(0.95, 0.65, 0.35, 0.9), false, 2.0)
					var center = rect.get_center()
					draw_circle(center, 4.0, Color(0.6, 0.38, 0.22))
