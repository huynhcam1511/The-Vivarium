extends Node

# The Vivarium - Dual Save System (Local Disk + Firebase Realtime Database)
signal save_completed(is_cloud: bool, message: String)
signal load_completed(is_cloud: bool, message: String)

const LOCAL_SAVE_PATH: String = "user://the_vivarium_save.json"
const FIREBASE_RTDB_URL: String = "https://the-vivarium-default-rtdb.asia-southeast1.firebasedatabase.app/saves/"

var player_id: String = "player_colony_1"
var auto_save_timer: float = 0.0
const AUTO_SAVE_INTERVAL: float = 120.0 # Tự động lưu mỗi 2 phút

var http_request_save: HTTPRequest
var http_request_load: HTTPRequest

func _ready() -> void:
	http_request_save = HTTPRequest.new()
	add_child(http_request_save)
	http_request_save.request_completed.connect(_on_save_request_completed)
	
	http_request_load = HTTPRequest.new()
	add_child(http_request_load)
	http_request_load.request_completed.connect(_on_load_request_completed)
	
	print("[The Vivarium - Save System] Dual-Save Controller initialized with Firebase RTDB (Singapore).")
	# Ưu tiên thử nạp từ Cloud, nếu không có thì nạp từ Local
	call_deferred("load_game_all")

func _process(delta: float) -> void:
	auto_save_timer += delta
	if auto_save_timer >= AUTO_SAVE_INTERVAL:
		auto_save_timer = 0.0
		save_game_all("Auto-save tự động")

func get_save_data_dictionary() -> Dictionary:
	return {
		"game_title": "The Vivarium",
		"version": "2.0",
		"timestamp": Time.get_datetime_string_from_system(),
		"biome": GameManager.current_biome,
		"weather": GameManager.weather_state,
		"resources": {
			"clay_mud": GameManager.clay_mud,
			"beeswax": GameManager.beeswax,
			"propolis": GameManager.propolis,
			"insect_protein": GameManager.insect_protein,
			"pollen_bread": GameManager.pollen_bread,
			"seeds_stock": GameManager.seeds_stock,
			"water_units": GameManager.water_units,
			"chitin_stock": GameManager.chitin_stock,
			"honey_wildflower": GameManager.honey_wildflower,
			"honey_acacia": GameManager.honey_acacia,
			"honey_clover": GameManager.honey_clover,
			"honey_blossom": GameManager.honey_blossom,
			"keep_honey_for_bees": GameManager.keep_honey_for_bees
		},
		"demographics": {
			"queen_ant": GameManager.queen_ant_count,
			"minor_nurse": GameManager.minor_nurse_ants,
			"media_forager": GameManager.media_forager_ants,
			"major_soldier": GameManager.major_soldier_ants,
			"ant_eggs": GameManager.ant_eggs,
			"ant_larvae": GameManager.ant_larvae,
			"queen_bee": GameManager.queen_bee_count,
			"nurse_bees": GameManager.nurse_bees,
			"builder_bees": GameManager.builder_bees,
			"guard_fanner_bees": GameManager.guard_fanner_bees,
			"forager_bees": GameManager.forager_bees
		},
		"atmosphere": {
			"temp": GameManager.temperature,
			"humidity": GameManager.humidity,
			"co2": GameManager.co2_level
		},
		"pheromone_priority": {
			"building": GameManager.priority_building,
			"brood_care": GameManager.priority_brood_care,
			"excavation": GameManager.priority_excavation,
			"foraging": GameManager.priority_foraging,
			"mode": GameManager.priority_mode
		}
	}

