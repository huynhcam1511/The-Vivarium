extends Node

# The Living Colony - Real-Life Ecological Simulation Manager
signal resources_updated
signal climate_updated
signal weather_changed(new_weather: String)
signal colony_event(message: String)
signal pheromone_priority_updated

# --- PHYSICAL NATURAL RESOURCES (100% Thu gom & Tự tiết ra) ---
var clay_mud: int = 45           # Viên bùn đất kiến gom ngoài tự nhiên để xây vách
var beeswax: float = 28.5        # Gram sáp ong do ong thợ ăn mật tự tiết ra
var propolis: float = 14.0       # Gram keo ong gom từ nhựa cây để trát tổ diệt khuẩn
var insect_protein: float = 65.0 # Đạm dế/sâu côn trùng nuôi ấu trùng & kích thích đẻ
var pollen_bread: float = 85.0   # Bánh phấn hoa nén mật nuôi ấu trùng ong
var seeds_stock: int = 128       # Hạt cỏ/ngũ cốc bóc vỏ cất trong kho khô
var water_units: float = 50.0    # Nước sạch ong chở về phun sương làm mát tổ
var chitin_stock: int = 14       # Vỏ chitin thu từ xác côn trùng thiên địch để gia cố kén/vách

# --- 4 DÒNG MẬT ONG ĐƠN HOA SINH HỌC (MONOFLORAL HONEYS) ---
var honey_wildflower: float = 120.0 # Mật hoa rừng dại (đậm đà khoáng chất)
var honey_acacia: float = 95.0     # Mật hoa keo (trong suốt, chống đông lạnh mùa đông)
var honey_clover: float = 85.0     # Mật hoa cỏ ba lá (ngọt dịu, tăng trưởng ấu trùng)
var honey_blossom: float = 65.0    # Mật hoa mùa xuân (hương hoa quả, chuẩn bị phân đàn)
var keep_honey_for_bees: bool = true # Tôn chỉ sinh học: Luôn giữ lại mật cho đàn ong không chết đói!
const MIN_RESERVE_HONEY: float = 25.0

func get_total_honey() -> float:
	return honey_wildflower + honey_acacia + honey_clover + honey_blossom

# --- DEMOGRAPHICS & NATURAL CASTES ---
# Kiến (Polymorphism & Swarm Homeostasis)
var queen_ant_count: int = 1
var minor_nurse_ants: int = 8     # Y tá ấp trứng, mớm dịch
var media_forager_ants: int = 16  # Thợ đào hầm & vác đất, tha hạt
var major_soldier_ants: int = 4   # Thợ lớn đầu bự nghiền nát hạt cứng & hộ vệ
var undertaker_ants: int = 2      # Thợ quét dọn rác ra ngoài bãi rác
var ant_eggs: int = 65            # Trứng ngọc trai
var ant_larvae: int = 38          # Ấu trùng béo múp

# Ong (Age Polyethism)
var queen_bee_count: int = 1
var nurse_bees: int = 6           # Tiết sữa chúa nuôi ấu trùng non
var builder_bees: int = 4         # Tiết vảy sáp đắp ô lục giác
var guard_fanner_bees: int = 4    # Quạt gió làm đặc mật & điều hòa không khí
var forager_bees: int = 8         # Bay xa gom mật, phấn, nước, keo propolis
var bee_eggs: int = 40
var bee_larvae: int = 25
var capped_pupae: int = 18

# --- BẢNG ĐIỀU PHỐI PHEROMONE NỮ HOÀNG (WORKER PRIORITY MANAGEMENT) ---
var priority_building: float = 0.40      # 40% thi công buồng vách
var priority_brood_care: float = 0.30     # 30% chăm sóc trứng/ấu trùng
var priority_excavation: float = 0.20     # 20% đào hầm & lấp đất
var priority_foraging: float = 0.10       # 10% tuần tra kiếm mật hạt
var priority_mode: String = "LINEAR"      # "LINEAR" hoặc "EXPO"

