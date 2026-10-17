extends CanvasLayer

# The Living Colony - Scientific Ecological HUD Controller

@onready var telemetry_label: Label = $TopBar/TelemetryPill/Label
@onready var biome_label: Label = $TopBar/BiomePill/Label
@onready var weather_label: Label = $TopBar/WeatherPill/Label

@onready var clay_label: Label = $ResourcePanel/VBox/Row1/ClayBox/Count
@onready var wax_label: Label = $ResourcePanel/VBox/Row1/WaxBox/Count
@onready var propolis_label: Label = $ResourcePanel/VBox/Row1/PropolisBox/Count
@onready var protein_label: Label = $ResourcePanel/VBox/Row1/ProteinBox/Count

@onready var honey_label: Label = $ResourcePanel/VBox/Row2/HoneyBox/Count
@onready var seeds_label: Label = $ResourcePanel/VBox/Row2/SeedBox/Count
@onready var ants_label: Label = $ResourcePanel/VBox/Row2/AntBox/Count
@onready var bees_label: Label = $ResourcePanel/VBox/Row2/BeeBox/Count

@onready var toast_panel: PanelContainer = $ToastNotification
@onready var toast_label: Label = $ToastNotification/Label

@onready var journal_dialog: Window = $JournalDialog
@onready var journal_text: RichTextLabel = $JournalDialog/Margin/VBox/Content

var toast_timer: float = 0.0

# Dynamic UI elements for Phase 1 Master GDD
var tool_bar: HBoxContainer
var btn_tool_dig: Button
var btn_tool_fill: Button
var btn_tool_delete: Button
var btn_tool_priority: Button
var priority_dialog: Window
var honey_breakdown_dialog: Window

func _ready() -> void:
	GameManager.resources_updated.connect(_on_resources_updated)
	GameManager.climate_updated.connect(_on_climate_updated)
	GameManager.weather_changed.connect(_on_weather_changed)
	GameManager.colony_event.connect(_show_toast)
	GameManager.pheromone_priority_updated.connect(_on_pheromone_priority_updated)
	
	_create_subterranean_tool_bar()
	_create_pheromone_priority_dialog()
	_create_honey_breakdown_dialog()
	
	_update_all_labels()
	toast_panel.visible = false
	journal_dialog.visible = false

func _create_subterranean_tool_bar() -> void:
	tool_bar = HBoxContainer.new()
	tool_bar.alignment = BoxContainer.ALIGNMENT_CENTER
	tool_bar.add_theme_constant_override("separation", 10)
	tool_bar.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	tool_bar.offset_top = -148.0
	tool_bar.offset_bottom = -112.0
	tool_bar.offset_left = 16.0
	tool_bar.offset_right = -16.0
	add_child(tool_bar)
	
	btn_tool_dig = Button.new()
	btn_tool_dig.text = "⛏️ Đào Hầm (Dig)"
	btn_tool_dig.pressed.connect(_on_tool_dig_pressed)
	tool_bar.add_child(btn_tool_dig)
	
	btn_tool_fill = Button.new()
	btn_tool_fill.text = "🧱 Lấp Bùn (Fill)"
	btn_tool_fill.pressed.connect(_on_tool_fill_pressed)
	tool_bar.add_child(btn_tool_fill)
	
	btn_tool_delete = Button.new()
	btn_tool_delete.text = "🧼 Hủy Lệnh (Delete)"
	btn_tool_delete.pressed.connect(_on_tool_delete_pressed)
	tool_bar.add_child(btn_tool_delete)
	
	btn_tool_priority = Button.new()
	btn_tool_priority.text = "👑 Pheromone Nữ Hoàng (%)"
	btn_tool_priority.pressed.connect(_on_tool_priority_pressed)
	tool_bar.add_child(btn_tool_priority)
	
	var btn_honey_info = Button.new()
	btn_honey_info.text = "🍯 4 Dòng Mật Đơn Hoa"
	btn_honey_info.pressed.connect(func(): honey_breakdown_dialog.popup_centered())
	tool_bar.add_child(btn_honey_info)

