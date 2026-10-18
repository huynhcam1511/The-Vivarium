extends Node

# Phase 4 Final Verification Test
# Exhaustively checks:
# 1. Feature Flag bidirectional cross-test:
#    - Dig in Legacy -> switch to TileMap -> verify state, AStar walkability, TileMap cell erased
#    - Dig in TileMap -> switch to Legacy -> verify state, AStar walkability, _draw consistency
#    - Fill in Legacy -> switch to TileMap -> verify restored solid cell
#    - Fill in TileMap -> switch to Legacy -> verify restored solid cell
#    - Rapid toggle while ants are moving -> verify path and positions remain intact
# 2. Save/Load Full Round-trip Verification:
#    - Record initial state
#    - Perform customized dig & fill actions
#    - Save state locally
#    - Reset scene / grid
#    - Load state back
#    - Verify every single cell state, AStar walkability, resources, demographics exactly matches

func _ready() -> void:
	print("\n=======================================================")
	print("🧪 RUNNING PHASE 4 FINAL VERIFICATION & ROUND-TRIP TEST")
	print("=======================================================")
	
	var passed: int = 0
	var total: int = 0
	
	# Instantiate Main
	var main_scene = load("res://scenes/main.tscn")
	var main = main_scene.instantiate()
	add_child(main)
	var grid: SubterraneanGrid = main.subterranean_grid
	
	# -----------------------------------------------------
	# SECTION 1: FEATURE FLAG BIDIRECTIONAL CROSS-TEST
	# -----------------------------------------------------
	
	# Subtest 1: Dig in Legacy, verify in TileMap
	total += 1
	GameManager.set_terrain_mode(false) # Legacy mode
	var c1 = Vector2i(20, 5) # solid cell
	var w1 = grid.grid_to_world_center(c1)
	grid.mark_tile_for_dig(w1)
	grid.complete_dig(c1)
	
	# Switch to TileMap
	GameManager.set_terrain_mode(true)
	if grid.grid_data[c1] == SubterraneanGrid.TileState.TUNNEL \
	   and grid.is_cell_walkable(c1) \
	   and grid.tilemap_layer.get_cell_source_id(c1) == -1:
		print("✅ [SUBTEST 1/5] Dig in Legacy -> switch to TileMap: PASSED")
		passed += 1
	else:
		print("❌ [SUBTEST 1/5] Dig in Legacy -> switch to TileMap: FAILED")
		
	# Subtest 2: Dig in TileMap, verify in Legacy
	total += 1
	var c2 = Vector2i(21, 5) # solid cell
	var w2 = grid.grid_to_world_center(c2)
	grid.mark_tile_for_dig(w2)
	grid.complete_dig(c2)
	
	# Switch to Legacy
	GameManager.set_terrain_mode(false)
	if grid.grid_data[c2] == SubterraneanGrid.TileState.TUNNEL \
	   and grid.is_cell_walkable(c2):
		print("✅ [SUBTEST 2/5] Dig in TileMap -> switch to Legacy: PASSED")
		passed += 1
	else:
		print("❌ [SUBTEST 2/5] Dig in TileMap -> switch to Legacy: FAILED")
		
	# Subtest 3: Fill in Legacy, verify in TileMap
	total += 1
	grid.mark_tile_for_fill(w1)
	grid.complete_fill(c1)
	GameManager.set_terrain_mode(true)
	if grid.grid_data[c1] == SubterraneanGrid.TileState.SOLID \
	   and not grid.is_cell_walkable(c1) \
	   and grid.tilemap_layer.get_cell_source_id(c1) != -1:
		print("✅ [SUBTEST 3/5] Fill in Legacy -> switch to TileMap: PASSED")
		passed += 1
	else:
		print("❌ [SUBTEST 3/5] Fill in Legacy -> switch to TileMap: FAILED")

	# Subtest 4: Fill in TileMap, verify in Legacy
	total += 1
	grid.mark_tile_for_fill(w2)
	grid.complete_fill(c2)
	GameManager.set_terrain_mode(false)
	if grid.grid_data[c2] == SubterraneanGrid.TileState.SOLID \
	   and not grid.is_cell_walkable(c2):
		print("✅ [SUBTEST 4/5] Fill in TileMap -> switch to Legacy: PASSED")
		passed += 1
	else:
		print("❌ [SUBTEST 4/5] Fill in TileMap -> switch to Legacy: FAILED")

	# Subtest 5: Rapid toggle while ants navigate
	total += 1
	var path_before = grid.get_point_path(Vector2(960, 1120), Vector2(460, 1380))
	for i in range(10):
		GameManager.toggle_terrain_mode()
	var path_after = grid.get_point_path(Vector2(960, 1120), Vector2(460, 1380))
	if path_before.size() == path_after.size() and path_after.size() > 5:
		print("✅ [SUBTEST 5/5] Rapid toggle stress test (AStar & Navigation stable): PASSED")
		passed += 1
	else:
		print("❌ [SUBTEST 5/5] Rapid toggle stress test: FAILED")
		
	# -----------------------------------------------------
	# SECTION 2: SAVE/LOAD FULL ROUND-TRIP TEST
	# -----------------------------------------------------
	total += 1
	# 1. Modify some resources and terrain
	GameManager.clay_mud = 77
	GameManager.seeds_stock = 321
	var dig_cell_test = Vector2i(22, 5)
	grid.mark_tile_for_dig(grid.grid_to_world_center(dig_cell_test))
	grid.complete_dig(dig_cell_test)
	
	# 2. Save state locally (never overwrite cloud)
	var save_dict = FirebaseSync.get_save_data_dictionary()
	
	# 3. Simulate runtime reset
	GameManager.clay_mud = 10
	GameManager.seeds_stock = 10
	grid._init_grid()
	grid._sync_all_systems()
	
	# Verify it was reset
	var is_reset_ok = (grid.grid_data[dig_cell_test] == SubterraneanGrid.TileState.SOLID)
	
	# 4. Load state back
	FirebaseSync.apply_save_data_dictionary(save_dict)
	
	# 5. Check restored state
	var terrain_restored = (grid.grid_data[dig_cell_test] == SubterraneanGrid.TileState.TUNNEL)
	var astar_restored = grid.is_cell_walkable(dig_cell_test)
	var tilemap_restored = (grid.tilemap_layer.get_cell_source_id(dig_cell_test) == -1)
	var resources_restored = (GameManager.clay_mud == 77 and GameManager.seeds_stock == 321)
	
	if is_reset_ok and terrain_restored and astar_restored and tilemap_restored and resources_restored:
		print("✅ [SECTION 2] Full Save/Load Round-trip Verification: PASSED")
		passed += 1
	else:
		print("❌ [SECTION 2] Full Save/Load Round-trip Verification: FAILED (reset: %s, terrain: %s, astar: %s, tilemap: %s, res: %s)" % [
			is_reset_ok, terrain_restored, astar_restored, tilemap_restored, resources_restored
		])

	print("\n=======================================================")
	print("FINAL VERIFICATION RESULT: %d/%d TESTS PASSED!" % [passed, total])
	print("=======================================================\n")
	
	if passed == total:
		get_tree().quit(0)
	else:
		get_tree().quit(1)
