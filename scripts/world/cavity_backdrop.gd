extends Node2D

# Opaque cavity floor keeps the meadow backdrop from showing through tunnels.
const CELL_SIZE := 32
const OFFSET_Y := 880
const CAVITY_COLOR := Color(0.12, 0.085, 0.065, 1.0)

func _draw() -> void:
	var grid = get_parent()
	for cell in grid.grid_data:
		var state: int = grid.grid_data[cell]
		if state == SubterraneanGrid.TileState.TUNNEL or state == SubterraneanGrid.TileState.PENDING_FILL:
			draw_rect(Rect2(cell.x * CELL_SIZE, cell.y * CELL_SIZE + OFFSET_Y, CELL_SIZE, CELL_SIZE), CAVITY_COLOR)