func _create_pheromone_priority_dialog() -> void:
	priority_dialog = Window.new()
	priority_dialog.title = "Bảng Điều Tiết Pheromone Nữ Hoàng (Workers Priority)"
	priority_dialog.size = Vector2i(480, 380)
	priority_dialog.visible = false
	add_child(priority_dialog)
	
	var margin = MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 20)
	margin.add_theme_constant_override("margin_top", 20)
	margin.add_theme_constant_override("margin_right", 20)
	margin.add_theme_constant_override("margin_bottom", 20)
	priority_dialog.add_child(margin)
	
	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 12)
	margin.add_child(vbox)
	
	var header = Label.new()
	header.text = "Ý CHÍ PHEROMONE CỦA NỮ HOÀNG (Macro Swarm AI)"
	header.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(header)
	
	var lbl_desc = Label.new()
	lbl_desc.text = "Điều chỉnh tỷ lệ % phân công nhân lực tự động cho toàn bộ thuộc địa:"
	lbl_desc.autowrap_mode = TextServer.AUTOWRAP_WORD
	vbox.add_child(lbl_desc)
	
	# Presets
	var btn_preset_balanced = Button.new()
	btn_preset_balanced.text = "⚖️ Cân Bằng Chuẩn (40% Xây | 30% Ấu trùng | 20% Đào | 10% Kiếm ăn)"
	btn_preset_balanced.pressed.connect(func():
		GameManager.set_pheromone_priority(0.40, 0.30, 0.20, 0.10, "LINEAR")
		priority_dialog.visible = false
	)
	vbox.add_child(btn_preset_balanced)
	
	var btn_preset_dig = Button.new()
	btn_preset_dig.text = "⛏️ Đại Khai Phá Hầm Ngầm (60% Đào | 20% Xây | 10% Ấu trùng | 10% Kiếm ăn)"
	btn_preset_dig.pressed.connect(func():
		GameManager.set_pheromone_priority(0.20, 0.10, 0.60, 0.10, "EXPO")
		priority_dialog.visible = false
	)
	vbox.add_child(btn_preset_dig)
	
	var btn_preset_brood = Button.new()
	btn_preset_brood.text = "🥚 Bùng Nổ Dân Số (50% Nuôi Ấu trùng | 30% Kiếm ăn | 10% Xây | 10% Đào)"
	btn_preset_brood.pressed.connect(func():
		GameManager.set_pheromone_priority(0.10, 0.50, 0.10, 0.30, "EXPO")
		priority_dialog.visible = false
	)
	vbox.add_child(btn_preset_brood)
	
	var btn_preset_forage = Button.new()
	btn_preset_forage.text = "🌸 Mùa Thu Hoạch Mật Hoa Rực Rỡ (60% Kiếm ăn | 20% Xây | 20% Ấu trùng)"
	btn_preset_forage.pressed.connect(func():
		GameManager.set_pheromone_priority(0.20, 0.20, 0.0, 0.60, "EXPO")
		priority_dialog.visible = false
	)
	vbox.add_child(btn_preset_forage)

func _create_honey_breakdown_dialog() -> void:
	honey_breakdown_dialog = Window.new()
	honey_breakdown_dialog.title = "Kho 4 Dòng Mật Ong Đơn Hoa (Monofloral Honeys)"
	honey_breakdown_dialog.size = Vector2i(460, 320)
	honey_breakdown_dialog.visible = false
	add_child(honey_breakdown_dialog)
	
	var margin = MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 20)
	margin.add_theme_constant_override("margin_top", 20)
	margin.add_theme_constant_override("margin_right", 20)
	margin.add_theme_constant_override("margin_bottom", 20)
	honey_breakdown_dialog.add_child(margin)
	
	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 10)
	margin.add_child(vbox)
	
	var lbl_info = Label.new()
	lbl_info.text = "Phân loại 4 dòng mật ong theo nguồn hoa tự nhiên:"
	vbox.add_child(lbl_info)
	
	var lbl_detail = Label.new()
	lbl_detail.name = "HoneyDetail"
	lbl_detail.text = "Đang cập nhật..."
	vbox.add_child(lbl_detail)

func _process(delta: float) -> void:
	if toast_timer > 0.0:
		toast_timer -= delta
		if toast_timer <= 0.0:
			toast_panel.visible = false

func _update_all_labels() -> void:
	_on_climate_updated()
	_on_resources_updated()

func _on_climate_updated() -> void:
	telemetry_label.text = "🌡️ %.1f°C  |  💧 %.0f%% RH  |  💨 %.0f ppm CO2" % [
		GameManager.temperature,
		GameManager.humidity,
		GameManager.co2_level
	]
	biome_label.text = "🌾 " + GameManager.current_biome

func _on_weather_changed(new_weather: String) -> void:
	match new_weather:
		"SUNNY": weather_label.text = "☀️ Nắng Ấm"
		"RAINSTORM": weather_label.text = "🌧️ Mưa Bão"
		"HEATWAVE": weather_label.text = "🔥 Nắng Gắt"
		"WINTER_CHILL": weather_label.text = "❄️ Mùa Đông"