func apply_save_data_dictionary(data: Dictionary) -> void:
	if data.has("resources"):
		var res = data["resources"]
		GameManager.clay_mud = int(res.get("clay_mud", 45))
		GameManager.beeswax = float(res.get("beeswax", 28.5))
		GameManager.propolis = float(res.get("propolis", 14.0))
		GameManager.insect_protein = float(res.get("insect_protein", 65.0))
		GameManager.pollen_bread = float(res.get("pollen_bread", 85.0))
		GameManager.seeds_stock = int(res.get("seeds_stock", 128))
		GameManager.chitin_stock = int(res.get("chitin_stock", 14))
		GameManager.honey_wildflower = float(res.get("honey_wildflower", 120.0))
		GameManager.honey_acacia = float(res.get("honey_acacia", 95.0))
		GameManager.honey_clover = float(res.get("honey_clover", 85.0))
		GameManager.honey_blossom = float(res.get("honey_blossom", 65.0))
		GameManager.keep_honey_for_bees = bool(res.get("keep_honey_for_bees", true))
		
	if data.has("demographics"):
		var demo = data["demographics"]
		GameManager.minor_nurse_ants = int(demo.get("minor_nurse", 8))
		GameManager.media_forager_ants = int(demo.get("media_forager", 16))
		GameManager.major_soldier_ants = int(demo.get("major_soldier", 4))
		GameManager.ant_eggs = int(demo.get("ant_eggs", 65))
		GameManager.ant_larvae = int(demo.get("ant_larvae", 38))
		GameManager.nurse_bees = int(demo.get("nurse_bees", 6))
		GameManager.builder_bees = int(demo.get("builder_bees", 4))
		GameManager.guard_fanner_bees = int(demo.get("guard_fanner_bees", 4))
		GameManager.forager_bees = int(demo.get("forager_bees", 8))
		
	if data.has("atmosphere"):
		var atm = data["atmosphere"]
		GameManager.temperature = float(atm.get("temp", 26.5))
		GameManager.humidity = float(atm.get("humidity", 68.0))
		GameManager.co2_level = float(atm.get("co2", 480.0))
		
	if data.has("pheromone_priority"):
		var phero = data["pheromone_priority"]
		GameManager.priority_building = float(phero.get("building", 0.4))
		GameManager.priority_brood_care = float(phero.get("brood_care", 0.3))
		GameManager.priority_excavation = float(phero.get("excavation", 0.2))
		GameManager.priority_foraging = float(phero.get("foraging", 0.1))
		GameManager.priority_mode = str(phero.get("mode", "LINEAR"))
		
	GameManager.emit_signal("resources_updated")
	GameManager.emit_signal("climate_updated")
	GameManager.emit_signal("pheromone_priority_updated")

# --- 1. LOCAL SAVE & LOAD (Offline) ---

func save_game_local() -> bool:
	var data = get_save_data_dictionary()
	var file = FileAccess.open(LOCAL_SAVE_PATH, FileAccess.WRITE)
	if file != null:
		file.store_string(JSON.stringify(data, "\t"))
		file.close()
		emit_signal("save_completed", false, "Đã lưu vào ổ cứng máy tính thành công!")
		return true
	return false

func load_game_local() -> bool:
	if not FileAccess.file_exists(LOCAL_SAVE_PATH):
		return false
	var file = FileAccess.open(LOCAL_SAVE_PATH, FileAccess.READ)
	if file != null:
		var content = file.get_as_text()
		file.close()
		var json = JSON.new()
		if json.parse(content) == OK and json.data is Dictionary:
			apply_save_data_dictionary(json.data)
			emit_signal("load_completed", false, "Đã nạp lại thế giới từ bản lưu ổ cứng!")
			GameManager.emit_signal("colony_event", "🌱 Thế giới The Vivarium đã được khôi phục nguyên vẹn!")
			return true
	return false

# --- 2. FIREBASE REALTIME DATABASE CLOUD SAVE (Online Sync) ---

func save_game_all(reason: String = "") -> void:
	save_game_local()
	save_game_cloud()
	var msg = "💾 [Lưu Game] Tiến trình đã được bảo vệ (Ổ cứng + Đám mây Firebase)!"
	if reason != "":
		msg += " (" + reason + ")"
	GameManager.emit_signal("colony_event", msg)

func load_game_all() -> void:
	# Đầu tiên nạp ngay từ local để người chơi không phải chờ
	var loaded = load_game_local()
	# Sau đó nạp từ Cloud để đồng bộ bản mới nhất
	load_game_cloud()

func save_game_cloud() -> void:
	var data = get_save_data_dictionary()
	var payload = JSON.stringify(data)
	var url = FIREBASE_RTDB_URL + player_id + ".json"
	var headers = ["Content-Type: application/json"]
	
	http_request_save.request(url, headers, HTTPClient.METHOD_PUT, payload)

func load_game_cloud() -> void:
	var url = FIREBASE_RTDB_URL + player_id + ".json"
	http_request_load.request(url, [], HTTPClient.METHOD_GET)

func _on_save_request_completed(_result: int, response_code: int, _headers: PackedStringArray, _body: PackedByteArray) -> void:
	if response_code == 200:
		emit_signal("save_completed", true, "Đã sao lưu lên Firebase Realtime Database thành công!")
	elif response_code == 401 or response_code == 403:
		print("[Firebase RTDB] Cần mở Rules cho phép đọc ghi (Xem hướng dẫn trong chat).")
	else:
		print("[Firebase RTDB] Save Response Code: %d" % response_code)

func _on_load_request_completed(_result: int, response_code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
	if response_code == 200:
		var response_str = body.get_string_from_utf8()
		if response_str != "null" and response_str != "":
			var json = JSON.new()
			if json.parse(response_str) == OK and json.data is Dictionary:
				apply_save_data_dictionary(json.data)
				emit_signal("load_completed", true, "Đã đồng bộ thế giới mới nhất từ Firebase Đám Mây!")
				GameManager.emit_signal("colony_event", "☁️ [Firebase Cloud] Đã đồng bộ tiến trình thành công từ Đám Mây!")
