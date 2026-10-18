extends SceneTree

# Performance Benchmark for Godot AStarGrid2D and Entity Path Updating
# Simulates 100, 500, and 1,000 entities navigating on a 60x40 vivarium subterranean grid (2,400 cells)

func _init() -> void:
	print("\n=======================================================")
	print("📊 RUNNING THE VIVARIUM PERFORMANCE BENCHMARK (ASTARGRID2D)")
	print("=======================================================")
	
	var grid_w := 60
	var grid_h := 40
	var astar := AStarGrid2D.new()
	astar.region = Rect2i(0, 0, grid_w, grid_h)
	astar.cell_size = Vector2i(32, 32)
	astar.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_NEVER
	astar.update()
	
	# Initial terrain setup: 70% solid, 30% interconnected tunnels & chambers
	for x in range(grid_w):
		for y in range(grid_h):
			astar.set_point_solid(Vector2i(x, y), true)
			
	# Carve 4 main horizontal arteries
	for r in [8, 16, 24, 32]:
		for x in range(2, grid_w - 2):
			astar.set_point_solid(Vector2i(x, r), false)
			
	# Carve 5 vertical shafts
	for c in [5, 18, 30, 42, 55]:
		for y in range(5, grid_h - 3):
			astar.set_point_solid(Vector2i(c, y), false)
			
	# Carve chambers
	for cx in [10, 25, 45]:
		for cy in [12, 28]:
			for x in range(cx - 3, cx + 4):
				for y in range(cy - 2, cy + 3):
					astar.set_point_solid(Vector2i(x, y), false)

	# Collect walkable cells
	var walkable: Array[Vector2i] = []
	for x in range(grid_w):
		for y in range(grid_h):
			var cell := Vector2i(x, y)
			if not astar.is_point_solid(cell):
				walkable.append(cell)
				
	print("Grid: %dx%d (%d cells), Walkable cells: %d" % [grid_w, grid_h, grid_w * grid_h, walkable.size()])
	
	# Test terrain update latency (single cell dig/fill vs batch 10 cells)
	var t0_up := Time.get_ticks_usec()
	astar.set_point_solid(Vector2i(20, 20), false)
	var t_single_dig := Time.get_ticks_usec() - t0_up
	print("\n⏱️ Single Cell Dig/Fill update latency: %d µs (%.3f ms)" % [t_single_dig, t_single_dig / 1000.0])
	
	for count in [100, 500, 1000]:
		benchmark_entities(astar, walkable, count)
		
	print("=======================================================\n")
	quit(0)

func benchmark_entities(astar: AStarGrid2D, walkable: Array[Vector2i], count: int) -> void:
	# Pick random pairs
	var pairs: Array = []
	for i in range(count):
		var s := walkable[randi() % walkable.size()]
		var e := walkable[randi() % walkable.size()]
		pairs.append([s, e])
		
	# Benchmark initial path computation for all entities
	var t0 := Time.get_ticks_usec()
	var total_nodes := 0
	for pair in pairs:
		var path := astar.get_id_path(pair[0], pair[1])
		total_nodes += path.size()
	var t_calc := Time.get_ticks_usec() - t0
	var avg_per_entity_us := float(t_calc) / float(count)
	
	# Benchmark frame simulation step (updating entity movement and index progression)
	var t0_step := Time.get_ticks_usec()
	var simulated_active := 0
	for i in range(count):
		# Typical per-frame movement vector math + distance check
		var pos := Vector2(100.0 + i, 200.0 + i)
		var target := Vector2(150.0 + i, 220.0 + i)
		var dir := (target - pos).normalized()
		pos += dir * 80.0 * 0.0166  # 60fps delta
		if pos.distance_squared_to(target) < 4.0:
			simulated_active += 1
	var t_step := Time.get_ticks_usec() - t0_step
	
	print("\n-------------------------------------------------------")
	print("🐜 BENCHMARK: %d ENTITIES" % count)
	print("  - Total path calculation time (all %d paths): %d µs (%.3f ms)" % [count, t_calc, t_calc / 1000.0])
	print("  - Average path calculation time per entity: %.2f µs (%.4f ms)" % [avg_per_entity_us, avg_per_entity_us / 1000.0])
	print("  - Entity Movement Simulation step (frame math): %d µs (%.3f ms)" % [t_step, t_step / 1000.0])
	var estimated_budget_percent := ((t_step / 1000.0) / 16.666) * 100.0
	print("  - Estimated frame time budget used (at 60 FPS / 16.6ms): %.2f%%" % estimated_budget_percent)