func _on_resources_updated() -> void:
	clay_label.text = "%d viên" % GameManager.clay_mud
	wax_label.text = "%.1fg" % GameManager.beeswax
	propolis_label.text = "%.1fg" % GameManager.propolis
	protein_label.text = "%.1fg (Chitin: %d)" % [GameManager.insect_protein, GameManager.chitin_stock]

	honey_label.text = "%.1fg (4 Dòng)" % GameManager.get_total_honey()
	seeds_label.text = "%d hạt" % GameManager.seeds_stock
	
	var total_ants = GameManager.queen_ant_count + GameManager.minor_nurse_ants + GameManager.media_forager_ants + GameManager.major_soldier_ants
	ants_label.text = "%d con (Lính: %d)" % [total_ants, GameManager.major_soldier_ants]
	
	var total_bees = GameManager.queen_bee_count + GameManager.nurse_bees + GameManager.builder_bees + GameManager.guard_fanner_bees + GameManager.forager_bees
	bees_label.text = "%d con" % total_bees
	
	if honey_breakdown_dialog != null and honey_breakdown_dialog.visible:
		var detail = honey_breakdown_dialog.find_child("HoneyDetail", true, false) as Label
		if detail != null:
			detail.text = "🌺 Wildflower Honey: %.1fg\n🌳 Acacia Honey: %.1fg\n🍀 Clover Honey: %.1fg\n🌸 Blossom Honey: %.1fg\n\n🛡️ Cơ chế bảo tồn đàn: %s (Luôn giữ lại ít nhất 25g mật)" % [
				GameManager.honey_wildflower,
				GameManager.honey_acacia,
				GameManager.honey_clover,
				GameManager.honey_blossom,
				"BẬT" if GameManager.keep_honey_for_bees else "TẮT"
			]

func _on_pheromone_priority_updated() -> void:
	_show_toast("Đã cập nhật Pheromone: %s Mode" % GameManager.priority_mode)

func _show_toast(msg: String) -> void:
	toast_label.text = msg
	toast_panel.visible = true
	toast_timer = 3.5

# --- TOOL BUTTONS ---

func _on_tool_dig_pressed() -> void:
	GameManager.set_tool("DIG")
	_show_toast("Chế độ ĐÀO HẦM (Dig): Nhấp chuột vào các ô đất ngầm để đánh dấu đào!")

func _on_tool_fill_pressed() -> void:
	GameManager.set_tool("FILL")
	_show_toast("Chế độ LẤP BÙN (Fill): Nhấp chuột vào các ô rỗng để đắp bùn chống ngập!")

func _on_tool_delete_pressed() -> void:
	GameManager.set_tool("DELETE")
	_show_toast("Chế độ HỦY LỆNH (Delete): Nhấp chuột vào ô đang chờ thi công để hủy bỏ!")

func _on_tool_priority_pressed() -> void:
	priority_dialog.popup_centered()

# --- CONSTRUCTION BUTTONS ---

func _on_btn_build_chamber_pressed() -> void:
	_on_tool_dig_pressed()

func _on_btn_build_comb_pressed() -> void:
	if GameManager.beeswax >= 6.0 and GameManager.propolis >= 2.0:
		GameManager.beeswax -= 6.0
		GameManager.propolis -= 2.0
		GameManager.emit_signal("colony_event", "🐝 Ong thợ xây đã dùng sáp và keo propolis đắp xong một ô lục giác mới!")
		GameManager.emit_signal("resources_updated")
	else:
		GameManager.emit_signal("colony_event", "⚠️ Chưa đủ sáp hoặc keo propolis! Ong cần ăn thêm mật để tiết sáp.")

# --- WEATHER TESTING CONTROLS ---

func _on_btn_weather_sunny_pressed() -> void:
	GameManager.set_weather("SUNNY")

func _on_btn_weather_rain_pressed() -> void:
	GameManager.set_weather("RAINSTORM")

func _on_btn_weather_heat_pressed() -> void:
	GameManager.set_weather("HEATWAVE")

func _on_btn_weather_winter_pressed() -> void:
	GameManager.set_weather("WINTER_CHILL")

# --- NAVIGATION & JOURNAL ---

func _on_btn_goto_sky_pressed() -> void:
	var cam = get_tree().root.find_child("Camera2D", true, false)
	if cam and cam.has_method("go_to_outworld"):
		cam.go_to_outworld()

func _on_btn_goto_nest_pressed() -> void:
	var cam = get_tree().root.find_child("Camera2D", true, false)
	if cam and cam.has_method("go_to_formicarium"):
		cam.go_to_formicarium()

func _on_btn_journal_pressed() -> void:
	var text = "[b][font_size=20]Biên Niên Sử Bể Vivarium Chân Thực[/font_size][/b]\n\n"
	for entry in StoryManager.get_unlocked_entries():
		text += "[color=#B8653A][b]" + entry["title"] + "[/b][/color] - [i]" + entry["date"] + "[/i]\n"
		text += entry["content"] + "\n\n"
	journal_text.text = text
	journal_dialog.popup_centered()