# --- MICROCLIMATE & ATMOSPHERIC TRIAD ---
var temperature: float = 26.5    # °C (Nhiệt độ sinh cảnh hoàng kim 24 - 28°C)
var humidity: float = 68.0       # % RH (Độ ẩm ngậm sương)
var co2_level: float = 480.0     # ppm (Không khí thông thoáng)
var weather_state: String = "SUNNY" # "SUNNY", "RAINSTORM", "HEATWAVE", "WINTER_CHILL"
var current_biome: String = "微风原野 (Breeze Meadow)"
var current_season: String = "Autumn"
var season_week: int = 3

# --- INTERACTIVE TOOLS ---
var current_tool: String = "NONE" # "NONE", "DIG", "FILL", "DELETE"

var _cycle_timer: float = 0.0

func _ready() -> void:
	print("[The Living Colony] Ecological Simulation Engine Active.")

func _process(delta: float) -> void:
	_cycle_timer += delta
	if _cycle_timer >= 1.5:
		_cycle_timer = 0.0
		_simulate_ecological_tick()

func _simulate_ecological_tick() -> void:
	match weather_state:
		"SUNNY":
			_process_sunny_weather()
		"RAINSTORM":
			_process_rainstorm_weather()
		"HEATWAVE":
			_process_heatwave_weather()
		"WINTER_CHILL":
			_process_winter_weather()

	# Cân bằng nội môi sinh học bầy đàn (Swarm Homeostasis)
	_process_swarm_homeostasis()

	emit_signal("resources_updated")
	emit_signal("climate_updated")

func _process_sunny_weather() -> void:
	# Ong hái 4 loại mật hoa theo tỷ lệ hoa nở tự nhiên
	var forager_work = forager_bees * (priority_foraging * (2.0 if priority_mode == "EXPO" else 1.0))
	honey_wildflower += forager_work * 0.12
	honey_clover += forager_work * 0.08
	honey_acacia += forager_work * 0.05
	honey_blossom += forager_work * 0.03
	pollen_bread += forager_bees * 0.10
	propolis += forager_bees * 0.04
	
	# Ong thợ xây tiết vảy sáp tự nhiên từ mật hoa
	if get_total_honey() >= MIN_RESERVE_HONEY and builder_bees > 0:
		var honey_consumed = 0.25 * priority_building
		honey_wildflower = max(0.0, honey_wildflower - honey_consumed)
		beeswax += 0.05 * priority_building
		
	# Kiến đi tuần tra gom hạt cỏ, bùn đất và xác côn trùng
	var ant_forager_work = media_forager_ants * priority_foraging * 2.0
	seeds_stock += int(ant_forager_work * 0.25)
	clay_mud += int(ant_forager_work * 0.20)
	insect_protein += ant_forager_work * 0.10

	temperature = lerpf(temperature, 26.5, 0.03)
	humidity = lerpf(humidity, 68.0, 0.03)
	co2_level = lerpf(co2_level, 480.0, 0.02)

func _process_rainstorm_weather() -> void:
	# Ong ở yên trong tổ bảo vệ bánh sáp
	if get_total_honey() > MIN_RESERVE_HONEY:
		honey_wildflower = max(0.0, honey_wildflower - 0.3)
	humidity = min(92.0, humidity + 1.2)
	temperature = max(21.0, temperature - 0.3)

	# Nước mưa ngấm: Kiến mang bùn đắp đê ngăn ngập
	if clay_mud >= 2:
		clay_mud -= 2
	else:
		emit_signal("colony_event", "⚠️ Nước mưa rò rỉ vào cửa hầm! Đàn kiến khẩn cấp gom thêm bùn đất đắp đê!")

func _process_heatwave_weather() -> void:
	temperature = min(38.5, temperature + 0.5)
	humidity = max(40.0, humidity - 0.6)
	
	# Ong quạt gió và phun sương giải nhiệt (Evaporative cooling)
	if water_units >= 2.0:
		water_units -= 1.2
		temperature = max(28.0, temperature - 0.4)
	else:
		emit_signal("colony_event", "⚠️ Nhiệt độ tăng cao! Tổ ong cần cấp thêm nước để quạt mát tránh chảy sáp!")

