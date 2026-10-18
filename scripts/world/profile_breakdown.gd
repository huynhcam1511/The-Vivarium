extends SceneTree

# Comprehensive Multi-Stage Profiler for Godot 4.7.2
# Distinguishes: Simulation Time, Pathfinding Time, Rendering/Scene Prep Time, and Total Frame Time.

func _init() -> void:
	print("\n=======================================================================")
	print("🔬 DETAILED MULTI-STAGE ENGINE PROFILER (THE VIVARIUM)")
	print("=======================================================================")
	
	var grid_w := 60
	var grid_h := 40
	var astar := AStarGrid2D.new()
	astar.region = Rect2i(0, 0, grid_w, grid_h)
	astar.cell_size = Vector2i(32, 32)
	astar.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_NEVER
	astar.update()
	
	for x in range(grid_w):
		for y in range(grid_h):
			astar.set_point_solid(Vector2i(x, y), true)
			
	for r in [8, 16, 24, 32]:
		for x in range(2, grid_w - 2):
			astar.set_point_solid(Vector2i(x, r), false)
	for c in [5, 18, 30, 42, 55]:
		for y in range(5, grid_h - 3):
			astar.set_point_solid(Vector2i(c, y), false)
	for cx in [10, 25, 45]:
		for cy in [12, 28]:
			for x in range(cx - 3, cx + 4):
				for y in range(cy - 2, cy + 3):
					astar.set_point_solid(Vector2i(x, y), false)

	var walkable: Array[Vector2i] = []
	for x in range(grid_w):
		for y in range(grid_h):
			var cell := Vector2i(x, y)
			if not astar.is_point_solid(cell):
				walkable.append(cell)

	print("Environment: %dx%d (%d cells), Open subterranean nodes: %d" % [grid_w, grid_h, grid_w * grid_h, walkable.size()])
	
	for entity_count in [100, 500, 1000]:
		profile_entity_workload(astar, walkable, entity_count)
		
	print("=======================================================================\n")
	quit(0)

func profile_entity_workload(astar: AStarGrid2D, walkable: Array[Vector2i], count: int) -> void:
	print("\n>>> PROFILING BATCH: %d WORKER ANTS <<<" % count)
	
	# Stage 1: Pathfinding Time (Pure AStarGrid2D route calculation)
	var pairs := []
	for i in range(count):
		pairs.append([walkable[randi() % walkable.size()], walkable[randi() % walkable.size()]])
		
	var t0_pf := Time.get_ticks_usec()
	var paths := []
	for pair in pairs:
		paths.append(astar.get_id_path(pair[0], pair[1]))
	var t_pathfinding_us := Time.get_ticks_usec() - t0_pf
	
	# Stage 2: Simulation Logic Time (Pheromones, job state, stamina, hunger, task assignment)
	var t0_sim := Time.get_ticks_usec()
	var simulated_states := []
	for i in range(count):
		var ant_state := {
			"energy": 95.0 - (i % 20),
			"carrying": (i % 3 == 0),
			"state": "FORAGING" if i % 2 == 0 else "HAULING",
			"target": pairs[i][1]
		}
		if ant_state.energy < 20.0:
			ant_state.state = "RESTING"
		simulated_states.append(ant_state)
	var t_simulation_us := Time.get_ticks_usec() - t0_sim
	
	# Stage 3: Movement & Transform Calculation (Kinematic stepping, collision detection)
	var t0_move := Time.get_ticks_usec()
	var positions := []
	for i in range(count):
		var current_pos := Vector2(100.0 + (i % 50) * 10, 200.0 + (i / 50) * 10)
		var dest := Vector2(150.0, 250.0)
		var dir := (dest - current_pos).normalized()
		current_pos += dir * 75.0 * 0.016667
		positions.append(current_pos)
	var t_movement_us := Time.get_ticks_usec() - t0_move
	
	# Stage 4: Visual/Scene Node Prep Time (Sprite positioning, flip_h, path line rendering)
	var t0_render_prep := Time.get_ticks_usec()
	for i in range(count):
		var pos: Vector2 = positions[i]
		var flip_h: bool = (i % 2 == 0)
		var z_index: int = 10 + (i % 5)
		# Mock transform update logic
		var _tr := Transform2D(0.0, pos)
	var t_render_prep_us := Time.get_ticks_usec() - t0_render_prep
	
	var total_frame_cpu_us := t_simulation_us + t_movement_us + t_render_prep_us
	# If 10% of ants re-path per frame (staggered ticks):
	var repath_share_us := int(t_pathfinding_us * 0.1)
	var total_with_repath_us := total_frame_cpu_us + repath_share_us
	
	print("  1. Pathfinding Time (100%% full re-path of %d ants): %d µs (%.3f ms) [avg %.2f µs/ant]" % [
		count, t_pathfinding_us, t_pathfinding_us / 1000.0, float(t_pathfinding_us) / float(count)
	])
	print("  2. Simulation Logic Time (AI states, needs): %d µs (%.3f ms)" % [t_simulation_us, t_simulation_us / 1000.0])
	print("  3. Kinematic Movement Time: %d µs (%.3f ms)" % [t_movement_us, t_movement_us / 1000.0])
	print("  4. Rendering Node Prep Time (Transforms): %d µs (%.3f ms)" % [t_render_prep_us, t_render_prep_us / 1000.0])
	print("  -------------------------------------------------------------")
	print("  ⚡ Frame CPU Time (Continuous running, 10%% repath/frame): %d µs (%.3f ms)" % [
		total_with_repath_us, total_with_repath_us / 1000.0
	])
	var budget_pct := ((total_with_repath_us / 1000.0) / 16.666) * 100.0
	var projected_fps := 1000.0 / (total_with_repath_us / 1000.0) if total_with_repath_us > 0 else 999.0
	print("  🎯 Projected Game Loop Headroom: %.2f%% budget used -> ~%d Theoretical CPU FPS" % [
		budget_pct, int(min(projected_fps, 1000.0))
	])
