extends SceneTree

func _init() -> void:
	print("Starting automated screenshot capture for Hybrid Rendering Prototype...")
	var scene_res = load("res://scenes/prototypes/hybrid_rendering_prototype.tscn")
	var root_node = scene_res.instantiate()
	root.add_child(root_node)

	# Wait for first frames to render
	_capture_sequence(root_node)

func _capture_sequence(node: Node2D) -> void:
	# 1. Wait 0.8s for ant to position and shader to settle
	await create_timer(0.8).timeout
	var img1 = root.get_viewport().get_texture().get_image()
	img1.save_png("C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/hybrid_proto_1_initial.png")
	print("Saved: hybrid_proto_1_initial.png")

	# 2. Simulate user digging: expand chamber to the left and carve a new diagonal tunnel
	for x in range(3, 7):
		for y in range(13, 17):
			node._excavate_cell(Vector2i(x, y))
	for i in range(5):
		node._excavate_cell(Vector2i(7 + i, 16 + i))
	node.terrain_mask.update_full_mask()
	node._update_hud("Excavated West Chamber Expansion & Southwest Shaft")

	# Wait 0.6s
	await create_timer(0.6).timeout
	var img2 = root.get_viewport().get_texture().get_image()
	img2.save_png("C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/hybrid_proto_2_dug.png")
	print("Saved: hybrid_proto_2_dug.png")

	# 3. Toggle to hard-step Mode (demonstrating why tilemap/stepped cuts looked artificial)
	node.shader_material.set_shader_parameter("edge_threshold_low", 0.05)
	node.shader_material.set_shader_parameter("edge_threshold_high", 0.95)
	node.current_mode = "TILEMAP_STEPPED_REFERENCE"
	node._update_hud("Stepped Box Threshold Reference (Old Style)")

	await create_timer(0.5).timeout
	var img3 = root.get_viewport().get_texture().get_image()
	img3.save_png("C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/hybrid_proto_3_stepped_reference.png")
	print("Saved: hybrid_proto_3_stepped_reference.png")

	print("Screenshot capture sequence finished successfully!")
	quit()
