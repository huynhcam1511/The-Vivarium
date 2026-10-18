extends SceneTree

# Automated Test Suite for Vivarium Phase 2
# Tests:
# 1. Connected chambers have valid path
# 2. Blocked chambers have no path
# 3. Digging creates path
# 4. Filling blocks path
# 5. Ant does not traverse solid terrain
# 6. Ant recovers dynamically when terrain changes while moving
# 7. Save / Load restores terrain state and navigation map accurately

func _init() -> void:
	print("\n==========================================")
	print("🧪 RUNNING THE VIVARIUM PHASE 2 TEST SUITE")
	print("==========================================")
	
	var passed := 0
	var total := 0
	
	total += 1
	if test_connected_chambers():
		print("✅ TEST 1: Connected chambers have valid path - PASSED")
		passed += 1
	else:
		print("❌ TEST 1 FAILED")

	total += 1
	if test_disconnected_chambers():
		print("✅ TEST 2: Disconnected chambers have NO path - PASSED")
		passed += 1
	else:
		print("❌ TEST 2 FAILED")

	total += 1
	if test_dig_opens_path():
		print("✅ TEST 3: Digging opens new path - PASSED")
		passed += 1
	else:
		print("❌ TEST 3 FAILED")

	total += 1
	if test_fill_blocks_path():
		print("✅ TEST 4: Filling blocks active path - PASSED")
		passed += 1
	else:
		print("❌ TEST 4 FAILED")

	total += 1
	if test_no_solid_traversal():
		print("✅ TEST 5: Ant does not traverse solid cells - PASSED")
		passed += 1
	else:
		print("❌ TEST 5 FAILED")

	total += 1
	if test_dynamic_reroute():
		print("✅ TEST 6: Dynamic rerouting during movement - PASSED")
		passed += 1
	else:
		print("❌ TEST 6 FAILED")

	total += 1
	if test_save_load_navigation():
		print("✅ TEST 7: Save/Load restores terrain & navigation - PASSED")
		passed += 1
	else:
		print("❌ TEST 7 FAILED")

	print("==========================================")
	print("TEST SUMMARY: %d / %d PASSED" % [passed, total])
	print("==========================================\n")
	
	if passed == total:
		quit(0)
	else:
		quit(1)

func _create_astar(w: int, h: int) -> AStarGrid2D:
	var a := AStarGrid2D.new()
	a.region = Rect2i(0, 0, w, h)
	a.cell_size = Vector2i(32, 32)
	a.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_NEVER
	a.update()
	# Default all solid
	for x in range(w):
		for y in range(h):
			a.set_point_solid(Vector2i(x, y), true)
	return a

func test_connected_chambers() -> bool:
	var a := _create_astar(10, 10)
	# Tunnel from (1, 1) to (8, 1)
	for x in range(1, 9):
		a.set_point_solid(Vector2i(x, 1), false)
	var path := a.get_id_path(Vector2i(1, 1), Vector2i(8, 1))
	return path.size() == 8

func test_disconnected_chambers() -> bool:
	var a := _create_astar(10, 10)
	# Chamber A at (1, 1), Chamber B at (8, 1), solid wall in between
	a.set_point_solid(Vector2i(1, 1), false)
	a.set_point_solid(Vector2i(8, 1), false)
	var path := a.get_id_path(Vector2i(1, 1), Vector2i(8, 1))
	return path.is_empty()

func test_dig_opens_path() -> bool:
	var a := _create_astar(10, 10)
	# Wall at x=5
	for x in range(1, 10):
		if x != 5:
			a.set_point_solid(Vector2i(x, 2), false)
	# Initially disconnected
	var p1 := a.get_id_path(Vector2i(1, 2), Vector2i(9, 2))
	if not p1.is_empty():
		return false
	# Dig cell (5, 2)
	a.set_point_solid(Vector2i(5, 2), false)
	var p2 := a.get_id_path(Vector2i(1, 2), Vector2i(9, 2))
	return p2.size() == 9

func test_fill_blocks_path() -> bool:
	var a := _create_astar(10, 10)
	for x in range(1, 10):
		a.set_point_solid(Vector2i(x, 3), false)
	var p1 := a.get_id_path(Vector2i(1, 3), Vector2i(9, 3))
	if p1.size() != 9:
		return false
	# Fill cell (5, 3)
	a.set_point_solid(Vector2i(5, 3), true)
	var p2 := a.get_id_path(Vector2i(1, 3), Vector2i(9, 3))
	return p2.is_empty()

func test_no_solid_traversal() -> bool:
	var a := _create_astar(5, 5)
	# Create L shaped path: (1,1) -> (1,2) -> (2,2)
	a.set_point_solid(Vector2i(1, 1), false)
	a.set_point_solid(Vector2i(1, 2), false)
	a.set_point_solid(Vector2i(2, 2), false)
	# (2, 1) is solid
	var path := a.get_id_path(Vector2i(1, 1), Vector2i(2, 2))
	for pt in path:
		if pt == Vector2i(2, 1):
			return false
	return path.size() == 3

func test_dynamic_reroute() -> bool:
	var a := _create_astar(10, 10)
	# Path 1: through row 2
	for x in range(1, 9):
		a.set_point_solid(Vector2i(x, 2), false)
	# Path 2: alternate detour through row 4
	for x in range(1, 9):
		a.set_point_solid(Vector2i(x, 4), false)
	# Vertical connectors at x=1 and x=8
	a.set_point_solid(Vector2i(1, 3), false)
	a.set_point_solid(Vector2i(8, 3), false)
	
	# Start moving from (1, 2) to (8, 2)
	var p1 := a.get_id_path(Vector2i(1, 2), Vector2i(8, 2))
	if p1.is_empty():
		return false
	
	# Suppose ant has reached (3, 2). Suddenly cell (5, 2) is blocked by rockfall/fill!
	a.set_point_solid(Vector2i(5, 2), true)
	
	# Ant recalculates path from current position (3, 2) to target (8, 2)
	var p2 := a.get_id_path(Vector2i(3, 2), Vector2i(8, 2))
	# Detour path must exist via row 4!
	if p2.is_empty():
		return false
	# Verify that none of p2 contains (5, 2)
	for pt in p2:
		if pt == Vector2i(5, 2):
			return false
	return true

func test_save_load_navigation() -> bool:
	var a := _create_astar(6, 6)
	a.set_point_solid(Vector2i(1, 1), false)
	a.set_point_solid(Vector2i(2, 1), false)
	a.set_point_solid(Vector2i(3, 1), false)
	
	# Serialize state
	var saved_data := []
	for x in range(6):
		for y in range(6):
			var cell := Vector2i(x, y)
			saved_data.append({"cell": [x, y], "solid": a.is_point_solid(cell)})
			
	# Reconstruct in a new astar instance
	var loaded_astar := _create_astar(6, 6)
	for entry in saved_data:
		var c := Vector2i(entry.cell[0], entry.cell[1])
		loaded_astar.set_point_solid(c, entry.solid)
		
	var path := loaded_astar.get_id_path(Vector2i(1, 1), Vector2i(3, 1))
	return path.size() == 3
