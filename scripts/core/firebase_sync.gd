extends Node

# The Living Colony - Dual Save System (Local Disk Auto-Save + Firebase Firestore Cloud Sync)
signal save_completed(is_cloud: bool, message: String)
signal load_completed(is_cloud: bool, message: String)

const LOCAL_SAVE_PATH: String = "user://the_vivarium_save.json"
const FIREBASE_PROJECT_ID: String = "the-vivarium"
const FIRESTORE_BASE_URL: String = "https://firestore.googleapis.com/v1/projects/" + FIREBASE_PROJECT_ID + "/databases/(default)/documents/saves/"

var player_id: String = "default_keeper"
var auto_save_timer: float = 0.0
const AUTO_SAVE_INTERVAL: float = 120.0 # Tự động lưu mỗi 2 phút

var http_request: HTTPRequest

func _ready() -> void:
	http_request = HTTPRequest.new()
	add_child(http_request)
	http_request.request_completed.connect(_on_http_request_completed)
	
	print("[The Vivarium - Save System] Dual-Save Controller initialized.")
	# Tự động nạp bản lưu gần nhất nếu có
	call_deferred("load_game_local")

func _process(delta: float) -> void:
	auto_save_timer += delta
	if auto_save_timer >= AUTO_SAVE_INTERVAL:
		auto_save_timer = 0.0
		save_game_all("Auto-save tự động")

func get_save_data_dictionary() -> Dictionary:
	return {
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

# --- 2. FIREBASE FIRESTORE CLOUD SAVE (Online Sync) ---

func save_game_all(reason: String = "") -> void:
	save_game_local()
	save_game_cloud()
	var msg = "💾 [Lưu Game] Tiến trình đã được bảo vệ (Ổ cứng + Đám mây Firebase)!"
	if reason != "":
		msg += " (" + reason + ")"
	GameManager.emit_signal("colony_event", msg)

func save_game_cloud() -> void:
	var data = get_save_data_dictionary()
	var json_str = JSON.stringify(data)
	
	# Định dạng Firestore Document REST API
	var firestore_doc = {
		"fields": {
			"save_json": {
				"stringValue": json_str
			},
			"last_updated": {
				"stringValue": Time.get_datetime_string_from_system()
			}
		}
	}
	
	var payload = JSON.stringify(firestore_doc)
	var url = FIRESTORE_BASE_URL + player_id
	var headers = ["Content-Type: application/json"]
	
	# Gửi request PATCH để tạo hoặc cập nhật document
	http_request.request(url, headers, HTTPClient.METHOD_PATCH, payload)

func load_game_cloud() -> void:
	var url = FIRESTORE_BASE_URL + player_id
	http_request.request(url, [], HTTPClient.METHOD_GET)

func _on_http_request_completed(_result: int, response_code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
	if response_code == 200:
		var response_str = body.get_string_from_utf8()
		var json = JSON.new()
		if json.parse(response_str) == OK and json.data is Dictionary:
			var fields = json.data.get("fields", {})
			if fields.has("save_json"):
				var raw_json = fields["save_json"].get("stringValue", "")
				var inner_json = JSON.new()
				if inner_json.parse(raw_json) == OK and inner_json.data is Dictionary:
					apply_save_data_dictionary(inner_json.data)
					emit_signal("load_completed", true, "Đã đồng bộ thế giới từ Firebase Firestore!")
					GameManager.emit_signal("colony_event", "☁️ [Firebase Sync] Đã đồng bộ tiến trình thành công từ Đám Mây!")
	elif response_code != 0:
		print("[Firebase Cloud Sync] Response Code: %d (Sẽ thử lại ở chu kỳ kế tiếp)" % response_code)
