extends SceneTree

# Standalone Headless Benchmark for 1,000 - 5,000 Swarm Entities
const SWARM_STRESS_TEST_SCRIPT = preload("res://scripts/core/swarm_stress_test.gd")

func _init() -> void:
	print("====================================================")
	print("       THE VIVARIUM — SWARM STRESS TEST BENCHMARK   ")
	print("====================================================")
	
	var root_node = Node2D.new()
	root.add_child(root_node)
	
	var stress_test = Node2D.new()
	stress_test.set_script(SWARM_STRESS_TEST_SCRIPT)
	root_node.add_child(stress_test)
	
	var test_tiers = [1000, 2500, 5000]
	
	for tier in test_tiers:
		stress_test.set_swarm_size(tier)
		
		# Warm-up 10 frames
		for w in range(10):
			stress_test._process(0.0166)
			
		var start_time = Time.get_ticks_usec()
		var frames = 120
		var dt = 1.0 / 60.0
		
		for f in range(frames):
			stress_test._process(dt)
			
		var total_time_usec = Time.get_ticks_usec() - start_time
		var total_time_sec = float(total_time_usec) / 1_000_000.0
		var avg_frametime_ms = (float(total_time_usec) / float(frames)) / 1000.0
		var effective_fps = float(frames) / total_time_sec
		
		print("----------------------------------------------------")
		print("📊 TIER: %d Cá thể (Kiến: %d | Ong: %d)" % [tier, stress_test.ant_count, stress_test.bee_count])
		print("   ⚡ Thời gian tính toán 120 khung hình: %.4f giây" % total_time_sec)
		print("   ⏱️ Frametime CPU trung bình: %.3f ms / frame" % avg_frametime_ms)
		print("   🚀 Tốc độ xử lý tối đa (Theoretical FPS): %.1f FPS" % effective_fps)
		if avg_frametime_ms < 16.6:
			print("   ✅ ĐÁP ỨNG CHUẨN 60 FPS (Dư thừa hiệu năng: %.1fx)" % (16.6 / avg_frametime_ms))
		else:
			print("   ⚠️ Vượt ngưỡng 16.6ms cho 60 FPS")
			
	print("====================================================")
	print("       TẤT CẢ CÁC BÀI TEST ĐÃ HOÀN TẤT THÀNH CÔNG!  ")
	print("====================================================")
	quit()