func _process_winter_weather() -> void:
	temperature = max(14.0, temperature - 0.4)
	# Ong co cụm sưởi ấm cho Nữ hoàng
	if get_total_honey() > (MIN_RESERVE_HONEY if keep_honey_for_bees else 0.0):
		honey_acacia = max(0.0, honey_acacia - 0.25)
		honey_wildflower = max(0.0, honey_wildflower - 0.20)

func _process_swarm_homeostasis() -> void:
	# Kiến Chúa đẻ trứng tự nhiên khi có đủ protein
	if insect_protein >= 2.0 and randf() > 0.4:
		insect_protein -= 1.0
		ant_eggs += 1
		
	# Ấu trùng kiến ăn đạm và hạt ngũ cốc để lớn
	if ant_eggs > 5 and randf() > 0.6:
		ant_eggs -= 1
		ant_larvae += 1
		
	# TỰ ĐỘNG CÂN BẰNG NỘI MÔI BẦY ĐÀN (SWARM HOMEOSTASIS):
	# Kiểm tra tỷ lệ lính Major. Nếu lính Major < 12% tổng đàn, ấu trùng ưu tiên biến thái thành Lính Major!
	var total_ants = minor_nurse_ants + media_forager_ants + major_soldier_ants
	if ant_larvae > 10 and randf() > 0.70:
		ant_larvae -= 1
		var major_ratio = float(major_soldier_ants) / max(1.0, float(total_ants))
		
		if major_ratio < 0.12 and insect_protein >= 3.0:
			# Thiếu hụt lính -> mớm đạm cao cấp để hóa thành Lính Major đầu to!
			insect_protein -= 2.0
			major_soldier_ants += 1
			emit_signal("colony_event", "🧬 [Nội Môi Sinh Học] Đàn tự cân bằng: Một ấu trùng vừa vũ hóa thành Lính Hộ Vệ (Major)!")
		elif minor_nurse_ants < (total_ants * 0.25):
			minor_nurse_ants += 1
			emit_signal("colony_event", "Một chú kiến y tá (Minor) vừa ra đời để chăm trứng!")
		else:
			media_forager_ants += 1
			emit_signal("colony_event", "Một chú kiến thợ đào & kiếm ăn (Media) vừa hoàn thành vũ hóa!")

func set_pheromone_priority(building: float, brood: float, excavation: float, foraging: float, mode: String = "LINEAR") -> void:
	priority_building = building
	priority_brood_care = brood
	priority_excavation = excavation
	priority_foraging = foraging
	priority_mode = mode
	emit_signal("pheromone_priority_updated")
	emit_signal("colony_event", "Đã điều tiết nồng độ Pheromone ưu tiên (%s): Xây dựng %.0f%% | Ấu trùng %.0f%% | Đào hầm %.0f%% | Kiếm ăn %.0f%%" % [
		mode, building * 100, brood * 100, excavation * 100, foraging * 100
	])

func set_tool(tool_name: String) -> void:
	current_tool = tool_name
	emit_signal("colony_event", "Đã chọn công cụ quy hoạch: " + tool_name)

func set_weather(new_state: String) -> void:
	weather_state = new_state
	match weather_state:
		"SUNNY":
			emit_signal("colony_event", "☀️ Thời tiết nắng ấm dịu dàng! Đàn ong và kiến hăng hái ra ngoài thu hoạch.")
		"RAINSTORM":
			emit_signal("colony_event", "🌧️ Mưa bão kéo đến! Đàn ong trú tổ, kiến thợ đắp đê ngăn ngập.")
		"HEATWAVE":
			emit_signal("colony_event", "🔥 Nắng gắt thiêu đốt! Đàn ong đi tìm nước và quạt cánh làm mát.")
		"WINTER_CHILL":
			emit_signal("colony_event", "❄️ Gió lạnh mùa đông tràn về! Đàn ong co cụm giữ ấm cho Nữ hoàng.")
	emit_signal("weather_changed", weather_state)
	emit_signal("climate_updated")
